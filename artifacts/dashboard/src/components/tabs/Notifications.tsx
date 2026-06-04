import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, Target, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { useLeads } from "@/hooks/useLeads";

interface NotifEvent {
  id: string;
  time: string;
  type: "lead" | "sentinel" | "heal" | "kill" | "warn";
  msg: string;
}

const SENTINEL_EVENTS: Omit<NotifEvent, "id" | "time">[] = [
  { type: "sentinel", msg: "[Sentinel] Blocked bad IP — 185.220.101.47 quarantined" },
  { type: "kill",     msg: "[Kill Switch] Auto-terminated abusive key — 15 Mbps threshold" },
  { type: "heal",     msg: "[Self-Heal] Webhook fired — 2 fresh residential IPs spun up" },
  { type: "sentinel", msg: "[Sentinel] Route switched: US-East → Frankfurt (lower latency)" },
  { type: "warn",     msg: "[Warn] DataDome challenge loop detected on 3 consecutive requests" },
  { type: "heal",     msg: "[Self-Heal] Pool replenished — +5 clean residential IPs added" },
  { type: "kill",     msg: "[Kill Switch] Datacenter IP range flagged — auto-rotated" },
  { type: "sentinel", msg: "[Sentinel] 7 IPs quarantined this hour — reputation score: 99.4%" },
  { type: "warn",     msg: "[Warn] Cloudflare Turnstile challenge surge on target domain" },
  { type: "heal",     msg: "[Self-Heal] 1 degraded node replaced via auto-webhook" },
];

function nowHHMM() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function uid() {
  return Math.random().toString(36).slice(2);
}

const ICONS: Record<NotifEvent["type"], React.ReactNode> = {
  lead:     <Target    className="w-3.5 h-3.5 text-blue-400"   />,
  sentinel: <Shield    className="w-3.5 h-3.5 text-emerald-400" />,
  heal:     <Zap       className="w-3.5 h-3.5 text-violet-400"  />,
  kill:     <AlertTriangle className="w-3.5 h-3.5 text-red-400" />,
  warn:     <CheckCircle2  className="w-3.5 h-3.5 text-amber-400" />,
};

const RING: Record<NotifEvent["type"], string> = {
  lead:     "border-blue-500/20 dark:bg-blue-500/5 bg-blue-50/60",
  sentinel: "border-emerald-500/20 dark:bg-emerald-500/5 bg-emerald-50/60",
  heal:     "border-violet-500/20 dark:bg-violet-500/5 bg-violet-50/60",
  kill:     "border-red-500/20 dark:bg-red-500/5 bg-red-50/60",
  warn:     "border-amber-500/20 dark:bg-amber-500/5 bg-amber-50/60",
};

export default function Notifications() {
  const { data } = useLeads();
  const prevLeadCount = useRef<number>(0);

  const [events, setEvents] = useState<NotifEvent[]>(() => {
    const now = nowHHMM();
    return SENTINEL_EVENTS.slice(0, 6).map((e, i) => ({
      ...e,
      id: uid(),
      time: now,
    }));
  });

  // Inject lead-engine event when new leads arrive
  useEffect(() => {
    if (!data) return;
    const count = data.totalLeads;
    if (prevLeadCount.current !== 0 && count > prevLeadCount.current) {
      const diff = count - prevLeadCount.current;
      setEvents(prev => [{
        id: uid(),
        time: nowHHMM(),
        type: "lead",
        msg: `[Lead Engine] Found ${diff} new prospective client${diff !== 1 ? "s" : ""} — ${count} total in feed`,
      }, ...prev].slice(0, 60));
    }
    prevLeadCount.current = count;
  }, [data?.totalLeads]);

  // Drip in new mock sentinel events
  useEffect(() => {
    let idx = 6;
    const interval = setInterval(() => {
      const src = SENTINEL_EVENTS[idx % SENTINEL_EVENTS.length];
      setEvents(prev => [{
        ...src,
        id: uid(),
        time: nowHHMM(),
      }, ...prev].slice(0, 60));
      idx++;
    }, 18_000 + Math.random() * 10_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
          <span className="text-xs font-medium dark:text-zinc-400 text-zinc-600">
            Live activity log — {events.length} events
          </span>
        </div>
        <button
          onClick={() => setEvents(prev => [{
            id: uid(),
            time: nowHHMM(),
            type: "sentinel",
            msg: "[Sentinel] Manual refresh — all systems nominal",
          }, ...prev].slice(0, 60))}
          className="inline-flex items-center gap-1 text-[11px] dark:text-zinc-500 text-zinc-400 hover:dark:text-zinc-300 hover:text-zinc-600 transition-colors"
        >
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* Event log */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {events.map((ev) => (
            <motion.div
              key={ev.id}
              layout
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`flex items-start gap-3 p-3 rounded-xl border ${RING[ev.type]} dark:border`}
            >
              <div className="mt-0.5 shrink-0">{ICONS[ev.type]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium dark:text-zinc-200 text-zinc-700 leading-snug">
                  {ev.msg}
                </p>
              </div>
              <code className="text-[10px] font-mono dark:text-zinc-600 text-zinc-400 shrink-0 mt-0.5">
                {ev.time}
              </code>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
