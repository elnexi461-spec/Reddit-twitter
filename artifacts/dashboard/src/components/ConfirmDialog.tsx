import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ShieldAlert, Info } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  detail,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "warning",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onConfirm, onCancel]);

  const palette = {
    danger:  { icon: <ShieldAlert className="w-5 h-5" />, color: "#f87171", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.25)",  btn: "linear-gradient(135deg, #dc2626, #ef4444)" },
    warning: { icon: <AlertTriangle className="w-5 h-5" />, color: "#fbbf24", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)", btn: "linear-gradient(135deg, #d97706, #fbbf24)" },
    info:    { icon: <Info className="w-5 h-5" />,           color: "#00ffb3", bg: "rgba(0,255,179,0.08)", border: "rgba(0,255,179,0.2)",  btn: "linear-gradient(135deg, #00c87a, #00ffb3)" },
  }[variant];

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed z-[301] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="rounded-2xl p-6 flex flex-col gap-5"
              style={{
                background: "linear-gradient(160deg, rgba(18,18,28,0.99) 0%, rgba(10,10,16,0.99) 100%)",
                border: `1px solid ${palette.border}`,
                boxShadow: `0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.04)`,
              }}
            >
              {/* Icon + Title */}
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: palette.bg, border: `1px solid ${palette.border}`, color: palette.color }}
                >
                  {palette.icon}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="text-sm font-bold dark:text-zinc-100 text-zinc-900 leading-tight">{title}</h3>
                  <p className="text-xs dark:text-zinc-400 text-zinc-500 mt-1 leading-relaxed">{message}</p>
                  {detail && (
                    <p className="text-[11px] dark:text-zinc-600 text-zinc-400 mt-1.5 leading-relaxed">{detail}</p>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)" }} />

              {/* Actions */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={onCancel}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all active:scale-[0.98] dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-300 text-zinc-600 dark:border dark:border-zinc-700 border border-zinc-200 hover:dark:bg-zinc-700 hover:bg-zinc-200"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all active:scale-[0.98]"
                  style={{
                    background: palette.btn,
                    color: variant === "info" ? "#010f08" : "#ffffff",
                    boxShadow: `0 4px 16px ${palette.bg}`,
                  }}
                >
                  {confirmLabel}
                </button>
              </div>

              <p className="text-center text-[9px] dark:text-zinc-700 text-zinc-400 -mt-2">
                Press <kbd className="font-mono">Enter</kbd> to confirm · <kbd className="font-mono">Esc</kbd> to cancel
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
