import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onDone: () => void;
}

const LOADING_STEPS = [
  "Initialising ZenRows Intel Engine…",
  "Connecting developer signal streams…",
  "Loading scraping pain point feeds…",
  "Almost ready…",
];

export default function SplashScreen({ onDone }: Props) {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStepIdx((i) => (i + 1) % LOADING_STEPS.length), 700);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "radial-gradient(ellipse at 50% 40%, #071a14 0%, #030a07 70%)" }}
    >
      <div className="flex flex-col items-center gap-8 select-none">

        {/* ── ZenRows logo ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative"
        >
          <div
            className="w-56 h-28 rounded-2xl overflow-hidden"
            style={{
              boxShadow: "0 0 48px rgba(0,255,180,0.22), 0 0 0 1px rgba(0,255,180,0.15)",
            }}
          >
            <img
              src={`${import.meta.env.BASE_URL}zenrows-logo.jpg`}
              alt="ZenRows"
              className="w-full h-full object-cover"
            />
          </div>
          {/* Glow pulse */}
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            style={{ boxShadow: "0 0 32px rgba(0,255,180,0.18)" }}
          />
        </motion.div>

        {/* ── Brand text ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center space-y-1"
        >
          <div
            className="text-[11px] font-semibold tracking-[0.32em] uppercase"
            style={{ color: "rgba(0,255,180,0.5)", fontFamily: "Inter, sans-serif" }}
          >
            Intel Engine
          </div>
        </motion.div>

        {/* ── Loading bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="flex flex-col items-center gap-3 w-64"
        >
          <div
            className="w-full h-[2px] rounded-full overflow-hidden"
            style={{ background: "rgba(0,255,180,0.08)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #00a86b, #00ffb3, #00ffd5, #00ffb3)",
                backgroundSize: "200% 100%",
              }}
              initial={{ width: "0%", backgroundPosition: "0% 50%" }}
              animate={{ width: "100%", backgroundPosition: "200% 50%" }}
              transition={{ delay: 0.6, duration: 2.4, ease: "easeInOut" }}
            />
          </div>

          <div className="h-4 flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={stepIdx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.2 }}
                className="text-[11px] font-medium tracking-widest"
                style={{
                  color: "rgba(0,255,180,0.45)",
                  fontFamily: "Inter, sans-serif",
                  letterSpacing: "0.15em",
                }}
              >
                {LOADING_STEPS[stepIdx]}
              </motion.span>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full"
                style={{ background: "#00ffb3" }}
                animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
