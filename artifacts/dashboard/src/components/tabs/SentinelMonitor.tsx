import { motion } from "framer-motion";
import { Shield, Zap, Wifi, Activity, Power } from "lucide-react";
import { useSentinel } from "@/hooks/useSentinel";

// SVG progress ring
function Ring({ pct, color, size = 80 }: { pct: number; color: string; size?: number }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(100, Math.max(0, pct)) / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="4"
        className="text-zinc-800 dark:text-zinc-700" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${circ}`}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}

// Mini sparkline SVG
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 100;
  const h = 28;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="overflow-visible">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Animated counter
function Counter({ value, className }: { value: number; className?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0.6, y: -3 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={className}
    >
      {value.toLocaleString()}
    </motion.span>
  );
}

function CardShell({ icon, label, accent, children }: {
  icon: React.ReactNode;
  label: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="rounded-xl border dark:bg-zinc-900/50 bg-white border-zinc-200 dark:border-zinc-800 p-4 flex flex-col gap-3"
    >
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${accent}`}>{icon}</div>
        <span className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-500 text-zinc-400">{label}</span>
      </div>
      {children}
    </motion.div>
  );
}

export default function SentinelMonitor() {
  const s = useSentinel();

  const quarantinedPct = s.ipReputation.checked > 0
    ? (s.ipReputation.quarantined / s.ipReputation.checked) * 100
    : 0;

  const latencyColor = s.latency.ms < 50 ? "#22d668" : s.latency.ms < 120 ? "#f59e0b" : "#ef4444";
  const latencyLabel = s.latency.ms < 50 ? "Excellent" : s.latency.ms < 120 ? "Good" : "Degraded";

  const nodesPct = (s.selfHealing.activeNodes / s.selfHealing.totalNodes) * 100;

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl dark:bg-emerald-950/20 bg-emerald-50 border dark:border-emerald-900/30 border-emerald-200">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
          Sentinel Engine · All systems nominal · Live telemetry every 2s
        </span>
      </div>

      {/* 2×2 card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Card 1: IP Reputation */}
        <CardShell
          icon={<Shield className="w-3.5 h-3.5 text-blue-400" />}
          label="IP Reputation Sentinel"
          accent="bg-blue-500/10"
        >
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <Ring pct={100 - quarantinedPct * 200} color="#4f8fff" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold dark:text-zinc-300 text-zinc-600">
                  {quarantinedPct.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div>
                <div className="text-[10px] dark:text-zinc-500 text-zinc-400 uppercase tracking-wider">Checked</div>
                <Counter value={s.ipReputation.checked} className="text-lg font-bold dark:text-zinc-100 text-zinc-900 tabular-nums" />
              </div>
              <div>
                <div className="text-[10px] dark:text-zinc-500 text-zinc-400 uppercase tracking-wider">Quarantined</div>
                <Counter value={s.ipReputation.quarantined} className="text-base font-semibold text-red-400 tabular-nums" />
              </div>
            </div>
          </div>
          <div className="rounded-lg dark:bg-zinc-800/50 bg-zinc-50 border dark:border-zinc-700/50 border-zinc-200 px-2.5 py-1.5">
            <span className="text-[10px] dark:text-zinc-500 text-zinc-400">Last bad IP  </span>
            <code className="text-[10px] font-mono text-red-400">{s.ipReputation.lastBadIp}</code>
          </div>
        </CardShell>

        {/* Card 2: Latency Routing Matrix */}
        <CardShell
          icon={<Wifi className="w-3.5 h-3.5 text-emerald-400" />}
          label="Latency Routing Matrix"
          accent="bg-emerald-500/10"
        >
          <div className="flex items-center gap-3">
            <motion.div
              key={s.latency.ms}
              initial={{ scale: 0.92, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-4xl font-black tabular-nums leading-none"
              style={{ color: latencyColor }}
            >
              {s.latency.ms}
            </motion.div>
            <div>
              <div className="text-sm font-semibold dark:text-zinc-400 text-zinc-500">ms</div>
              <div className="text-[10px] font-medium mt-0.5" style={{ color: latencyColor }}>{latencyLabel}</div>
            </div>
          </div>

          {/* Sparkline */}
          <div className="h-7 w-full">
            <Sparkline data={s.latency.trend} color={latencyColor} />
          </div>

          {/* Route */}
          <div className="flex items-center gap-1 flex-wrap">
            {s.latency.route.map((node, i) => (
              <span key={`${node}-${i}`} className="flex items-center gap-1">
                <span className="text-[11px] font-medium dark:text-zinc-300 text-zinc-600 px-2 py-0.5 rounded-full dark:bg-zinc-800 bg-zinc-100 border dark:border-zinc-700 border-zinc-200">
                  {node}
                </span>
                {i < s.latency.route.length - 1 && (
                  <span className="text-zinc-600 text-[10px]">→</span>
                )}
              </span>
            ))}
          </div>
        </CardShell>

        {/* Card 3: Abuse Kill Switch */}
        <CardShell
          icon={<Power className="w-3.5 h-3.5 text-red-400" />}
          label="Abuse Auto-Kill Switch"
          accent="bg-red-500/10"
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
            <span className="text-lg font-bold text-emerald-500">ARMED</span>
            <span className="text-[10px] dark:text-zinc-500 text-zinc-400 ml-auto">last event: {s.killSwitch.lastEvent}</span>
          </div>

          <div className="space-y-1.5">
            {s.killSwitch.events.slice(0, 3).map((ev, i) => (
              <motion.div
                key={`${ev.time}-${i}`}
                layout
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2 text-[10px]"
              >
                <code className="dark:text-zinc-600 text-zinc-400 font-mono shrink-0">{ev.time}</code>
                <span className="dark:text-zinc-400 text-zinc-500 leading-tight">{ev.msg}</span>
              </motion.div>
            ))}
          </div>
        </CardShell>

        {/* Card 4: Self-Healing Pool */}
        <CardShell
          icon={<Activity className="w-3.5 h-3.5 text-violet-400" />}
          label="Self-Healing Pool"
          accent="bg-violet-500/10"
        >
          <div className="flex items-center gap-3">
            <div>
              <div className="text-[10px] dark:text-zinc-500 text-zinc-400 uppercase tracking-wider mb-0.5">Active Nodes</div>
              <div className="flex items-baseline gap-1">
                <Counter value={s.selfHealing.activeNodes} className="text-2xl font-black dark:text-zinc-100 text-zinc-900 tabular-nums" />
                <span className="text-sm dark:text-zinc-500 text-zinc-400">/ {s.selfHealing.totalNodes}</span>
              </div>
            </div>
            <div className="ml-auto">
              <Ring pct={nodesPct} color="#a78bfa" size={56} />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] dark:text-zinc-500 text-zinc-400">
            <Zap className="w-3 h-3 text-violet-400" />
            Last webhook: <span className="text-violet-400 font-medium">{s.selfHealing.lastWebhook}</span>
          </div>

          <div className="space-y-1.5">
            {s.selfHealing.log.slice(0, 3).map((ev, i) => (
              <motion.div
                key={`${ev.time}-${i}`}
                layout
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start gap-2 text-[10px]"
              >
                <code className="dark:text-zinc-600 text-zinc-400 font-mono shrink-0">{ev.time}</code>
                <span className="dark:text-zinc-400 text-zinc-500 leading-tight">{ev.msg}</span>
              </motion.div>
            ))}
          </div>
        </CardShell>
      </div>
    </div>
  );
}
