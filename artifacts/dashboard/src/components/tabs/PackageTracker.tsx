import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, TrendingUp, TrendingDown, Star, Download, AlertTriangle, ExternalLink, Zap } from "lucide-react";
import type { LivePackageEvent } from "@/hooks/useLiveStream";

// ─── Demo data ────────────────────────────────────────────────────────────────
interface PackageRow {
  name: string;
  registry: "npm" | "PyPI";
  weeklyDownloads: number;
  githubStars: number;
  trendPct: number;
  signals: string[];
  riskScore: number;
  category: string;
  url: string;
}

const DEMO_PACKAGES: PackageRow[] = [
  { name: "puppeteer",        registry: "npm",  weeklyDownloads: 2_140_000, githubStars: 87_200, trendPct: +12.4, signals: ["Cloudflare issues spike +340%", "New repo burst from SG IPs"], riskScore: 91, category: "Browser Automation", url: "https://npmjs.com/package/puppeteer" },
  { name: "playwright",       registry: "npm",  weeklyDownloads: 1_820_000, githubStars: 64_100, trendPct: +18.7, signals: ["JS-stealth install wave", "GitHub stars +2.1K in 48h"],       riskScore: 88, category: "Browser Automation", url: "https://npmjs.com/package/playwright" },
  { name: "scrapy",           registry: "PyPI", weeklyDownloads:   892_000, githubStars: 51_400, trendPct:  +4.2, signals: ["AWS us-east-1 install cluster"],                                   riskScore: 74, category: "HTTP Scraping",     url: "https://pypi.org/project/Scrapy" },
  { name: "crawlee",          registry: "npm",  weeklyDownloads:    47_300, githubStars:  3_900, trendPct: +34.1, signals: ["New; growing fast", "Issues tagged 'anti-bot'"],                  riskScore: 82, category: "Browser Automation", url: "https://npmjs.com/package/crawlee" },
  { name: "cheerio",          registry: "npm",  weeklyDownloads: 1_240_000, githubStars: 28_300, trendPct:  +1.8, signals: ["Stable growth"],                                                    riskScore: 55, category: "HTML Parsing",      url: "https://npmjs.com/package/cheerio" },
  { name: "selenium-webdriver", registry: "npm", weeklyDownloads: 1_102_000, githubStars: 29_500, trendPct: -2.1, signals: ["Declining; migrating to Playwright"],                              riskScore: 61, category: "Browser Automation", url: "https://npmjs.com/package/selenium-webdriver" },
  { name: "httpx",            registry: "PyPI", weeklyDownloads:   741_000, githubStars: 13_200, trendPct: +9.6,  signals: ["Async scraper pattern detected", "Hetzner install cluster"],      riskScore: 70, category: "HTTP Scraping",     url: "https://pypi.org/project/httpx" },
  { name: "apify-client",     registry: "npm",  weeklyDownloads:    39_100, githubStars:  4_300, trendPct: +21.3, signals: ["Competitor SDK", "Enterprise usage signals"],                     riskScore: 95, category: "Scraping Platform",  url: "https://npmjs.com/package/apify-client" },
];

const DEMO_SIGNALS = [
  { time: "2 min ago",  pkg: "puppeteer",    registry: "npm",  kind: "critical", msg: "GitHub issue surge: 'Cloudflare blocking puppeteer' tagged — 47 new issues in 6h" },
  { time: "11 min ago", pkg: "playwright",   registry: "npm",  kind: "warning",  msg: "Star burst: +2,147 GitHub stars in 48h — viral thread on Hacker News" },
  { time: "34 min ago", pkg: "scrapy",       registry: "PyPI", kind: "info",     msg: "Install cluster from 34 AWS us-east-1 IPs — systematic download pattern" },
  { time: "1h ago",     pkg: "crawlee",      registry: "npm",  kind: "warning",  msg: "Issue opened: 'How to bypass DataDome with Crawlee?' — 12 upvotes" },
  { time: "2h ago",     pkg: "apify-client", registry: "npm",  kind: "critical", msg: "Enterprise install from Fortune 500 domain detected — high ARR potential" },
  { time: "3h ago",     pkg: "httpx",        registry: "PyPI", kind: "info",     msg: "Hetzner cluster (156 IPs) bulk-installed httpx + playwright combination" },
];

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function RiskBar({ score }: { score: number }) {
  const color = score >= 85 ? "#ef4444" : score >= 70 ? "#f59e0b" : "#00ffb3";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold tabular-nums" style={{ color, minWidth: 24 }}>{score}</span>
    </div>
  );
}

