import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, Target, AlertTriangle, CheckCircle2, RefreshCw, TrendingUp } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useStats } from "@/hooks/useStats";

interface NotifEvent {
  id: string;
  time: string;
  type: "lead" | "sentinel" | "heal" | "kill" | "warn";
  msg: string;
}

const SENTINEL_EVENTS: Omit<NotifEvent, "id" | "time">[] = [
  { type: "sentinel", msg: "[alpha] Blocked bad IP — 185.220.101.47 quarantined" },
  { type: "kill",     msg: "[circuit-breaker] Auto-terminated abusive key — 15 Mbps threshold" },
  { type: "heal",     msg: "[auto-recovery] Webhook fired — 2 fresh residential IPs spun up" },
  { type: "sentinel", msg: "[alpha] Route switched: US-East → Frankfurt (lower latency)" },
  { type: "warn",     msg: "[warn] DataDome challenge loop detected on 3 consecutive requests" },
  { type: "heal",     msg: "[auto-recovery] Pool replenished — +5 clean residential IPs added" },
  { type: "kill",     msg: "[circuit-breaker] Datacenter IP range flagged — auto-rotated" },
  { type: "sentinel", msg: "[alpha] 7 IPs quarantined this hour — reputation score: 99.4%" },
  { type: "warn",     msg: "[warn] Cloudflare Turnstile challenge surge on target domain" },
  { type: "heal",     msg: "[auto-recovery] 1 degraded node replaced via webhook" },
];

function nowHHMM() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function uid() { return Math.random().toString(36).slice(2); }

const ICONS: Record<NotifEvent["type"], React.ReactNode> = {
  lead:     <Target       className="w-3.5 h-3.5 text-blue-400"    />,
  sentinel: <Shield       className="w-3.5 h-3.5 text-emerald-400" />,
  heal:     <Zap          className="w-3.5 h-3.5 text-violet-400"  />,
  kill:     <AlertTriangle className="w-3.5 h-3.5 text-red-400"    />,
  warn:     <CheckCircle2  className="w-3.5 h-3.5 text-amber-400"  />,
};

const RING: Record<NotifEvent["type"], string> = {
  lead:     "border-blue-500/20 dark:bg-blue-500/5 bg-blue-50/60",
  sentinel: "border-emerald-500/20 dark:bg-emerald-500/5 bg-emerald-50/60",
  heal:     "border-violet-500/20 dark:bg-violet-500/5 bg-violet-50/60",
  kill:     "border-red-500/20 dark:bg-red-500/5 bg-red-50/60",
  warn:     "border-amber-500/20 dark:bg-amber-500/5 bg-amber-50/60",
};

