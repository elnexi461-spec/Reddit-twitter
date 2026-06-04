import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity, Shield, Bell, Settings as SettingsIcon,
  Sun, Moon, Flame, Download, Webhook,
} from "lucide-react";
import { toast } from "sonner";

import SplashScreen from "@/components/SplashScreen";
import HomeFeed from "@/components/tabs/HomeFeed";
import SentinelMonitor from "@/components/tabs/SentinelMonitor";
import Notifications from "@/components/tabs/Notifications";
import SettingsTab from "@/components/tabs/Settings";
import IntegrationsTab from "@/components/tabs/Integrations";
import OutreachPage from "@/components/OutreachPage";
import { useLeads } from "@/hooks/useLeads";
import { useHotAlert } from "@/hooks/useHotAlert";
import type { Lead } from "@/hooks/useLeads";

// ─── Theme Context ────────────────────────────────────────────────────────────
type Theme = "dark" | "light";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: "dark", toggle: () => {} });
export const useTheme = () => useContext(ThemeContext);

// ─── Tab config ───────────────────────────────────────────────────────────────
type Tab = "feed" | "sentinel" | "notifications" | "settings" | "integrations";

const TABS: { id: Tab; label: string; mobileLabel: string; icon: React.ReactNode }[] = [
  { id: "feed",          label: "Live Feed",     mobileLabel: "Feed",    icon: <Activity     className="w-5 h-5" /> },
  { id: "sentinel",      label: "Alpha Monitor",  mobileLabel: "Alpha",   icon: <Shield       className="w-5 h-5" /> },
  { id: "notifications", label: "Analytics",     mobileLabel: "Stats",   icon: <Bell         className="w-5 h-5" /> },
  { id: "integrations",  label: "Integrations",  mobileLabel: "Webhooks",icon: <Webhook      className="w-5 h-5" /> },
  { id: "settings",      label: "Settings",      mobileLabel: "Settings",icon: <SettingsIcon className="w-5 h-5" /> },
];

// Mobile nav shows only 4 most-used tabs; Settings accessed via desktop
const MOBILE_TABS: Tab[] = ["feed", "sentinel", "notifications", "integrations"];

const TAB_TITLES: Record<Tab, string> = {
  feed:          "Live Intelligence Feed",
  sentinel:      "Alpha Monitor",
  notifications: "Analytics & Activity",
  settings:      "Engine Settings",
  integrations:  "Integrations & Webhooks",
};

const TAB_SUBTITLES: Record<Tab, string> = {
  feed:          "Real-time proxy buyer signals · 2026 only · sorted by recency",
  sentinel:      "Live proxy infrastructure telemetry · circuit-breaker armed · updates every 2s",
  notifications: "Lead analytics, pipeline funnel, and activity log",
  settings:      "Keyword management, API status, engine configuration",
  integrations:  "Node management endpoints · auto IP replacement · webhook config",
};

const tabVariants = {
  enter:  { opacity: 0, y: 10 },
  center: { opacity: 1, y: 0 },
  exit:   { opacity: 0, y: -6 },
};

// ─── Desktop top nav ──────────────────────────────────────────────────────────
function TopNav({
  activeTab, onTabChange, theme, onToggleTheme, hotCount,
}: {
  activeTab: Tab; onTabChange: (t: Tab) => void;
  theme: Theme; onToggleTheme: () => void; hotCount: number;
}) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-14 flex items-center px-4 gap-3
      dark:bg-[#07070e]/92 bg-white/92 backdrop-blur-xl
      border-b dark:border-zinc-800/70 border-zinc-200"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0 mr-1">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            border: "1px solid rgba(59,130,246,0.3)",
            boxShadow: "0 0 8px rgba(59,130,246,0.15)",
          }}
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none">
            <circle cx="12" cy="12" r="2.5" fill="#3b82f6" />
            <circle cx="5" cy="7" r="1.5" fill="#60a5fa" opacity="0.8" />
            <circle cx="19" cy="7" r="1.5" fill="#60a5fa" opacity="0.8" />
            <circle cx="5" cy="17" r="1.5" fill="#60a5fa" opacity="0.8" />
            <circle cx="19" cy="17" r="1.5" fill="#60a5fa" opacity="0.8" />
            <line x1="12" y1="12" x2="5" y2="7" stroke="#3b82f6" strokeWidth="0.8" opacity="0.7" />
            <line x1="12" y1="12" x2="19" y2="7" stroke="#3b82f6" strokeWidth="0.8" opacity="0.7" />
            <line x1="12" y1="12" x2="5" y2="17" stroke="#3b82f6" strokeWidth="0.8" opacity="0.7" />
            <line x1="12" y1="12" x2="19" y2="17" stroke="#3b82f6" strokeWidth="0.8" opacity="0.7" />
          </svg>
        </div>
        <span className="font-bold text-sm tracking-tight dark:text-zinc-100 text-zinc-900">
          Proxies<span className="text-blue-400">.sx</span>
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
        <a
          href="/api/activity/export/csv"
          download
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
            dark:text-zinc-400 text-zinc-500 dark:bg-zinc-900 bg-zinc-50
            dark:border dark:border-zinc-800 border border-zinc-200
            hover:dark:bg-zinc-800 hover:bg-zinc-100 transition-colors"
          onClick={() => toast.success("Exporting leads as CSV…")}
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Export CSV</span>
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