function SignalKindBadge({ kind }: { kind: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    critical: { bg: "rgba(239,68,68,0.12)",  color: "#f87171", label: "Critical" },
    warning:  { bg: "rgba(245,158,11,0.12)", color: "#fbbf24", label: "Warning" },
    info:     { bg: "rgba(0,255,179,0.08)",  color: "#00ffb3", label: "Info" },
  };
  const s = styles[kind] ?? styles.info;
  return (
    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

// ─── Live data view ───────────────────────────────────────────────────────────
function LivePackageRow({ event }: { event: LivePackageEvent }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 p-3 rounded-xl border dark:bg-zinc-900/60 bg-white dark:border-zinc-800 border-zinc-200"
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(0,255,179,0.08)", border: "1px solid rgba(0,255,179,0.15)" }}>
        <Package className="w-4 h-4" style={{ color: "#00ffb3" }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold dark:text-zinc-200 text-zinc-800 font-mono">{event.packageName}</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider" style={{ background: "rgba(0,255,179,0.08)", color: "#00ffb3" }}>{event.registry}</span>
        </div>
        <p className="text-[11px] dark:text-zinc-500 text-zinc-500">{event.signal} · Risk {event.riskScore}</p>
        <p className="text-[10px] dark:text-zinc-700 text-zinc-400 mt-0.5">{new Date(event.ts).toLocaleTimeString()}</p>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PackageTracker({ mode, livePackages }: { mode: "demo" | "live"; livePackages: LivePackageEvent[] }) {
  const [activeSignal, setActiveSignal] = useState<string | null>(null);

  const totalDownloads = DEMO_PACKAGES.reduce((s, p) => s + p.weeklyDownloads, 0);
  const hotPackages = DEMO_PACKAGES.filter((p) => p.riskScore >= 80).length;

  if (mode === "live") {
    return (
      <div className="flex flex-col gap-4">
        {/* Live header metrics */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Live Signals", value: livePackages.length, color: "#00ffb3" },
            { label: "Packages Seen", value: new Set(livePackages.map((p) => p.packageName)).size, color: "#00ffb3" },
            { label: "SSE Stream", value: "Active", color: "#00ffb3" },
          ].map((m) => (
            <div key={m.label} className="rounded-xl p-3 text-center dark:bg-zinc-900/60 bg-white border dark:border-zinc-800 border-zinc-200">
              <div className="text-base font-black tabular-nums" style={{ color: m.color }}>{m.value}</div>
              <div className="text-[10px] dark:text-zinc-600 text-zinc-500 mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Live events */}
        {livePackages.length > 0 ? (
          <div className="flex flex-col gap-2">
            {livePackages.map((e) => <LivePackageRow key={e.id} event={e} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 py-16 text-center">
            <div className="relative w-20 h-20 flex items-center justify-center">
              {[0, 1, 2].map((i) => (
                <motion.div key={i} className="absolute rounded-full"
                  style={{ border: "1px solid rgba(0,255,179,0.2)", width: 34 + i * 20, height: 34 + i * 20 }}
                  animate={{ opacity: [0.8, 0, 0.8], scale: [1, 1.1, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }}
                />
              ))}
              <Package className="w-5 h-5 z-10" style={{ color: "#00ffb3" }} />
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <motion.span className="w-1.5 h-1.5 rounded-full" style={{ background: "#00ffb3" }}
                  animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: "#00ffb3" }}>Listening for Registry Ingress…</span>
              </div>
              <p className="text-xs dark:text-zinc-600 text-zinc-500 max-w-[260px] leading-relaxed">
                Package signals will appear here the moment npm/PyPI webhook events hit the ingest endpoint.
              </p>
            </div>
            <div className="flex flex-col gap-1.5 w-full max-w-xs">
              {[0.9, 0.6, 0.75].map((w, i) => (
                <motion.div key={i} className="h-1.5 rounded-full" style={{ width: `${w * 100}%` }}
                  animate={{ opacity: [0.06, 0.16, 0.06] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}>
                  <div className="w-full h-full rounded-full" style={{ background: "rgba(0,255,179,0.5)" }} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Demo mode ──
  return (
    <div className="flex flex-col gap-5">

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Tracked Packages", value: DEMO_PACKAGES.length, color: "#00ffb3", icon: <Package className="w-3.5 h-3.5" /> },
          { label: "Weekly Downloads", value: fmt(totalDownloads), color: "#818cf8", icon: <Download className="w-3.5 h-3.5" /> },
          { label: "High Risk",        value: hotPackages, color: "#f87171",   icon: <AlertTriangle className="w-3.5 h-3.5" /> },
        ].map((m) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="rounded-xl p-3 dark:bg-zinc-900/60 bg-white border dark:border-zinc-800 border-zinc-200"
          >
            <div className="flex items-center gap-1.5 mb-1.5" style={{ color: m.color }}>
              {m.icon}
              <span className="text-[9px] font-bold uppercase tracking-wider dark:text-zinc-500 text-zinc-500">{m.label}</span>
            </div>
            <div className="text-xl font-black tabular-nums" style={{ color: m.color }}>{m.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Package table */}
      <div className="rounded-2xl border dark:bg-zinc-900/40 bg-white dark:border-zinc-800 border-zinc-200 overflow-hidden">
        <div className="px-4 py-3 border-b dark:border-zinc-800 border-zinc-200 flex items-center justify-between">
          <span className="text-xs font-bold dark:text-zinc-300 text-zinc-700 tracking-wide">Open-Source Package Registry Tracker</span>
          <span className="text-[10px] dark:text-zinc-600 text-zinc-400 font-mono">npm · PyPI · live signals</span>
        </div>

        <div className="divide-y dark:divide-zinc-800/60 divide-zinc-100">
          {DEMO_PACKAGES.map((pkg, idx) => (
            <motion.div
              key={pkg.name}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.04 }}
              className="px-4 py-3 hover:dark:bg-zinc-800/30 hover:bg-zinc-50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold dark:text-zinc-200 text-zinc-800 font-mono">{pkg.name}</span>
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
                      style={pkg.registry === "npm"
                        ? { background: "rgba(203,0,0,0.1)", color: "#f87171" }
                        : { background: "rgba(59,130,246,0.1)", color: "#60a5fa" }}
                    >
                      {pkg.registry}
                    </span>
                    <span className="text-[9px] dark:text-zinc-600 text-zinc-400">{pkg.category}</span>
                  </div>

                  <div className="flex items-center gap-4 mb-2 flex-wrap">
                    <span className="flex items-center gap-1 text-[11px] dark:text-zinc-400 text-zinc-500">
                      <Download className="w-3 h-3" />{fmt(pkg.weeklyDownloads)}/wk
                    </span>
                    <span className="flex items-center gap-1 text-[11px] dark:text-zinc-400 text-zinc-500">
                      <Star className="w-3 h-3" />{fmt(pkg.githubStars)}
                    </span>
                    <span className={`flex items-center gap-0.5 text-[11px] font-bold ${pkg.trendPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {pkg.trendPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {pkg.trendPct > 0 ? "+" : ""}{pkg.trendPct}%
                    </span>
                  </div>

                  <RiskBar score={pkg.riskScore} />

                  {/* Signals */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {pkg.signals.map((sig) => (
                      <span key={sig} className="text-[10px] px-1.5 py-0.5 rounded dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-500 text-zinc-500">{sig}</span>
                    ))}
                  </div>
                </div>

                <a href={pkg.url} target="_blank" rel="noreferrer"
                  className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center dark:bg-zinc-800 bg-zinc-100 hover:dark:bg-zinc-700 transition-colors">
                  <ExternalLink className="w-3 h-3 dark:text-zinc-500 text-zinc-400" />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent signals log */}
      <div className="rounded-2xl border dark:bg-zinc-900/40 bg-white dark:border-zinc-800 border-zinc-200 overflow-hidden">
        <div className="px-4 py-3 border-b dark:border-zinc-800 border-zinc-200">
          <span className="text-xs font-bold dark:text-zinc-300 text-zinc-700">Live Signal Log</span>
        </div>
        <div className="divide-y dark:divide-zinc-800/50 divide-zinc-100">
          {DEMO_SIGNALS.map((sig, i) => (
            <div key={i} className="px-4 py-2.5 flex items-start gap-3">
              <SignalKindBadge kind={sig.kind} />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] dark:text-zinc-400 text-zinc-600 leading-snug">{sig.msg}</span>
              </div>
              <span className="text-[10px] dark:text-zinc-700 text-zinc-400 shrink-0 font-mono">{sig.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