// ─── Sparkline bar chart ──────────────────────────────────────────────────────
function DailyBarChart({ data }: { data: { date: string; reddit: number; hn: number; total: number }[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const labels = data.map((d) => {
    const [,, dd] = d.date.split("-");
    return dd;
  });

  return (
    <div className="flex items-end justify-between gap-1 h-16 w-full">
      {data.map((d, i) => {
        const redditH = (d.reddit / max) * 100;
        const hnH = (d.hn / max) * 100;
        const isToday = i === data.length - 1;
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col items-center justify-end h-12 gap-px">
              {d.hn > 0 && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${hnH}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                  className="w-full rounded-t-sm bg-amber-400/70"
                />
              )}
              {d.reddit > 0 && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${redditH}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                  className="w-full rounded-sm bg-blue-400/80"
                />
              )}
              {d.total === 0 && (
                <div className="w-full h-1 rounded-sm dark:bg-zinc-800 bg-zinc-200" />
              )}
            </div>
            <span className={`text-[9px] font-mono ${isToday ? "dark:text-zinc-300 text-zinc-600 font-bold" : "dark:text-zinc-600 text-zinc-400"}`}>
              {labels[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Keyword bars ─────────────────────────────────────────────────────────────
function KeywordBars({ keywords }: { keywords: { term: string; count: number }[] }) {
  const max = Math.max(...keywords.map((k) => k.count), 1);
  return (
    <div className="space-y-1.5">
      {keywords.map((kw, i) => (
        <div key={kw.term} className="flex items-center gap-2">
          <code className="text-[10px] dark:text-zinc-400 text-zinc-500 font-mono w-28 shrink-0 truncate">{kw.term}</code>
          <div className="flex-1 h-1.5 dark:bg-zinc-800 bg-zinc-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(kw.count / max) * 100}%` }}
              transition={{ duration: 0.5, delay: i * 0.06, ease: "easeOut" }}
              className="h-full rounded-full bg-blue-500/80"
            />
          </div>
          <span className="text-[10px] font-bold dark:text-zinc-500 text-zinc-400 w-5 text-right tabular-nums">{kw.count}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Notifications ───────────────────────────────────────────────────────
export default function Notifications() {
  const { data } = useLeads();
  const { data: stats } = useStats();
  const prevLeadCount = useRef<number>(0);

  const [events, setEvents] = useState<NotifEvent[]>(() => {
    const now = nowHHMM();
    return SENTINEL_EVENTS.slice(0, 6).map((e) => ({ ...e, id: uid(), time: now } as NotifEvent));
  });

  useEffect(() => {
    if (!data) return;
    const count = data.totalLeads;
    if (prevLeadCount.current !== 0 && count > prevLeadCount.current) {
      const diff = count - prevLeadCount.current;
      setEvents((prev) => [{
        id: uid(), time: nowHHMM(), type: "lead" as const,
        msg: `[Lead Engine] Found ${diff} new prospective client${diff !== 1 ? "s" : ""} — ${count} total in feed`,
      }, ...prev].slice(0, 80));
    }
    prevLeadCount.current = count;
  }, [data?.totalLeads]);

  useEffect(() => {
    let idx = 6;
    const interval = setInterval(() => {
      const src = SENTINEL_EVENTS[idx % SENTINEL_EVENTS.length];
      setEvents((prev) => [{ ...src, id: uid(), time: nowHHMM() } as NotifEvent, ...prev].slice(0, 80));
      idx++;
    }, 20_000 + Math.random() * 10_000);
    return () => clearInterval(interval);
  }, []);

  const hotCount = data?.leads.filter((l) => l.tier === "hot").length ?? 0;
  const claimRate = stats?.claimRate ?? 0;
  const totalToday = stats?.totalToday ?? 0;

  return (
    <div className="space-y-5">
      {/* Analytics summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Today's Leads", value: totalToday, suffix: "", color: "text-blue-400" },
          { label: "Hot Signals", value: hotCount, suffix: "🔥", color: "text-red-400" },
          { label: "Claim Rate", value: claimRate, suffix: "%", color: "text-emerald-400" },
          { label: "Avg Score", value: stats?.avgScore ?? 0, suffix: "pts", color: "text-violet-400" },
        ].map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border dark:bg-zinc-900/50 bg-white dark:border-zinc-800 border-zinc-200 p-3"
          >
            <div className="text-[10px] dark:text-zinc-500 text-zinc-400 uppercase tracking-wider mb-1">{card.label}</div>
            <div className={`text-2xl font-black tabular-nums ${card.color}`}>
              {card.value}{card.suffix}
            </div>
          </motion.div>
        ))}
      </div>

      {/* 7-day intake chart */}
      {stats?.dailyCounts && stats.dailyCounts.some((d) => d.total > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border dark:bg-zinc-900/50 bg-white dark:border-zinc-800 border-zinc-200 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 dark:text-zinc-500 text-zinc-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-500 text-zinc-400">
                7-Day Lead Intake
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-blue-400/80" /><span className="text-[10px] dark:text-zinc-500 text-zinc-400">Reddit</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-amber-400/70" /><span className="text-[10px] dark:text-zinc-500 text-zinc-400">HN</span></div>
            </div>
          </div>
          <DailyBarChart data={stats.dailyCounts} />
        </motion.div>
      )}

      {/* Top keywords */}
      {stats?.topKeywords && stats.topKeywords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-xl border dark:bg-zinc-900/50 bg-white dark:border-zinc-800 border-zinc-200 p-4"
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-500 text-zinc-400 mb-3">
            Top Keywords
          </div>
          <KeywordBars keywords={stats.topKeywords} />
        </motion.div>
      )}

      {/* Pipeline breakdown */}
      {stats?.pipelineBreakdown && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border dark:bg-zinc-900/50 bg-white dark:border-zinc-800 border-zinc-200 p-4"
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-500 text-zinc-400 mb-3">
            Pipeline Funnel
          </div>
          <div className="grid grid-cols-4 gap-2">
            {([
              { key: "unclaimed", label: "Unclaimed", color: "dark:text-zinc-400 text-zinc-500" },
              { key: "contacted", label: "Contacted", color: "text-blue-400" },
              { key: "qualified", label: "Qualified", color: "text-amber-400" },
              { key: "converted", label: "Converted", color: "text-emerald-400" },
            ] as const).map((s) => (
              <div key={s.key} className="text-center">
                <div className={`text-xl font-black tabular-nums ${s.color}`}>
                  {stats.pipelineBreakdown[s.key]}
                </div>
                <div className="text-[9px] dark:text-zinc-600 text-zinc-400 mt-0.5 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
          {/* Funnel bar */}
          {stats.totalLeads > 0 && (
            <div className="mt-3 h-1.5 rounded-full dark:bg-zinc-800 bg-zinc-100 overflow-hidden flex gap-px">
              {(["unclaimed", "contacted", "qualified", "converted"] as const).map((key, i) => {
                const w = (stats.pipelineBreakdown[key] / stats.totalLeads) * 100;
                const colors = ["dark:bg-zinc-600 bg-zinc-400", "bg-blue-500", "bg-amber-500", "bg-emerald-500"];
                return w > 0 ? <div key={key} className={`h-full ${colors[i]} transition-all duration-700`} style={{ width: `${w}%` }} /> : null;
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Activity log */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider dark:text-zinc-500 text-zinc-400">
              Live Activity Log
            </span>
            <span className="text-[10px] dark:text-zinc-600 text-zinc-400">({events.length} events)</span>
          </div>
          <button
            onClick={() => setEvents((prev) => [{ id: uid(), time: nowHHMM(), type: "sentinel" as const, msg: "[alpha] Manual refresh — all systems nominal" }, ...prev].slice(0, 80))}
            className="inline-flex items-center gap-1 text-[11px] dark:text-zinc-500 text-zinc-400 hover:dark:text-zinc-300 hover:text-zinc-600 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {events.map((ev) => (
              <motion.div
                key={ev.id} layout
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className={`flex items-start gap-3 p-3 rounded-xl border ${RING[ev.type]} dark:border`}
              >
                <div className="mt-0.5 shrink-0">{ICONS[ev.type]}</div>
                <p className="flex-1 text-xs font-medium dark:text-zinc-200 text-zinc-700 leading-snug">{ev.msg}</p>
                <code className="text-[10px] font-mono dark:text-zinc-600 text-zinc-400 shrink-0 mt-0.5">{ev.time}</code>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
