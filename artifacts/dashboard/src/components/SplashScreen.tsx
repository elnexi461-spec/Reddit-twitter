import { useEffect, useRef, useState } from "react";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const playCount = useRef(0);
  const fallbackRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setStepIdx((i) => (i + 1) % LOADING_STEPS.length), 700);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fallbackRef.current = setTimeout(onDone, 6000);
    return () => { if (fallbackRef.current) clearTimeout(fallbackRef.current); };
  }, [onDone]);

  const handleEnded = () => {
    playCount.current += 1;
    if (playCount.current < 2) {
      videoRef.current?.play().catch(() => {});
    } else {
      if (fallbackRef.current) clearTimeout(fallbackRef.current);
      onDone();
    }
  };

  const handleError = () => {};

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "radial-gradient(ellipse at 50% 40%, #071a14 0%, #030a07 70%)",
      }}
    >
      <div className="flex flex-col items-center gap-8 select-none">

        {/* ── Logo video ── */}
        <div className="relative flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="relative w-32 h-32 rounded-full overflow-hidden"
            style={{
              boxShadow: "0 0 40px rgba(0,255,180,0.18), 0 0 0 1px rgba(0,255,180,0.12)",
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
            ZenRows<span style={{ color: "#00ffb3", WebkitTextFillColor: "#00ffb3" }}></span>
          </div>
          <div
            className="text-[11px] font-semibold tracking-[0.32em] uppercase"
            style={{ color: "rgba(0,255,180,0.45)", fontFamily: "Inter, sans-serif" }}
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
          <div
            className="w-full h-[3px] rounded-full overflow-hidden"
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
              transition={{ delay: 0.7, duration: 4.5, ease: "easeInOut" }}
            />
          </div>

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
