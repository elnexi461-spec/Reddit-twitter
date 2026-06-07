import { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database, Download, FileJson, FileSpreadsheet,
  Terminal, Trash2,
} from "lucide-react";
import type { NormalizedStats } from "@/hooks/useNormalizedData";
import { exportAsJSON, exportAsCSV } from "@/hooks/useNormalizedData";
import type { TerminalEntry, MiningStatus } from "@/hooks/useMiningEngine";
import { toast } from "sonner";

// ─── Log level colors ─────────────────────────────────────────────────────────
const LEVEL_COLOR: Record<string, string> = {
  INFO:    "#60a5fa",
  SUCCESS: "#34d399",
  WARN:    "#fbbf24",
  ERROR:   "#f87171",
  DEBUG:   "#a78bfa",
};

const LEVEL_PREFIX: Record<string, string> = {
  INFO:    "[INFO]   ",
  SUCCESS: "[SUCCESS]",
  WARN:    "[WARN]   ",
  ERROR:   "[ERROR]  ",
  DEBUG:   "[DEBUG]  ",
};

// ─── Terminal log ─────────────────────────────────────────────────────────────
function TerminalLog({ entries, status, onClear }: {
  entries: TerminalEntry[];
  status: MiningStatus;
  onClear: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [entries.length]);

  const showPrompt = status === "idle" && entries.length === 0;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "rgba(2,5,4,0.98)",
        border: "1px solid rgba(0,255,179,0.1)",
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      }}
    >
      {/* Terminal top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
          </div>
          <Terminal className="w-3.5 h-3.5 text-zinc-600 ml-2" />
          <span className="text-[10px] text-zinc-600 font-mono tracking-wider">
            zenrows-mining-matrix v3.2
          </span>
        </div>
        {entries.length > 0 && (
          <button
            onClick={onClear}
            className="text-zinc-700 hover:text-zinc-500 transition-colors"
            title="Clear log"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Log body */}
      <div className="h-52 overflow-y-auto p-3 space-y-0.5 scrollbar-thin">
        {showPrompt ? (
          <div className="flex items-center gap-2 py-1">
            <span className="text-[11px]" style={{ color: "#00ffb3" }}>operator@zenrows:~$</span>
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
              className="w-1.5 h-3.5 inline-block"
              style={{ background: "#00ffb3" }}
            />
          </div>
        ) : (
          <>
            <div className="text-[11px] text-zinc-700 pb-1">
              operator@zenrows:~$ ./execute-mining-matrix --vectors all --normalize
            </div>
            <AnimatePresence initial={false}>
              {entries.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.12 }}
                  className="flex items-baseline gap-2 py-px"
                >
                  <span className="text-[10px] text-zinc-700 shrink-0 tabular-nums">{entry.ts}</span>
                  <span
                    className="text-[10px] font-bold shrink-0"
                    style={{ color: LEVEL_COLOR[entry.level] ?? "#aaa" }}
                  >
                    {LEVEL_PREFIX[entry.level] ?? entry.level}
                  </span>
                  <span className="text-[11px] leading-tight" style={{ color: "#c9d1d9" }}>
                    {entry.message}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
interface DataArbitragePanelProps {
  stats: NormalizedStats;
  status: MiningStatus;
  entries: TerminalEntry[];
  onClearLog: () => void;
}

export function DataArbitragePanel({ stats, status, entries, onClearLog }: DataArbitragePanelProps) {
  const handleJSON = () => {
    if (stats.totalCount === 0) { toast.error("No data to export. Run the mining matrix first."); return; }
    exportAsJSON(stats.normalizedLeads);
    toast.success(`Exported ${stats.totalCount} records as JSON`);
  };

  const handleCSV = () => {
    if (stats.totalCount === 0) { toast.error("No data to export. Run the mining matrix first."); return; }
    exportAsCSV(stats.normalizedLeads);
    toast.success(`Compiled ${stats.totalCount} records into CSV manifest`);
  };

  const payloadLabel = stats.payloadSizeKB >= 1024
    ? `${(stats.payloadSizeKB / 1024).toFixed(2)} MB`
    : `${stats.payloadSizeKB} KB`;

  return (
    <div className="space-y-3">
      {/* Header panel */}
      <div
        className="rounded-xl p-4"
        style={{
          background: "linear-gradient(160deg, rgba(6,6,14,0.98) 0%, rgba(4,4,10,0.98) 100%)",
          border: "1px solid rgba(0,255,179,0.12)",
        }}
      >
        {/* Title row */}
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4" style={{ color: "#00ffb3" }} />
          <span className="text-xs font-black tracking-[0.2em] uppercase" style={{ color: "#00ffb3" }}>
            Data Arbitrage Ingress
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <span
              className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
              style={{
                background: status === "complete" ? "rgba(0,255,179,0.1)" : "rgba(255,255,255,0.04)",
                color: status === "complete" ? "#00ffb3" : "#4b5563",
                border: `1px solid ${status === "complete" ? "rgba(0,255,179,0.2)" : "rgba(255,255,255,0.06)"}`,
              }}
            >
              {status === "complete" ? "MARKET READY" : "AWAITING HARVEST"}
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Mining Outputs", value: String(stats.totalCount), sub: "normalized entities" },
            { label: "Data Payload",   value: payloadLabel,              sub: "structured schema" },
            { label: "Market Ready",   value: `${stats.marketReadyPct}%`, sub: `${stats.marketReadyCount} signals` },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-lg p-3 flex flex-col gap-1"
              style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="text-[9px] uppercase tracking-wider text-zinc-600">{s.label}</div>
              <div className="text-xl font-black tabular-nums" style={{ color: "#00ffb3" }}>{s.value}</div>
              <div className="text-[9px] text-zinc-700">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleJSON}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold tracking-wide transition-all active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, rgba(0,150,100,0.4), rgba(0,255,179,0.15))",
              border: "1px solid rgba(0,255,179,0.25)",
              color: "#00ffb3",
              boxShadow: "0 2px 12px rgba(0,255,179,0.08)",
            }}
          >
            <FileJson className="w-3.5 h-3.5" />
            Export Master JSON
          </button>
          <button
            onClick={handleCSV}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold tracking-wide transition-all active:scale-[0.98]"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#d1d5db",
            }}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Compile CSV Manifest
          </button>
        </div>
      </div>

      {/* Terminal log */}
      <TerminalLog entries={entries} status={status} onClear={onClearLog} />
    </div>
  );
}

// ─── Compact export strip (shown inside individual tab panels in live mode) ───
export function ExportStrip({ stats, onJSON, onCSV }: {
  stats: NormalizedStats;
  onJSON: () => void;
  onCSV: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
      style={{ background: "rgba(0,255,179,0.04)", border: "1px solid rgba(0,255,179,0.1)" }}>
      <Database className="w-3 h-3 shrink-0" style={{ color: "#00ffb3" }} />
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#00ffb3" }}>
        {stats.totalCount} entities ready
      </span>
      <div className="flex-1" />
      <button onClick={onJSON} className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
        <Download className="w-2.5 h-2.5" /> JSON
      </button>
      <span className="text-zinc-700">·</span>
      <button onClick={onCSV} className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-400 hover:text-zinc-300 transition-colors">
        <Download className="w-2.5 h-2.5" /> CSV
      </button>
    </div>
  );
}
