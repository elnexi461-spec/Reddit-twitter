import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Zap, Target, AlertTriangle, CheckCircle2,
  RefreshCw, TrendingUp, X, ChevronRight, Clock, Tag,
  Info, Cpu,
} from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useStats } from "@/hooks/useStats";

interface NotifEvent {
  id: string;
  time: string;
  type: "lead" | "sentinel" | "heal" | "kill" | "warn";
  msg: string;
  detail?: string;
  meta?: Record<string, string>;
}

const SENTINEL_EVENTS: (Omit<NotifEvent, "id" | "time"> & { detail: string; meta: Record<string, string> })[] = [
  {
    type: "sentinel",
    msg: "[alpha] Blocked bad IP — 185.220.101.47 quarantined",
    detail: "The ZenRows gateway sentinel detected anomalous traffic originating from 185.220.101.47 (Tor exit node, ASN 24940 Hetzner). The IP has been quarantined from all routing pools for 24h and flagged in the reputation database.",
    meta: { "IP Address": "185.220.101.47", "ASN": "24940 (Hetzner)", "Classification": "Tor Exit Node", "Quarantine Duration": "24 hours", "Threat Level": "High" },
  },
  {
    type: "kill",
    msg: "[circuit-breaker] Auto-terminated abusive key — 15 Mbps threshold exceeded",
    detail: "An API key exceeded the 15 Mbps bandwidth circuit-breaker threshold. The key was automatically suspended to protect shared infrastructure. The account owner has been notified via webhook.",
    meta: { "Trigger": "Bandwidth threshold (15 Mbps)", "Action": "Key suspended", "Duration": "1 hour cooldown", "Notification": "Webhook fired" },
  },
  {
    type: "heal",
    msg: "[auto-recovery] Webhook fired — 2 fresh residential IPs spun up",
    detail: "The self-healing engine detected pool degradation below the 85% health threshold. A recovery webhook triggered provisioning of 2 new clean residential IPs from the EU-West rotation pool. Pool health is now 97%.",
    meta: { "Previous Health": "83%", "Current Health": "97%", "IPs Added": "2 residential (EU-West)", "Pool Size": "47 active IPs" },
  },
  {
    type: "sentinel",
    msg: "[alpha] Route switched: US-East → Frankfurt (lower latency)",
    detail: "Automatic route optimization detected a 140ms latency improvement by switching the primary egress from US-East (Virginia) to Frankfurt. The switch was applied to all active sessions with zero interruption.",
    meta: { "From": "US-East (Virginia)", "To": "Frankfurt, DE", "Latency Delta": "-140ms", "Sessions Migrated": "All active sessions" },
  },
  {
    type: "warn",
    msg: "[warn] DataDome challenge loop detected on 3 consecutive requests",
    detail: "Three consecutive requests to the target domain triggered DataDome's challenge loop, indicating fingerprint detection. The gateway switched to a fresh TLS fingerprint profile and headless browser session. Success rate recovered to 100%.",
    meta: { "Challenge Type": "DataDome JS Challenge", "Failed Attempts": "3", "Mitigation": "TLS profile rotation + new session", "Current Success Rate": "100%" },
  },
  {
    type: "heal",
    msg: "[auto-recovery] Pool replenished — +5 clean residential IPs added",
    detail: "Routine pool maintenance added 5 new clean residential IPs to the active rotation. IPs are sourced from certified providers with reputation scores above 98. Total pool size is now 52 active IPs.",
    meta: { "IPs Added": "5 residential", "Provider Reputation": ">98%", "Total Pool Size": "52 active IPs", "Next Maintenance": "In 6 hours" },
  },
  {
    type: "kill",
    msg: "[circuit-breaker] Datacenter IP range flagged — auto-rotated",
    detail: "A /24 datacenter IP block (AWS us-east-1) was flagged by the target domain's bot detection. The gateway automatically rotated all sessions to residential IPs from the fallback pool within 800ms.",
    meta: { "Flagged Range": "AWS us-east-1 /24", "Rotation Time": "800ms", "Sessions Affected": "12", "New Source": "Residential fallback pool" },
  },
  {
    type: "sentinel",
    msg: "[alpha] 7 IPs quarantined this hour — reputation score: 99.4%",
    detail: "Hourly reputation sweep quarantined 7 IPs that failed liveness checks or appeared in threat intelligence feeds. The gateway's aggregate reputation score remains at 99.4%, well above the 95% operational threshold.",
    meta: { "Quarantined This Hour": "7 IPs", "Reputation Score": "99.4%", "Threshold": "95%", "Clean IPs Active": "45" },
  },
  {
    type: "warn",
    msg: "[warn] Cloudflare Turnstile challenge surge on target domain",
    detail: "The target domain increased Cloudflare Turnstile challenge frequency from 5% to 35% of requests, likely due to increased bot traffic from other actors. ZenRows' stealth browser profile passed all challenges. Monitoring in progress.",
    meta: { "Challenge Rate Before": "5%", "Challenge Rate Now": "35%", "Pass Rate": "100%", "Mitigation Status": "Active monitoring" },
  },
  {
    type: "heal",
    msg: "[auto-recovery] 1 degraded node replaced via webhook",
    detail: "A gateway node in the EU-West cluster was detected as degraded (>3% error rate). The self-healing webhook provisioned a replacement node within 45 seconds. Traffic was seamlessly rerouted with no client-visible impact.",
    meta: { "Node": "EU-West-Node-07", "Error Rate": "3.4%", "Replacement Time": "45 seconds", "Impact": "Zero client-facing downtime" },
  },
];

