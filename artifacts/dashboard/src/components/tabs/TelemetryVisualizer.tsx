import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gauge, Layers, Zap, BarChart3, AlertTriangle, CheckCircle,
  Play, RotateCcw, TrendingUp, Cpu, Database,
} from "lucide-react";
import { useTelemetry, type DomainRow, type SentinelEvent } from "@/hooks/useTelemetry";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) { return n.toLocaleString(); }
function fmtPct(n: number) { return `${n.toFixed(1)}%`; }

// ─── SVG Radial Ring ─────────────────────────────────────────────────────────
function RadialRing({
  value, max, color, size = 96, strokeWidth = 7,
}: {
  value: number; max: number; color: string; size?: number; strokeWidth?: number;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, value / max);
  const offset = circ - pct * circ;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${circ}`}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1), stroke 0.4s" }}
      />
    </svg>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color = "#00ffb3" }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 100;
  const H = 30;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * (H - 4) - 2;
    return `${x},${y}`;
  }).join(" ");
  const area = `M${pts.split(" ").map((p, i) => (i === 0 ? `${p}` : `L${p}`)).join(" ")} L${W},${H} L0,${H} Z`;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id="spk-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spk-grad)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Metric Card ─────────────────────────────────────────────────────────────
function MetricCard({
  icon, title, accent, children,
}: {
  icon: React.ReactNode; title: string; accent: string; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-2xl border dark:bg-zinc-900/60 bg-white dark:border-zinc-800 border-zinc-200 p-4 flex flex-col gap-3 relative overflow-hidden"
    >
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-[0.04] pointer-events-none"
        style={{ background: accent, transform: "translate(30%, -30%)" }}
      />
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg" style={{ background: `${accent}18` }}>
          {icon}
        </div>
        <span className="text-[11px] font-semibold uppercase tracking-widest dark:text-zinc-500 text-zinc-400">
          {title}
        </span>
      </div>
      {children}
    </motion.div>
  );
}

// ─── Domain Risk Bar ─────────────────────────────────────────────────────────
function DomainBar({ row }: { row: DomainRow }) {
  const pct = (row.active / row.cap) * 100;
  const barColor =
    row.risk === "critical" ? "#ef4444"
    : row.risk === "warning"  ? "#f59e0b"
    : "#00ffb3";

  return (
    <motion.div
      layout
      className="flex items-center gap-2.5 py-1.5"
    >
      <span className="text-[11px] font-mono dark:text-zinc-300 text-zinc-600 w-28 shrink-0 truncate">{row.domain}</span>
      <div className="flex-1 h-2 rounded-full dark:bg-zinc-800 bg-zinc-100 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: barColor }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
      <span className="text-[11px] font-mono tabular-nums dark:text-zinc-400 text-zinc-500 w-14 text-right shrink-0">
        {row.active}<span className="dark:text-zinc-700 text-zinc-300">/100</span>
      </span>
      <span className={`text-[9px] font-bold uppercase tracking-wider w-14 shrink-0 text-right ${
        row.risk === "critical" ? "text-red-400"
        : row.risk === "warning" ? "text-amber-400"
        : "text-emerald-400"
      }`}>
        {row.throttled ? "COOLDOWN" : row.risk}
      </span>
    </motion.div>
  );
}

// ─── Sentinel Log Row ─────────────────────────────────────────────────────────
function LogRow({ ev, flash }: { ev: SentinelEvent; flash?: boolean }) {
  const colors = {
    critical: "text-red-400",
    warning:  "text-amber-400",
    recovery: "text-emerald-400",
    info:     "dark:text-zinc-500 text-zinc-400",
  };
  const prefixes = {
    critical: "⚠ CRIT",
    warning:  "◈ WARN",
    recovery: "✓ RECV",
    info:     "· INFO",
  };
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22 }}
      className={`flex items-start gap-2 px-2 py-1.5 rounded-lg text-[10px] font-mono leading-tight
        ${flash ? "dark:bg-red-950/30 bg-red-50 border dark:border-red-900/30 border-red-200" : ""}
      `}
    >
      <span className="dark:text-zinc-600 text-zinc-400 shrink-0 tabular-nums">{ev.time}</span>
      <span className={`shrink-0 font-bold ${colors[ev.kind]}`}>{prefixes[ev.kind]}</span>
      <span className={`flex-1 leading-snug ${colors[ev.kind]}`}>{ev.msg}</span>
    </motion.div>
  );
}

// ─── Collision Flash Banner ───────────────────────────────────────────────────
function CollisionBanner({ domain }: { domain: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.85 }}
      animate={{ opacity: [1, 0.7, 1], scaleY: 1 }}
      transition={{ duration: 0.4, opacity: { repeat: Infinity, duration: 0.8 } }}
      className="rounded-xl px-3 py-2.5 flex items-center gap-2 text-xs font-bold"
      style={{
        background: "linear-gradient(90deg, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.08) 100%)",
        border: "1px solid rgba(239,68,68,0.35)",
        boxShadow: "0 0 24px rgba(239,68,68,0.15)",
      }}
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
      </span>
      <span className="text-red-400">
        [CONCURRENCY COLLISION RISK: INITIATING COOLDOWN WEBHOOK] — {domain}
      </span>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TelemetryVisualizer() {
  const { state: s, triggerThrottle } = useTelemetry();
  const [throttleLoading, setThrottleLoading] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // Scroll log to top on new events
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = 0;
    }
  }, [s.sentinelLog.length]);

  // Ring color for concurrency
  const slotPct = s.activeSlots / s.slotCap;
  const slotColor =
    slotPct >= 0.95 ? "#ef4444"
    : slotPct >= 0.80 ? "#f59e0b"
    : "#00ffb3";

  const handleThrottle = () => {
    if (throttleLoading) return;
    setThrottleLoading(true);
    triggerThrottle();
    setTimeout(() => setThrottleLoading(false), 5_000);
  };

  const totalCreditsUsed = s.multiplierBreakdown.reduce((sum, r) => sum + r.creditsUsed, 0);

  return (
    <div className="space-y-5">

      {/* ── Status banner ── */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl dark:bg-emerald-950/20 bg-emerald-50 border dark:border-emerald-900/30 border-emerald-200">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
          ZenRows Enterprise Telemetry · {s.domains.length} domains tracked · 429 pre-emption active · updates every 1.8s
        </span>
      </div>

      {/* ── Collision banner ── */}
      <AnimatePresence>
        {s.collisionDomain && (
          <motion.div key="collision" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CollisionBanner domain={s.collisionDomain} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3 Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* Card 1: API Gateway Throughput */}
        <MetricCard
          icon={<Gauge className="w-3.5 h-3.5 text-[#00ffb3]" />}
          title="API Gateway Throughput"
          accent="#00ffb3"
        >
          <div className="flex items-baseline gap-1.5">
            <motion.span
              key={s.rps}
              initial={{ opacity: 0.6, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="text-4xl font-black tabular-nums"
              style={{ color: "#00ffb3" }}
            >
              {s.rps}
            </motion.span>
            <span className="text-sm font-semibold dark:text-zinc-400 text-zinc-500">req/s</span>
          </div>
          <div className="h-8 w-full">
            <Sparkline data={s.rpsTrend} color="#00ffb3" />
          </div>
          <div className="flex items-center gap-1.5 text-[10px] dark:text-zinc-500 text-zinc-400">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Rolling 10-tick average</span>
          </div>
        </MetricCard>

        {/* Card 2: Active Concurrency Slots */}
        <MetricCard
          icon={<Layers className="w-3.5 h-3.5" style={{ color: slotColor }} />}
          title="Active Concurrency Slots"
          accent={slotColor}
        >
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <RadialRing value={s.activeSlots} max={s.slotCap} color={slotColor} size={80} strokeWidth={6} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  key={s.activeSlots}
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 1 }}
                  className="text-base font-black tabular-nums dark:text-zinc-100 text-zinc-900"
                >
                  {s.activeSlots}
                </motion.span>
                <span className="text-[8px] dark:text-zinc-600 text-zinc-400 font-mono">/{s.slotCap}</span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <div className="text-[9px] uppercase tracking-wider dark:text-zinc-500 text-zinc-400">Headroom</div>
                <div className="text-xl font-bold tabular-nums" style={{ color: slotColor }}>
                  {s.concurrencyHeadroom}
                  <span className="text-xs font-normal dark:text-zinc-500 text-zinc-400 ml-1">slots free</span>
                </div>
              </div>
              <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full w-fit ${
                slotPct >= 0.95 ? "bg-red-500/15 text-red-400"
                : slotPct >= 0.80 ? "bg-amber-500/15 text-amber-400"
                : "bg-emerald-500/15 text-emerald-400"
              }`}>
                {slotPct >= 0.95 ? "COLLISION RISK" : slotPct >= 0.80 ? "NEAR CAP" : "NOMINAL"}
              </div>
            </div>
          </div>
        </MetricCard>

        {/* Card 3: Aggregated Cost Efficiency */}
        <MetricCard
          icon={<Zap className="w-3.5 h-3.5 text-violet-400" />}
          title="Aggregated Cost Efficiency"
          accent="#a78bfa"
        >
          <div>
            <div className="text-[9px] uppercase tracking-wider dark:text-zinc-500 text-zinc-400 mb-0.5">Credits Saved (429 avoidance)</div>
            <motion.div
              key={Math.floor(s.creditsSaved / 100)}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 1 }}
              className="text-3xl font-black tabular-nums text-violet-400"
            >
              {fmt(s.creditsSaved)}
            </motion.div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 rounded-full dark:bg-zinc-800 bg-zinc-100 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400"
                animate={{ width: `${s.costEfficiencyPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            <span className="text-sm font-bold text-violet-400 tabular-nums w-12 text-right">
              {fmtPct(s.costEfficiencyPct)}
            </span>
          </div>
          <div className="text-[10px] dark:text-zinc-500 text-zinc-400">
            {fmt(s.creditsProcessed)} total credits processed
          </div>
        </MetricCard>
      </div>

      {/* ── Domain Concurrency Table + Multiplier Breakdown ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Domain Concurrency */}
        <div className="rounded-2xl border dark:bg-zinc-900/60 bg-white dark:border-zinc-800 border-zinc-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-widest dark:text-zinc-500 text-zinc-400">
              Domain Concurrency
            </span>
            <span className="ml-auto text-[9px] dark:text-zinc-600 text-zinc-400 font-mono">cap: 100/domain</span>
          </div>
          <div className="space-y-0.5">
            {s.domains.map((row) => (
              <DomainBar key={row.domain} row={row} />
            ))}
          </div>
        </div>

        {/* Credit Consumption Multiplier */}
        <div className="rounded-2xl border dark:bg-zinc-900/60 bg-white dark:border-zinc-800 border-zinc-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-violet-500/10">
              <Database className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-widest dark:text-zinc-500 text-zinc-400">
              Credit Multiplier Breakdown
            </span>
          </div>
          <div className="space-y-2.5">
            {s.multiplierBreakdown.map((row) => {
              const share = totalCreditsUsed > 0 ? (row.creditsUsed / totalCreditsUsed) * 100 : 0;
              const mColor =
                row.multiplier >= 25 ? "#a78bfa"
                : row.multiplier >= 10 ? "#f59e0b"
                : row.multiplier >= 5  ? "#60a5fa"
                : "#00ffb3";
              return (
                <div key={row.type} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] dark:text-zinc-300 text-zinc-600 font-medium">{row.type}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded font-mono"
                        style={{ background: `${mColor}20`, color: mColor }}>
                        {row.multiplier}x
                      </span>
                      <span className="text-[10px] tabular-nums dark:text-zinc-500 text-zinc-400 font-mono w-16 text-right">
                        {fmt(row.creditsUsed)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full dark:bg-zinc-800 bg-zinc-100 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: mColor }}
                      animate={{ width: `${share}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="pt-1.5 border-t dark:border-zinc-800 border-zinc-100 flex items-center justify-between text-[10px]">
              <span className="dark:text-zinc-500 text-zinc-400">Total credits used</span>
              <span className="font-bold tabular-nums dark:text-zinc-200 text-zinc-800 font-mono">{fmt(totalCreditsUsed)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Rate-Limit Pre-Emptive Sentinel ── */}
      <div className="rounded-2xl border dark:bg-zinc-900/60 bg-white dark:border-zinc-800 border-zinc-200 overflow-hidden">
        {/* Panel header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b dark:border-zinc-800 border-zinc-100">
          <div className="p-1.5 rounded-lg bg-red-500/10">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest dark:text-zinc-300 text-zinc-700">
              Rate-Limit Pre-Emptive Sentinel
            </div>
            <div className="text-[9px] dark:text-zinc-500 text-zinc-400">
              Live event stream · 429 collision detection · auto-throttle circuit
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {/* Armed indicator */}
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg dark:bg-emerald-950/30 bg-emerald-50 border dark:border-emerald-900/30 border-emerald-200">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">ARMED</span>
            </div>
          </div>
        </div>

        {/* Throttle button */}
        <div className="px-4 py-3 flex items-center gap-3 border-b dark:border-zinc-800/50 border-zinc-100">
          <motion.button
            onClick={handleThrottle}
            disabled={throttleLoading || s.throttleActive}
            whileHover={{ scale: throttleLoading ? 1 : 1.02 }}
            whileTap={{ scale: throttleLoading ? 1 : 0.97 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: throttleLoading || s.throttleActive
                ? "rgba(239,68,68,0.15)"
                : "linear-gradient(135deg, rgba(239,68,68,0.9), rgba(220,38,38,0.8))",
              border: "1px solid rgba(239,68,68,0.35)",
              color: throttleLoading || s.throttleActive ? "#f87171" : "#fff",
              boxShadow: throttleLoading || s.throttleActive ? "none" : "0 4px 14px rgba(239,68,68,0.25)",
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {throttleLoading || s.throttleActive ? (
                <motion.span key="loading" className="flex items-center gap-2"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  Auto-Throttle Loop Running…
                </motion.span>
              ) : (
                <motion.span key="idle" className="flex items-center gap-2"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Play className="w-3.5 h-3.5" />
                  Test Auto-Throttling Loop
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          <p className="text-[10px] dark:text-zinc-500 text-zinc-400 leading-tight">
            Simulates a concurrency spike and triggers cooldown — watch the sentinel log and domain bars reset.
          </p>
        </div>

        {/* Log panel */}
        <div
          ref={logRef}
          className="max-h-72 overflow-y-auto px-3 py-2 space-y-0.5"
          style={{ scrollbarWidth: "thin" }}
        >
          <AnimatePresence initial={false}>
            {s.sentinelLog.map((ev, i) => (
              <LogRow key={ev.id} ev={ev} flash={ev.kind === "critical" && i === 0} />
            ))}
          </AnimatePresence>
          {s.sentinelLog.length === 0 && (
            <div className="flex items-center gap-2 px-2 py-4 text-[11px] dark:text-zinc-600 text-zinc-400">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Sentinel monitoring — no events yet. Waiting for traffic…
            </div>
          )}
        </div>
      </div>

      {/* ── Multiplier reference legend ── */}
      <div className="rounded-xl border dark:border-zinc-800/60 border-zinc-200 px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-3.5 h-3.5 dark:text-zinc-500 text-zinc-400" />
          <span className="text-[10px] font-semibold uppercase tracking-widest dark:text-zinc-500 text-zinc-400">
            ZenRows Credit Multiplier Reference
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Standard API",        mult: "1×",  color: "#00ffb3", note: "HTML-only, no JS" },
            { label: "JS Rendering",         mult: "5×",  color: "#60a5fa", note: "Chromium headless" },
            { label: "Stealth Mode",         mult: "10×", color: "#f59e0b", note: "Anti-bot bypass" },
            { label: "Premium Residential",  mult: "25×", color: "#a78bfa", note: "ISP residential IPs" },
          ].map((r) => (
            <div key={r.label}
              className="rounded-lg px-2.5 py-2 dark:bg-zinc-800/50 bg-zinc-50 border dark:border-zinc-700/50 border-zinc-200">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-sm font-black" style={{ color: r.color }}>{r.mult}</span>
                <span className="text-[10px] font-semibold dark:text-zinc-300 text-zinc-600">{r.label}</span>
              </div>
              <div className="text-[9px] dark:text-zinc-500 text-zinc-400">{r.note}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