// ─── Mobile bottom nav (4 tabs) ───────────────────────────────────────────────
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

// ─── Hot alert flash overlay ──────────────────────────────────────────────────
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
export default function Dashboard() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("feed");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [outreachLead, setOutreachLead] = useState<Lead | null>(null);

  const { data } = useLeads();
  const leads = data?.leads ?? [];
  const hotCount = leads.filter((l) => l.tier === "hot").length;

  // Apply theme class to <html>
  useEffect(() => {
    const html = document.documentElement;
    theme === "dark" ? html.classList.add("dark") : html.classList.remove("dark");
  }, [theme]);

  // Splash timer — 2 seconds as specified
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(t);
  }, []);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const toggleSound = () => setSoundEnabled((s) => !s);

  const handleNewHotLeads = useCallback((newLeads: Lead[]) => {
    const count = newLeads.length;
    const first = newLeads[0];
    toast(`🔥 ${count} New Hot Signal${count > 1 ? "s" : ""}!`, {
      description: first.title.length > 60 ? first.title.slice(0, 57) + "…" : first.title,
      duration: 6000,
      action: {
        label: "View",
        onClick: () => setActiveTab("feed"),
      },
    });
  }, []);

  const { flashActive } = useHotAlert(leads, soundEnabled, handleNewHotLeads);

  return (
    <ThemeContext.Provider value={{ theme, toggle: toggleTheme }}>
      {/* Splash — 2 second branded intro */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.4, ease: "easeIn" }}
          >
            <SplashScreen />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hot alert flash ring */}
      <HotFlashOverlay active={flashActive} />

      {/* Main app */}
      <div className="min-h-screen dark:bg-[#07070e] bg-[#f6f6fc]" style={{ fontFamily: "'Inter', sans-serif" }}>

        {/* Desktop top nav */}
        <div className="hidden sm:block">
          <TopNav
            activeTab={activeTab} onTabChange={setActiveTab}
            theme={theme} onToggleTheme={toggleTheme} hotCount={hotCount}
          />
        </div>

        {/* Mobile top bar */}
        <div className="sm:hidden fixed top-0 left-0 right-0 z-30 h-12 flex items-center justify-between px-4
          dark:bg-[#07070e]/90 bg-white/90 backdrop-blur-xl border-b dark:border-zinc-800/70 border-zinc-200"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                border: "1px solid rgba(59,130,246,0.3)",
              }}
            >
              <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none">
                <circle cx="12" cy="12" r="2.5" fill="#3b82f6" />
                <circle cx="5" cy="7" r="1.5" fill="#60a5fa" opacity="0.8" />
                <circle cx="19" cy="7" r="1.5" fill="#60a5fa" opacity="0.8" />
                <line x1="12" y1="12" x2="5" y2="7" stroke="#3b82f6" strokeWidth="0.8" opacity="0.7" />
                <line x1="12" y1="12" x2="19" y2="7" stroke="#3b82f6" strokeWidth="0.8" opacity="0.7" />
              </svg>
            </div>
            <span className="font-bold text-[13px] dark:text-zinc-100 text-zinc-900">
              Proxies<span className="text-blue-400">.sx</span>
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
            <button
              onClick={toggleTheme}
              className="w-7 h-7 rounded-lg flex items-center justify-center dark:bg-zinc-900 bg-zinc-100 dark:border dark:border-zinc-800 border border-zinc-200"
            >
              {theme === "dark" ? <Sun className="w-3 h-3 text-zinc-400" /> : <Moon className="w-3 h-3 text-zinc-500" />}
            </button>
            {/* Settings accessible from mobile top bar */}
            <button
              onClick={() => setActiveTab("settings")}
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

          {/* Tab content with smooth Framer Motion transitions */}
          <AnimatePresence mode="wait" initial={false}>
            {/* Outreach sub-page — renders instead of feed when a lead is selected */}
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
                {activeTab === "feed"          && <HomeFeed onReachOut={(lead) => setOutreachLead(lead)} />}
                {activeTab === "sentinel"      && <SentinelMonitor />}
                {activeTab === "notifications" && <Notifications />}
                {activeTab === "integrations"  && <IntegrationsTab />}
                {activeTab === "settings"      && (
                  <SettingsTab
                    theme={theme}
                    onToggleTheme={toggleTheme}
                    soundEnabled={soundEnabled}
                    onToggleSound={toggleSound}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Mobile bottom nav — 4 primary tabs */}
        <div className="sm:hidden">
          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} hotCount={hotCount} />
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
