import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity, Shield, Bell, Settings as SettingsIcon,
  Sun, Moon, Flame, Download, Webhook, Crosshair, Gauge,
  Package, Briefcase, Server,
} from "lucide-react";
import { toast } from "sonner";

import SplashScreen from "@/components/SplashScreen";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import HomeFeed from "@/components/tabs/HomeFeed";
import SentinelMonitor from "@/components/tabs/SentinelMonitor";
import Notifications from "@/components/tabs/Notifications";
import SettingsTab from "@/components/tabs/Settings";
import IntegrationsTab from "@/components/tabs/Integrations";
import CompetitorFeed from "@/components/tabs/CompetitorFeed";
import TelemetryVisualizer from "@/components/tabs/TelemetryVisualizer";
import PackageTracker from "@/components/tabs/PackageTracker";
import JobBoardAggregator from "@/components/tabs/JobBoardAggregator";
import CloudInfraAnalyzer from "@/components/tabs/CloudInfraAnalyzer";
import OutreachPage from "@/components/OutreachPage";
import OnboardingTour, { isNewUser } from "@/components/OnboardingTour";
import DemoBanner from "@/components/DemoBanner";
import { useLeads } from "@/hooks/useLeads";
import { useHotAlert } from "@/hooks/useHotAlert";
import { useLiveStream } from "@/hooks/useLiveStream";
import type { Lead } from "@/hooks/useLeads";

// ─── Theme Context ────────────────────────────────────────────────────────────
type Theme = "dark" | "light";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: "dark", toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

// ─── Tab config ───────────────────────────────────────────────────────────────
type Tab = "feed" | "intercept" | "packages" | "jobs" | "infra" | "telemetry" | "sentinel" | "notifications" | "settings" | "integrations";

const ALL_TAB_IDS: Tab[] = ["feed","intercept","packages","jobs","infra","telemetry","sentinel","notifications","settings","integrations"];

const LS_TAB_KEY = "zenrows_intel_last_tab";

function getSavedTab(): Tab {
  try {
    const v = localStorage.getItem(LS_TAB_KEY) as Tab | null;
    if (v && (ALL_TAB_IDS as string[]).includes(v)) return v;
  } catch {}
  return "feed";
}

const TABS: { id: Tab; label: string; mobileLabel: string; icon: React.ReactNode }[] = [
  { id: "feed",          label: "Real Leads",   mobileLabel: "Leads",    icon: <Activity     className="w-5 h-5" /> },
  { id: "intercept",     label: "Intercept",    mobileLabel: "Intercept", icon: <Crosshair   className="w-5 h-5" /> },
  { id: "packages",      label: "Packages",     mobileLabel: "Pkgs",     icon: <Package      className="w-5 h-5" /> },
  { id: "jobs",          label: "Job Board",    mobileLabel: "Jobs",     icon: <Briefcase    className="w-5 h-5" /> },
  { id: "infra",         label: "IP Logs",      mobileLabel: "Infra",    icon: <Server       className="w-5 h-5" /> },
  { id: "telemetry",     label: "Telemetry",    mobileLabel: "Telemetry", icon: <Gauge       className="w-5 h-5" /> },
  { id: "sentinel",      label: "Monitor",      mobileLabel: "Monitor",  icon: <Shield       className="w-5 h-5" /> },
  { id: "notifications", label: "Analytics",    mobileLabel: "Stats",    icon: <Bell         className="w-5 h-5" /> },
  { id: "integrations",  label: "Webhooks",     mobileLabel: "Webhooks", icon: <Webhook      className="w-5 h-5" /> },
  { id: "settings",      label: "Settings",     mobileLabel: "Settings", icon: <SettingsIcon className="w-5 h-5" /> },
];

const MOBILE_TABS: Tab[] = ["feed", "intercept", "packages", "integrations"];

const TAB_TITLES: Record<Tab, string> = {
  feed:          "Real Leads",
  intercept:     "Competitor Intercept Feed",
  packages:      "Open-Source Package Registry Tracker",
  jobs:          "Corporate Job Board Aggregator",
  infra:         "Cloud Infrastructure & Reverse DNS Analyzer",
  telemetry:     "Client Telemetry Visualizer",
  sentinel:      "Gateway Monitor",
  notifications: "Analytics & Activity",
  settings:      "Engine Settings",
  integrations:  "Integrations & Webhooks",
};