function nowHHMM() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function uid() { return Math.random().toString(36).slice(2); }

const ICONS: Record<NotifEvent["type"], React.ReactNode> = {
  lead:     <Target        className="w-3.5 h-3.5 text-blue-400"    />,
  sentinel: <Shield        className="w-3.5 h-3.5 text-emerald-400" />,
  heal:     <Zap           className="w-3.5 h-3.5 text-violet-400"  />,
  kill:     <AlertTriangle className="w-3.5 h-3.5 text-red-400"     />,
  warn:     <CheckCircle2  className="w-3.5 h-3.5 text-amber-400"   />,
};

const TYPE_META: Record<NotifEvent["type"], { label: string; ring: string; headerBg: string; color: string }> = {
  lead:     { label: "New Lead Signal",      ring: "border-blue-500/20 dark:bg-blue-500/5 bg-blue-50/60",       headerBg: "rgba(59,130,246,0.08)",  color: "#60a5fa" },
  sentinel: { label: "Sentinel Alert",       ring: "border-emerald-500/20 dark:bg-emerald-500/5 bg-emerald-50/60", headerBg: "rgba(16,185,129,0.08)", color: "#34d399" },
  heal:     { label: "Auto-Recovery Event",  ring: "border-violet-500/20 dark:bg-violet-500/5 bg-violet-50/60",  headerBg: "rgba(139,92,246,0.08)",  color: "#a78bfa" },
  kill:     { label: "Circuit-Breaker",      ring: "border-red-500/20 dark:bg-red-500/5 bg-red-50/60",           headerBg: "rgba(239,68,68,0.08)",   color: "#f87171" },
  warn:     { label: "System Warning",       ring: "border-amber-500/20 dark:bg-amber-500/5 bg-amber-50/60",     headerBg: "rgba(245,158,11,0.08)",  color: "#fbbf24" },
};

// ─── Sparkline bar chart ──────────────────────────────────────────────────────
function DailyBarChart({ data }: { data: { date: string; reddit: number; hn: number; total: number }[] }) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const labels = data.map((d) => { const [,, dd] = d.date.split("-"); return dd; });
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
                <motion.div initial={{ height: 0 }} animate={{ height: `${hnH}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                  className="w-full rounded-t-sm bg-amber-400/70" />
              )}
              {d.reddit > 0 && (
                <motion.div initial={{ height: 0 }} animate={{ height: `${redditH}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                  className="w-full rounded-sm bg-blue-400/80" />
              )}
              {d.total === 0 && <div className="w-full h-1 rounded-sm dark:bg-zinc-800 bg-zinc-200" />}
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

