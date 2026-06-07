import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface Tab {
  id: string;
  label: string;
  mobileLabel: string;
  icon: React.ReactNode;
}

interface MobileTabMenuProps {
  open: boolean;
  tabs: Tab[];
  activeTab: string;
  hotCount: number;
  onTabChange: (id: string) => void;
  onClose: () => void;
}

export function MobileTabMenu({ open, tabs, activeTab, hotCount, onTabChange, onClose }: MobileTabMenuProps) {
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
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Slide-up sheet */}
          <motion.div
            key="sheet"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="fixed bottom-0 left-0 right-0 z-[201] rounded-t-2xl overflow-hidden"
            style={{
              background: "linear-gradient(180deg, rgba(10,10,18,0.99) 0%, rgba(6,6,12,0.99) 100%)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderBottom: "none",
              paddingBottom: "env(safe-area-inset-bottom, 16px)",
            }}
          >
            {/* Handle + header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="w-10 h-1 rounded-full bg-zinc-700 absolute left-1/2 -translate-x-1/2 top-2.5" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 pt-2">
                Navigation
              </span>
              <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center dark:bg-zinc-800 hover:dark:bg-zinc-700 transition-colors mt-2">
                <X className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </div>

            {/* Tab grid */}
            <div className="px-4 pb-4 pt-2 grid grid-cols-2 gap-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                const isFeed = tab.id === "feed";
                return (
                  <button
                    key={tab.id}
                    onClick={() => { onTabChange(tab.id); onClose(); }}
                    className="relative flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all active:scale-[0.98]"
                    style={{
                      background: isActive
                        ? "linear-gradient(135deg, rgba(0,255,179,0.08), rgba(0,200,122,0.04))"
                        : "rgba(255,255,255,0.03)",
                      border: isActive
                        ? "1px solid rgba(0,255,179,0.2)"
                        : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span
                      className="[&>svg]:w-4 [&>svg]:h-4 shrink-0"
                      style={{ color: isActive ? "#00ffb3" : "#52525b" }}
                    >
                      {tab.icon}
                    </span>
                    <span
                      className="text-[12px] font-semibold leading-tight"
                      style={{ color: isActive ? "#e4e4e7" : "#71717a" }}
                    >
                      {tab.label}
                    </span>
                    {/* Hot badge on feed */}
                    {isFeed && hotCount > 0 && (
                      <span className="ml-auto shrink-0 min-w-[18px] h-4.5 px-1 rounded-full bg-red-500 flex items-center justify-center">
                        <span className="text-[8px] font-black text-white">{Math.min(hotCount, 99)}</span>
                      </span>
                    )}
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#00ffb3", boxShadow: "0 0 6px #00ffb3" }} />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
