import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Webhook, FlaskConical } from "lucide-react";

const LS_KEY = "zenrows_intel_demo_banner_dismissed";

interface Props {
  pageName?: string;
  onNavigateToIntegrations?: () => void;
}

export default function DemoBanner({ pageName, onNavigateToIntegrations }: Props) {
  const [dismissed, setDismissed] = useState(() => {
    try { return !!localStorage.getItem(LS_KEY + "_" + (pageName ?? "global")); } catch { return false; }
  });

  const dismiss = () => {
    try { localStorage.setItem(LS_KEY + "_" + (pageName ?? "global"), "1"); } catch {}
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden"
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm"
            style={{
              background: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(249,115,22,0.06) 100%)",
              border: "1px solid rgba(245,158,11,0.2)",
            }}
          >
            <FlaskConical className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="flex-1 text-amber-300/90 text-xs leading-relaxed">
              <span className="font-bold text-amber-300">Demo Data</span>
              {" "}— This page shows simulated data. Connect your webhooks & API in{" "}
              {onNavigateToIntegrations ? (
                <button
                  onClick={onNavigateToIntegrations}
                  className="underline underline-offset-2 font-semibold hover:text-amber-200 transition-colors"
                >
                  Integrations
                </button>
              ) : (
                <span className="font-semibold">Integrations</span>
              )}
              {" "}to start receiving live data automatically.
            </span>
            <button
              onClick={dismiss}
              className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-colors hover:bg-amber-400/10"
            >
              <X className="w-3 h-3 text-amber-400/60" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