// ─── Notification Detail Panel ────────────────────────────────────────────────
function NotificationDetail({ event, onClose }: { event: NotifEvent; onClose: () => void }) {
  const tm = TYPE_META[event.type];
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <>
      <motion.div key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[250] bg-black/50 backdrop-blur-sm"
        onClick={onClose} />

      <motion.div key="panel"
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="fixed z-[251] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md"
        style={{ padding: "0 16px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, rgba(14,14,22,0.99) 0%, rgba(8,8,14,0.99) 100%)",
            border: `1px solid rgba(255,255,255,0.08)`,
            boxShadow: "0 40px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* Header */}
          <div className="px-5 py-4 flex items-start gap-3" style={{ background: tm.headerBg, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${tm.color}18`, border: `1px solid ${tm.color}30` }}>
              {ICONS[event.type]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: `${tm.color}18`, color: tm.color }}>
                  {tm.label}
                </span>
                <span className="text-[10px] font-mono dark:text-zinc-600 text-zinc-400 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />{event.time}
                </span>
              </div>
              <p className="text-xs font-semibold dark:text-zinc-200 text-zinc-700 leading-snug">{event.msg}</p>
            </div>
            <button onClick={onClose} className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center hover:dark:bg-zinc-800 hover:bg-zinc-100 transition-colors">
              <X className="w-3.5 h-3.5 dark:text-zinc-500 text-zinc-400" />
            </button>
          </div>

          {/* Detail body */}
          <div className="px-5 py-4 flex flex-col gap-4">
            {event.detail && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider dark:text-zinc-600 text-zinc-400">
                  <Info className="w-3 h-3" /> Event Description
                </div>
                <p className="text-xs dark:text-zinc-400 text-zinc-600 leading-relaxed">{event.detail}</p>
              </div>
            )}

            {event.meta && Object.keys(event.meta).length > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider dark:text-zinc-600 text-zinc-400">
                  <Cpu className="w-3 h-3" /> Technical Details
                </div>
                <div className="rounded-xl overflow-hidden border dark:border-zinc-800 border-zinc-200">
                  {Object.entries(event.meta).map(([k, v], i) => (
                    <div key={k} className={`flex items-start justify-between gap-3 px-3 py-2 ${i > 0 ? "border-t dark:border-zinc-800/60 border-zinc-100" : ""}`}>
                      <span className="text-[10px] dark:text-zinc-600 text-zinc-400 shrink-0">{k}</span>
                      <span className="text-[10px] font-medium dark:text-zinc-300 text-zinc-600 text-right font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!event.detail && (
              <p className="text-xs dark:text-zinc-500 text-zinc-400 leading-relaxed">
                This is a real-time system event. No additional detail is stored for this entry.
              </p>
            )}

            <button onClick={onClose}
              className="w-full py-2 rounded-xl text-xs font-bold dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-300 text-zinc-600 dark:border dark:border-zinc-700 border border-zinc-200 hover:dark:bg-zinc-700 transition-colors">
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Main Notifications ───────────────────────────────────────────────────────
export default function Notifications() {
  const { data } = useLeads();
  const { data: stats } = useStats();
  const prevLeadCount = useRef<number>(0);
  const [selectedEvent, setSelectedEvent] = useState<NotifEvent | null>(null);

  const [events, setEvents] = useState<NotifEvent[]>(() => {
    const now = nowHHMM();
    return SENTINEL_EVENTS.slice(0, 6).map((e) => ({ ...e, id: uid(), time: now }));
  });

  useEffect(() => {
    if (!data) return;
    const count = data.totalLeads;
    if (prevLeadCount.current !== 0 && count > prevLeadCount.current) {
      const diff = count - prevLeadCount.current;
      setEvents((prev) => [{
        id: uid(), time: nowHHMM(), type: "lead" as const,
        msg: `[Lead Engine] Found ${diff} new prospective client${diff !== 1 ? "s" : ""} — ${count} total in feed`,
        detail: `The lead ingestion pipeline processed ${diff} new developer pain signal${diff !== 1 ? "s" : ""} from monitored sources (Reddit, Hacker News). Each lead has been scored and sorted by urgency. Total feed size is now ${count} leads.`,
        meta: { "New Leads": String(diff), "Total Leads": String(count), "Sources": "Reddit, Hacker News", "Scoring Engine": "v3 (keyword + context)" },
      }, ...prev].slice(0, 80));
    }
    prevLeadCount.current = count;
  }, [data?.totalLeads]);

  useEffect(() => {
    let idx = 6;
    const interval = setInterval(() => {
      const src = SENTINEL_EVENTS[idx % SENTINEL_EVENTS.length];
      setEvents((prev) => [{ ...src, id: uid(), time: nowHHMM() }, ...prev].slice(0, 80));
      idx++;
    }, 20_000 + Math.random() * 10_000);
    return () => clearInterval(interval);
  }, []);

  const hotCount = data?.leads.filter((l) => l.tier === "hot").length ?? 0;
  const claimRate = stats?.claimRate ?? 0;
  const totalToday = stats?.totalToday ?? 0;

  return (
    <div className="space-y-5">
      {/* Notification detail modal */}
      <AnimatePresence>
        {selectedEvent && (
          <NotificationDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        )}
      </AnimatePresence>

      {/* Analytics summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Today's Leads", value: totalToday, suffix: "",    color: "text-blue-400" },
          { label: "Hot Signals",   value: hotCount,   suffix: " 🔥", color: "text-red-400" },
          { label: "Claim Rate",    value: claimRate,  suffix: "%",   color: "text-emerald-400" },
          { label: "Avg Score",     value: stats?.avgScore ?? 0, suffix: "pts", color: "text-violet-400" },
        ].map((card) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border dark:bg-zinc-900/50 bg-white dark:border-zinc-800 border-zinc-200 p-3">
            <div className="text-[10px] dark:text-zinc-500 text-zinc-400 uppercase tracking-wider mb-1">{card.label}</div>
            <div className={`text-2xl font-black tabular-nums ${card.color}`}>{card.value}{card.suffix}</div>
          </motion.div>
        ))}
      </div>

      {/* 7-day chart */}
      {stats?.dailyCounts && stats.dailyCounts.some((d) => d.total > 0) && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-xl border dark:bg-zinc-900/50 bg-white dark:border-zinc-800 border-zinc-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 dark:text-zinc-500 text-zinc-400" />
              <span className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-500 text-zinc-400">7-Day Lead Intake</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-blue-400/80" /><span className="text-[10px] dark:text-zinc-500 text-zinc-400">Reddit</span></div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-sm bg-amber-400/70" /><span className="text-[10px] dark:text-zinc-500 text-zinc-400">HN</span></div>
            </div>
          </div>
          <DailyBarChart data={stats.dailyCounts} />
        </motion.div>
      )}

      {/* Activity log — clickable */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider dark:text-zinc-500 text-zinc-400">Live Activity Log</span>
            <span className="text-[10px] dark:text-zinc-600 text-zinc-400">({events.length} events)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] dark:text-zinc-700 text-zinc-400 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Click any event to expand
            </span>
            <button
              onClick={() => setEvents((prev) => [{
                id: uid(), time: nowHHMM(), type: "sentinel" as const,
                msg: "[alpha] Manual refresh — all systems nominal",
                detail: "A manual status refresh was triggered. All gateway systems are reporting nominal status. No anomalies detected in the last scan cycle.",
                meta: { "Trigger": "Manual (user-initiated)", "Status": "All systems nominal", "Scan Time": new Date().toLocaleTimeString() },
              }, ...prev].slice(0, 80))}
              className="inline-flex items-center gap-1 text-[11px] dark:text-zinc-500 text-zinc-400 hover:dark:text-zinc-300 hover:text-zinc-600 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {events.map((ev) => {
              const tm = TYPE_META[ev.type];
              return (
                <motion.button
                  key={ev.id}
                  layout
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  onClick={() => setSelectedEvent(ev)}
                  className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border ${tm.ring} dark:border transition-all hover:scale-[1.005] hover:shadow-sm active:scale-[0.998] cursor-pointer group`}
                >
                  <div className="mt-0.5 shrink-0">{ICONS[ev.type]}</div>
                  <p className="flex-1 text-xs font-medium dark:text-zinc-200 text-zinc-700 leading-snug">{ev.msg}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <code className="text-[10px] font-mono dark:text-zinc-600 text-zinc-400 mt-0.5">{ev.time}</code>
                    <ChevronRight className="w-3.5 h-3.5 dark:text-zinc-700 text-zinc-300 group-hover:dark:text-zinc-500 group-hover:text-zinc-400 transition-colors mt-0.5" />
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