const TAB_SUBTITLES: Record<Tab, string> = {
  feed:          "Real-time developer pain signals · 2026 only · sorted by urgency",
  intercept:     "Developers frustrated with Bright Data, Oxylabs, ScraperAPI, Crawlbase, Webshare · churn-risk scoring · ready-to-send outreach",
  packages:      "npm · PyPI · GitHub stars/issues · download velocity · early-stage scraping project detection",
  jobs:          "LinkedIn · Indeed · Glassdoor · Lever · Greenhouse · companies hiring web scrapers & automation architects",
  infra:         "AWS · DigitalOcean · Hetzner clusters · reverse DNS footprint · high-bandwidth automation pipelines",
  telemetry:     "Enterprise concurrency tracking · credit spend multipliers · 429 pre-emption circuit · live domain headroom",
  sentinel:      "Live ZenRows API gateway telemetry · anti-bot circuit breaker armed · updates every 2s",
  notifications: "Lead analytics, intake trends, keyword signals, and live activity log",
  settings:      "Keyword management, API status, engine configuration",
  integrations:  "Scraping API gateway endpoints · auto session rotation · webhook config",
};

const tabVariants = {
  enter:  { opacity: 0, y: 10 },
  center: { opacity: 1, y: 0 },
  exit:   { opacity: 0, y: -6 },
};

// ─── ZenRows logo (nav) — pitch black treatment ───────────────────────────────
function NavLogo({ size = "md" }: { size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-6 h-6" : "w-7 h-7";
  return (
    <div
      className={`${dim} rounded-lg overflow-hidden shrink-0`}
      style={{
        background: "#000000",
        border: "1px solid rgba(0,0,0,0.8)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.6)",
      }}
    >
      <img
        src={`${import.meta.env.BASE_URL}zenrows-logo.jpg`}
        alt="ZenRows"
        className="w-full h-full object-cover"
        style={{ objectPosition: "8% center", filter: "brightness(0)" }}
      />
    </div>
  );
}

// ─── Snapchat-style hot lead toast ───────────────────────────────────────────
function HotLeadToast({ lead, count, onView, onDismiss }: {
  lead: Lead; count: number; onView: () => void; onDismiss: () => void;
}) {
  return (
    <div
      className="relative flex items-start gap-3 px-4 py-3.5 rounded-2xl overflow-hidden min-w-[300px] max-w-[360px] shadow-2xl"
      style={{
        background: "linear-gradient(135deg, #0f0f1a 0%, #1a0a0a 100%)",
        border: "1px solid rgba(239,68,68,0.25)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(239,68,68,0.15), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Left pulse bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: "linear-gradient(180deg, #ef4444, #f97316)" }}
      />

      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
        style={{
          background: "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(249,115,22,0.15))",
          border: "1px solid rgba(239,68,68,0.25)",
        }}
      >
        🔥
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-xs font-bold text-red-400 tracking-wide uppercase">
            {count > 1 ? `${count} Hot Signals!` : "New Hot Signal"}
          </span>
          <button onClick={onDismiss} className="shrink-0 text-zinc-600 hover:text-zinc-400 transition-colors">
            <span className="text-xs">✕</span>
          </button>
        </div>
        <p className="text-xs text-zinc-300 leading-snug line-clamp-2 mb-2.5">
          {lead.title.length > 70 ? lead.title.slice(0, 67) + "…" : lead.title}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-600 font-mono bg-zinc-800/60 px-1.5 py-0.5 rounded-md">
            {lead.source} · score {lead.score}
          </span>
          <button
            onClick={onView}
            className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
            style={{
              background: "linear-gradient(135deg, #ef4444, #f97316)",
              color: "#fff",
              boxShadow: "0 4px 12px rgba(239,68,68,0.3)",
            }}
          >
            View Lead →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Live Empty State — "Listening for Ingress…" animated pulse ──────────────
function LiveEmptyState({ title, onGoToIntegrations }: { title: string; onGoToIntegrations: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 py-20 text-center">

      {/* Animated radar rings */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              border: "1px solid rgba(0,255,179,0.25)",
              width: 40 + i * 22,
              height: 40 + i * 22,
            }}
            animate={{ opacity: [0.7, 0, 0.7], scale: [1, 1.08, 1] }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              delay: i * 0.55,
              ease: "easeInOut",
            }}
          />
        ))}
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center z-10"
          style={{
            background: "rgba(0,255,179,0.08)",
            border: "1px solid rgba(0,255,179,0.2)",
            boxShadow: "0 0 16px rgba(0,255,179,0.1)",
          }}
        >
          <Activity className="w-5 h-5" style={{ color: "#00ffb3" }} />
        </div>
      </div>

      <div className="flex flex-col gap-2 items-center">
        {/* Animated "Listening for Ingress..." label */}
        <div className="flex items-center gap-2">
          <motion.span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#00ffb3" }}
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span
            className="text-xs font-bold tracking-[0.2em] uppercase"
            style={{ color: "#00ffb3" }}
          >
            Listening for Ingress…
          </span>
        </div>

        <div className="text-sm font-semibold dark:text-zinc-300 text-zinc-700 mt-1">
          {title} · Live Mode Active
        </div>
        <div className="text-xs dark:text-zinc-600 text-zinc-500 max-w-[280px] leading-relaxed">
          Charts and logs populate automatically the moment live data hits your connected endpoints.
        </div>
      </div>

      {/* Skeleton pulse bars — simulates "waiting for chart data" */}
      <div className="w-full max-w-sm flex flex-col gap-2 px-2">
        {[0.9, 0.65, 0.75, 0.5].map((w, i) => (
          <motion.div
            key={i}
            className="h-1.5 rounded-full"
            style={{ width: `${w * 100}%` }}
            animate={{ opacity: [0.07, 0.18, 0.07] }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              delay: i * 0.25,
              ease: "easeInOut",
            }}
          >
            <div
              className="w-full h-full rounded-full"
              style={{ background: "rgba(0,255,179,0.5)" }}
            />
          </motion.div>
        ))}
      </div>

      <button
        onClick={onGoToIntegrations}
        className="mt-1 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all active:scale-95"
        style={{
          color: "#00ffb3",
          background: "rgba(0,255,179,0.07)",
          border: "1px solid rgba(0,255,179,0.18)",
        }}
      >
        Configure Integrations →
      </button>
    </div>
  );
}

