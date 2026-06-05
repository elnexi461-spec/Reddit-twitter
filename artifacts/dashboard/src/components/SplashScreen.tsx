import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onDone: () => void;
}

const LOADING_STEPS = [
  "Initialising Intel Engine…",
  "Connecting data streams…",
  "Loading lead signals…",
  "Almost ready…",
];

export default function SplashScreen({ onDone }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playCount = useRef(0);
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [stepIdx, setStepIdx] = useState(0);

  // Cycle through loading text
  useEffect(() => {
    const id = setInterval(() => setStepIdx((i) => (i + 1) % LOADING_STEPS.length), 700);
    return () => clearInterval(id);
  }, []);

  // Fallback: fire onDone after 6s if video never ends
  useEffect(() => {
    fallbackRef.current = setTimeout(onDone, 6000);
    return () => { if (fallbackRef.current) clearTimeout(fallbackRef.current); };
  }, [onDone]);

  const handleEnded = () => {
    playCount.current += 1;
    if (playCount.current < 2) {
      // Replay for the second time
      videoRef.current?.play().catch(() => {});
    } else {
      // Two plays complete — fire done immediately
      if (fallbackRef.current) clearTimeout(fallbackRef.current);
      onDone();
    }
  };

  const handleError = () => {
    // Video failed to load — use fallback timer (already set)
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "radial-gradient(ellipse at 50% 40%, #0a0d1a 0%, #050508 70%)",
      }}
    >
      <div className="flex flex-col items-center gap-8 select-none">

        {/* ── Glow halo behind logo ── */}
        <div className="relative flex items-center justify-center">
          <motion.div
            className="absolute rounded-full"
            animate={{ opacity: [0.25, 0.55, 0.25], scale: [1, 1.15, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
            style={{
              width: 160, height: 160,
              background: "radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 70%)",
              filter: "blur(20px)",
            }}
          />

          {/* ── Logo video ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="relative w-28 h-28 rounded-3xl overflow-hidden"
            style={{
              boxShadow: "0 0 40px rgba(59,130,246,0.25), 0 0 80px rgba(59,130,246,0.1), inset 0 1px 0 rgba(255,255,255,0.06)",
              border: "1px solid rgba(59,130,246,0.25)",
              background: "#070a12",
            }}
          >
            <video
              ref={videoRef}
              src={`${import.meta.env.BASE_URL}logo.mp4`}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
              onEnded={handleEnded}
              onError={handleError}
            />
          </motion.div>
        </div>

        {/* ── Brand text ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.55 }}
          className="text-center space-y-1.5"
        >
          <div
            className="text-3xl font-black tracking-tight"
            style={{
              fontFamily: "Inter, sans-serif",
              background: "linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Proxies<span style={{ color: "#3b82f6", WebkitTextFillColor: "#3b82f6" }}>.sx</span>
          </div>
          <div
            className="text-[11px] font-semibold tracking-[0.32em] uppercase"
            style={{ color: "rgba(148,163,184,0.5)", fontFamily: "Inter, sans-serif" }}
          >
            Intel Engine
          </div>
        </motion.div>

        {/* ── Loading bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="flex flex-col items-center gap-3 w-64"
        >
          {/* Bar track */}
          <div
            className="w-full h-[3px] rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #1d4ed8, #3b82f6, #60a5fa, #3b82f6)",
                backgroundSize: "200% 100%",
              }}
              initial={{ width: "0%", backgroundPosition: "0% 50%" }}
              animate={{ width: "100%", backgroundPosition: "200% 50%" }}
              transition={{ delay: 0.7, duration: 4.5, ease: "easeInOut" }}
            />
          </div>

          {/* Animated loading text */}
          <div className="h-4 flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={stepIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                className="text-[11px] font-medium tracking-widest"
                style={{
                  color: "rgba(148,163,184,0.55)",
                  fontFamily: "Inter, sans-serif",
                  letterSpacing: "0.15em",
                }}
              >
                {LOADING_STEPS[stepIdx]}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Three pulsing dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full"
                style={{ background: "#3b82f6" }}
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
