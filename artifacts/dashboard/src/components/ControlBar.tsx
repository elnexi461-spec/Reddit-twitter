import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Play, CheckCircle, RotateCcw } from "lucide-react";
import type { MiningStatus } from "@/hooks/useMiningEngine";

interface ControlBarProps {
  status: MiningStatus;
  totalOutputs: number;
  onExecute: () => void;
  onReset: () => void;
}

export function ControlBar({ status, totalOutputs, onExecute, onReset }: ControlBarProps) {
  const isHarvesting = status === "harvesting";
  const isComplete = status === "complete";

  return (
    <div
      className="rounded-xl mb-4 px-4 py-3 flex items-center gap-3 flex-wrap"
      style={{
        background: "linear-gradient(135deg, rgba(0,10,8,0.95) 0%, rgba(0,18,12,0.95) 100%)",
        border: "1px solid rgba(0,255,179,0.15)",
        boxShadow: isHarvesting
          ? "0 0 24px rgba(0,255,179,0.08), inset 0 1px 0 rgba(0,255,179,0.05)"
          : "inset 0 1px 0 rgba(255,255,255,0.03)",
      }}
    >
      {/* Status badge */}
      <div className="flex items-center gap-2">
        <Cpu className="w-3.5 h-3.5 shrink-0" style={{ color: "#00ffb3" }} />
        <AnimatePresence mode="wait" initial={false}>
          {isHarvesting ? (
            <motion.div
              key="harvesting"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex items-center gap-1.5"
            >
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#00ffb3", boxShadow: "0 0 6px #00ffb3" }}
              />
              <span className="text-[11px] font-black tracking-[0.25em] uppercase" style={{ color: "#00ffb3" }}>
                HARVESTING…
              </span>
            </motion.div>
          ) : isComplete ? (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex items-center gap-1.5"
            >
              <CheckCircle className="w-3 h-3" style={{ color: "#00ffb3" }} />
              <span className="text-[11px] font-black tracking-[0.25em] uppercase" style={{ color: "#00ffb3" }}>
                COMPLETE
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              <span className="text-[11px] font-black tracking-[0.25em] uppercase text-zinc-500">
                ENGINE IDLE
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Separator */}
      <div className="h-4 w-px dark:bg-zinc-800 bg-zinc-200 hidden sm:block" />

      {/* Output count */}
      {totalOutputs > 0 && (
        <div className="hidden sm:flex items-center gap-1.5">
          <span className="text-[10px] dark:text-zinc-600 text-zinc-400 uppercase tracking-wider">Outputs:</span>
          <span className="text-[11px] font-bold tabular-nums" style={{ color: "#00ffb3" }}>
            {totalOutputs}
          </span>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Reset */}
      {(isHarvesting || isComplete) && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all active:scale-95
            dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-400 text-zinc-500 dark:border dark:border-zinc-700 border border-zinc-200
            hover:dark:bg-zinc-700 hover:bg-zinc-200"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      )}

      {/* Primary action */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onExecute}
        disabled={isHarvesting}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-black tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: isHarvesting
            ? "rgba(0,255,179,0.06)"
            : "linear-gradient(135deg, #00b86e 0%, #00ffb3 100%)",
          color: isHarvesting ? "#00ffb3" : "#011208",
          border: isHarvesting ? "1px solid rgba(0,255,179,0.2)" : "none",
          boxShadow: isHarvesting ? "none" : "0 4px 20px rgba(0,255,179,0.25)",
        }}
      >
        {isHarvesting ? (
          <>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
              className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full"
            />
            Mining…
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5" fill="currentColor" />
            Execute Mining Matrix
          </>
        )}
      </motion.button>
    </div>
  );
}