// ─── Desktop top nav ──────────────────────────────────────────────────────────
function TopNav({
  activeTab, onTabChange, theme, onToggleTheme, hotCount, mode, onToggleMode,
}: {
  activeTab: Tab; onTabChange: (t: Tab) => void;
  theme: Theme; onToggleTheme: () => void; hotCount: number;
  mode: "demo" | "live"; onToggleMode: () => void;
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-14 flex items-center px-4 gap-3
      dark:bg-[#07070e]/92 bg-white/92 backdrop-blur-xl
      border-b dark:border-zinc-800/70 border-zinc-200"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0 mr-1">
        <NavLogo size="md" />
        <span className="font-bold text-sm tracking-tight dark:text-zinc-100 text-zinc-900">
          ZenRows<span style={{ color: "#00ffb3" }}></span>
          <span className="hidden lg:inline text-[10px] font-normal dark:text-zinc-600 text-zinc-400 ml-1.5 tracking-normal">Intel Engine</span>
        </span>
        {hotCount > 0 && (
          <motion.span
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20"
          >
            <Flame className="w-2.5 h-2.5" /> {hotCount} hot
          </motion.span>
        )}
      </div>

      {/* Tabs */}
      <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 whitespace-nowrap
              ${activeTab === tab.id
                ? "dark:text-zinc-100 text-zinc-900"
                : "dark:text-zinc-500 text-zinc-500 hover:dark:text-zinc-300 hover:text-zinc-700"
              }`}
          >
            {activeTab === tab.id && (
              <motion.span
                layoutId="top-nav-pill"
                className="absolute inset-0 rounded-lg dark:bg-zinc-800 bg-zinc-100"
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              <span className="[&>svg]:w-3.5 [&>svg]:h-3.5">{tab.icon}</span>
              <span className="hidden md:inline">{tab.label}</span>
            </span>
          </button>
        ))}
      </nav>

      {/* Controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Demo / Live mode toggle — pill switch */}
        <div
          className="hidden sm:flex items-center gap-2"
          title={mode === "demo" ? "Switch to Live mode — clears simulated data, listens for real ingress" : "Switch to Demo mode — show pre-configured intelligence data"}
        >
          <span
            className="text-[10px] font-bold tracking-wider uppercase transition-all duration-200"
            style={{ color: mode === "demo" ? "#f59e0b" : "rgba(245,158,11,0.3)" }}
          >
            Demo
          </span>
          <button
            onClick={onToggleMode}
            className="relative w-10 h-5 rounded-full transition-colors duration-300 shrink-0 active:scale-95"
            style={{
              background: mode === "live"
                ? "linear-gradient(135deg, rgba(0,200,122,0.35), rgba(0,255,179,0.25))"
                : "rgba(245,158,11,0.18)",
              border: mode === "live"
                ? "1px solid rgba(0,255,179,0.35)"
                : "1px solid rgba(245,158,11,0.3)",
              boxShadow: mode === "live"
                ? "0 0 10px rgba(0,255,179,0.12)"
                : "none",
            }}
            aria-label={`Switch to ${mode === "demo" ? "live" : "demo"} mode`}
          >
            <motion.div
              className="absolute top-[3px] w-3.5 h-3.5 rounded-full shadow-sm"
              animate={{ x: mode === "live" ? 20 : 3 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              style={{
                background: mode === "live"
                  ? "linear-gradient(135deg, #00c87a, #00ffb3)"
                  : "#f59e0b",
                boxShadow: mode === "live"
                  ? "0 0 8px rgba(0,255,179,0.5)"
                  : "0 0 6px rgba(245,158,11,0.4)",
              }}
            />
          </button>
          <span
            className="text-[10px] font-bold tracking-wider uppercase transition-all duration-200"
            style={{ color: mode === "live" ? "#00ffb3" : "rgba(0,255,179,0.3)" }}
          >
            Live
          </span>
        </div>

        <a
          href="/api/activity/export/csv"
          download
          className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
            dark:text-zinc-400 text-zinc-500 dark:bg-zinc-900 bg-zinc-50
            dark:border dark:border-zinc-800 border border-zinc-200
            hover:dark:bg-zinc-800 hover:bg-zinc-100 transition-colors"
          onClick={() => toast.success("Exporting leads as CSV…")}
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </a>
        <button
          onClick={onToggleTheme}
          aria-label="Toggle theme"
          className="w-8 h-8 rounded-lg flex items-center justify-center
            dark:bg-zinc-900 bg-zinc-100 dark:border dark:border-zinc-800 border border-zinc-200
            hover:dark:bg-zinc-800 hover:bg-zinc-200 transition-colors"
        >
          <AnimatePresence mode="wait" initial={false}>
            {theme === "dark" ? (
              <motion.span key="sun"
                initial={{ opacity: 0, rotate: -30 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 30 }}
                transition={{ duration: 0.15 }}
              >
                <Sun className="w-3.5 h-3.5 text-zinc-400" />
              </motion.span>
            ) : (
              <motion.span key="moon"
                initial={{ opacity: 0, rotate: 30 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -30 }}
                transition={{ duration: 0.15 }}
              >
                <Moon className="w-3.5 h-3.5 text-zinc-500" />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </header>
  );
}

// ─── Mobile bottom nav ────────────────────────────────────────────────────────
function BottomNav({ activeTab, onTabChange, hotCount }: {
  activeTab: Tab; onTabChange: (t: Tab) => void; hotCount: number;
}) {
  const mobileTabs = TABS.filter((t) => MOBILE_TABS.includes(t.id));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 h-16
      dark:bg-[#07070e]/95 bg-white/95 backdrop-blur-xl
      border-t dark:border-zinc-800 border-zinc-200
      flex items-center justify-around px-2"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {mobileTabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const showBadge = tab.id === "feed" && hotCount > 0;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="relative flex flex-col items-center justify-center gap-0.5 flex-1 h-12 rounded-xl"
          >
            {isActive && (
              <motion.span
                layoutId="bottom-pill"
                className="absolute inset-0 rounded-xl dark:bg-zinc-800/80 bg-zinc-100"
                transition={{ type: "spring", stiffness: 450, damping: 30 }}
              />
            )}
            <span className={`relative [&>svg]:w-5 [&>svg]:h-5 transition-colors duration-150
              ${isActive ? "dark:text-zinc-100 text-zinc-900" : "dark:text-zinc-600 text-zinc-400"}`}>
              {tab.icon}
            </span>
            <span className={`relative text-[9px] font-semibold transition-colors duration-150 leading-none
              ${isActive ? "dark:text-zinc-200 text-zinc-700" : "dark:text-zinc-600 text-zinc-400"}`}>
              {tab.mobileLabel}
            </span>
            {showBadge && (
              <span className="absolute top-1 right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-[8px] font-black text-white">{Math.min(hotCount, 99)}</span>
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}

// ─── Hot alert flash ring ─────────────────────────────────────────────────────
function HotFlashOverlay({ active }: { active: boolean }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="flash"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.6, 1, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.8, times: [0, 0.1, 0.4, 0.6, 1] }}
          className="fixed inset-0 z-20 pointer-events-none border-[3px] border-red-500/50 rounded-none"
          style={{ boxShadow: "inset 0 0 40px rgba(239,68,68,0.15)" }}
        />
      )}
    </AnimatePresence>
  );
}

// ─── Root Dashboard ───────────────────────────────────────────────────────────
const LS_MODE_KEY = "zenrows_intel_mode";
function getSavedMode(): "demo" | "live" {
  try {
    const v = localStorage.getItem(LS_MODE_KEY);
    if (v === "live") return "live";
  } catch {}
  return "demo";
}

export default function Dashboard() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [showSplash, setShowSplash] = useState(true);
  const [showTour, setShowTour] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>(getSavedTab());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [outreachLead, setOutreachLead] = useState<Lead | null>(null);
  const [highlightedLeadId, setHighlightedLeadId] = useState<string | null>(null);
  const [mode, setMode] = useState<"demo" | "live">(getSavedMode);

  const { data } = useLeads();
  const leads = data?.leads ?? [];
  const hotCount = leads.filter((l) => l.tier === "hot").length;

  // SSE live stream — only active when mode === "live"
  const liveStream = useLiveStream(mode === "live");

  // Apply theme to <html>
  useEffect(() => {
    const html = document.documentElement;
    theme === "dark" ? html.classList.add("dark") : html.classList.remove("dark");
  }, [theme]);

  // Persist active tab
  useEffect(() => {
    try { localStorage.setItem(LS_TAB_KEY, activeTab); } catch {}
  }, [activeTab]);

  // After splash clears, show tour for new users
  const handleSplashDone = useCallback(() => {
    setShowSplash(false);
    if (isNewUser()) {
      setTimeout(() => setShowTour(true), 400);
    }
  }, []);

  const [pendingModeSwitch, setPendingModeSwitch] = useState(false);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const toggleSound = () => setSoundEnabled((s) => !s);

  const applyToggleMode = () => setMode((m) => {
    const next = m === "demo" ? "live" : "demo";
    try { localStorage.setItem(LS_MODE_KEY, next); } catch {}
    return next;
  });

  const toggleMode = () => setPendingModeSwitch(true);

  const handleTabChange = useCallback((tab: Tab) => {
    setActiveTab(tab);
    setOutreachLead(null);
  }, []);

  // Navigate to feed and highlight a specific lead
  const navigateToLead = useCallback((lead: Lead) => {
    setActiveTab("feed");
    setOutreachLead(null);
    // Small delay to let tab transition finish
    setTimeout(() => setHighlightedLeadId(lead.id), 200);
  }, []);

  // Hot lead alerts — Snapchat-style custom toast
  const handleNewHotLeads = useCallback((newLeads: Lead[]) => {
    const count = newLeads.length;
    const first = newLeads[0];

    toast.custom(
      (t) => (
        <HotLeadToast
          lead={first}
          count={count}
          onView={() => {
            toast.dismiss(t);
            navigateToLead(first);
          }}
          onDismiss={() => toast.dismiss(t)}
        />
      ),
      {
        duration: 10000,
        position: "top-right",
      },
    );
  }, [navigateToLead]);

  const { flashActive } = useHotAlert(leads, soundEnabled, handleNewHotLeads);

  return (
    <ThemeContext.Provider value={{ theme, toggle: toggleTheme }}>

      {/* ── Splash screen (always on page load) ── */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.5, ease: "easeIn" }}
            style={{ zIndex: 100, position: "fixed", inset: 0 }}
          >
            <SplashScreen onDone={handleSplashDone} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Onboarding tour (new users only) ── */}
      <AnimatePresence>
        {showTour && (
          <OnboardingTour onClose={() => setShowTour(false)} />
        )}
      </AnimatePresence>

      {/* ── Hot alert flash ring ── */}
      <HotFlashOverlay active={flashActive} />

      {/* ── Main app ── */}
      <div className="min-h-screen dark:bg-[#07070e] bg-[#f6f6fc]" style={{ fontFamily: "'Inter', sans-serif" }}>

        {/* Desktop top nav */}
        <div className="hidden sm:block">
          <TopNav
            activeTab={activeTab} onTabChange={handleTabChange}
            theme={theme} onToggleTheme={toggleTheme} hotCount={hotCount}
            mode={mode} onToggleMode={toggleMode}
          />
        </div>

        {/* Mobile top bar */}
        <div className="sm:hidden fixed top-0 left-0 right-0 z-30 h-12 flex items-center justify-between px-4
          dark:bg-[#07070e]/90 bg-white/90 backdrop-blur-xl border-b dark:border-zinc-800/70 border-zinc-200"
        >
          <div className="flex items-center gap-2">
            <NavLogo size="sm" />
            <span className="font-bold text-[13px] dark:text-zinc-100 text-zinc-900">
              ZenRows<span style={{ color: "#00ffb3" }}></span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hotCount > 0 && (
              <motion.span
                initial={{ scale: 0.7 }}
                animate={{ scale: 1 }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-400 border border-red-500/20"
              >
                <Flame className="w-2.5 h-2.5" /> {hotCount}
              </motion.span>
            )}
            {/* Mobile Demo/Live toggle */}
            <div className="flex items-center gap-1.5">
              <span
                className="text-[9px] font-bold tracking-wider uppercase transition-all duration-200"
                style={{ color: mode === "demo" ? "#f59e0b" : "rgba(245,158,11,0.3)" }}
              >
                D
              </span>
              <button
                onClick={toggleMode}
                className="relative w-8 h-4 rounded-full transition-colors duration-300"
                style={{
                  background: mode === "live"
                    ? "rgba(0,200,122,0.3)"
                    : "rgba(245,158,11,0.18)",
                  border: mode === "live"
                    ? "1px solid rgba(0,255,179,0.3)"
                    : "1px solid rgba(245,158,11,0.3)",
                }}
              >
                <motion.div
                  className="absolute top-[2px] w-2.5 h-2.5 rounded-full"
                  animate={{ x: mode === "live" ? 17 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  style={{
                    background: mode === "live" ? "#00ffb3" : "#f59e0b",
                  }}
                />
              </button>
              <span
                className="text-[9px] font-bold tracking-wider uppercase transition-all duration-200"
                style={{ color: mode === "live" ? "#00ffb3" : "rgba(0,255,179,0.3)" }}
              >
                L
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className="w-7 h-7 rounded-lg flex items-center justify-center dark:bg-zinc-900 bg-zinc-100 dark:border dark:border-zinc-800 border border-zinc-200"
            >
              {theme === "dark" ? <Sun className="w-3 h-3 text-zinc-400" /> : <Moon className="w-3 h-3 text-zinc-500" />}
            </button>
            <button
              onClick={() => handleTabChange("settings")}
              className={`w-7 h-7 rounded-lg flex items-center justify-center dark:bg-zinc-900 bg-zinc-100 dark:border dark:border-zinc-800 border border-zinc-200
                ${activeTab === "settings" ? "dark:text-zinc-100 text-zinc-900" : "dark:text-zinc-500 text-zinc-400"}`}
            >
              <SettingsIcon className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Content area */}
        <main className="mx-auto max-w-3xl px-4 pt-[calc(3rem+1rem)] pb-[calc(4.5rem+1.5rem)] sm:pt-[calc(3.5rem+1.5rem)] sm:pb-10">

          {/* Desktop page heading */}
          <div className="hidden sm:flex items-center justify-between mb-5">
            <div>
              <h1 className="text-lg font-bold dark:text-zinc-100 text-zinc-900 tracking-tight">
                {outreachLead && activeTab === "feed" ? "Reach Out to Client" : TAB_TITLES[activeTab]}
              </h1>
              <p className="text-xs dark:text-zinc-500 text-zinc-500 mt-0.5">
                {outreachLead && activeTab === "feed"
                  ? "Copy a ready-made message and send it directly to the lead"
                  : TAB_SUBTITLES[activeTab]
                }
              </p>
            </div>
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait" initial={false}>
            {outreachLead && activeTab === "feed" ? (
              <motion.div
                key="outreach"
                variants={tabVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.18, ease: "easeOut" }}
                style={{ willChange: "opacity, transform" }}
              >
                <OutreachPage
                  lead={outreachLead}
                  onBack={() => setOutreachLead(null)}
                />
              </motion.div>
            ) : (
              <motion.div
                key={activeTab}
                variants={tabVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.18, ease: "easeOut" }}
                style={{ willChange: "opacity, transform" }}
              >
                {activeTab === "feed" && (
                  mode === "live"
                    ? <LiveEmptyState title="Real Leads Pipeline" onGoToIntegrations={() => handleTabChange("integrations")} />
                    : <HomeFeed
                        mode={mode}
                        onReachOut={(lead) => setOutreachLead(lead)}
                        highlightedLeadId={highlightedLeadId}
                        onClearHighlight={() => setHighlightedLeadId(null)}
                      />
                )}
                {activeTab === "intercept" && (
                  mode === "live"
                    ? <LiveEmptyState title="Competitor Intercept" onGoToIntegrations={() => handleTabChange("integrations")} />
                    : <CompetitorFeed />
                )}
                {activeTab === "packages" && (
                  <PackageTracker mode={mode} livePackages={liveStream.packages} />
                )}
                {activeTab === "jobs" && (
                  <JobBoardAggregator mode={mode} liveJobs={liveStream.jobs} />
                )}
                {activeTab === "infra" && (
                  <CloudInfraAnalyzer mode={mode} liveInfra={liveStream.infra} />
                )}
                {activeTab === "telemetry" && (
                  mode === "live"
                    ? <LiveEmptyState title="Client Telemetry" onGoToIntegrations={() => handleTabChange("integrations")} />
                    : <TelemetryVisualizer />
                )}
                {activeTab === "sentinel" && (
                  mode === "live"
                    ? <LiveEmptyState title="Gateway Monitor" onGoToIntegrations={() => handleTabChange("integrations")} />
                    : <SentinelMonitor />
                )}
                {activeTab === "notifications" && (
                  mode === "live"
                    ? <LiveEmptyState title="Analytics" onGoToIntegrations={() => handleTabChange("integrations")} />
                    : <Notifications />
                )}
                {activeTab === "integrations" && <IntegrationsTab />}
                {activeTab === "settings" && (
                  <SettingsTab
                    theme={theme}
                    onToggleTheme={toggleTheme}
                    soundEnabled={soundEnabled}
                    onToggleSound={toggleSound}
                    onReplayTour={() => {
                      localStorage.removeItem("zenrows_intel_onboarded");
                      setShowTour(true);
                    }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Mobile bottom nav */}
        <div className="sm:hidden">
          <BottomNav activeTab={activeTab} onTabChange={handleTabChange} hotCount={hotCount} />
        </div>
      </div>

      {/* ── Demo / Live mode switch confirmation ── */}
      <ConfirmDialog
        open={pendingModeSwitch}
        variant={mode === "demo" ? "info" : "warning"}
        title={mode === "demo" ? "Switch to Live Mode?" : "Switch to Demo Mode?"}
        message={mode === "demo"
          ? "Live mode listens for real ingress from your configured webhooks and API keys. Simulated demo data will be hidden."
          : "Demo mode shows pre-configured sample data. Live ingestion will be paused until you switch back."
        }
        detail={mode === "demo"
          ? "Make sure your webhook endpoints and API integrations are configured before switching."
          : "Any claimed leads and notes from the current session are preserved."
        }
        confirmLabel={mode === "demo" ? "Switch to Live →" : "Switch to Demo →"}
        cancelLabel="Stay in current mode"
        onConfirm={() => { setPendingModeSwitch(false); applyToggleMode(); }}
        onCancel={() => setPendingModeSwitch(false)}
      />
    </ThemeContext.Provider>
  );
}
