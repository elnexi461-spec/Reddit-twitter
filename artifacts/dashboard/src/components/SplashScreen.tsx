import { motion } from "framer-motion";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050508]">
      <div className="flex flex-col items-center gap-8">

        {/* Proxies.sx Logo Mark */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative"
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-2xl"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)",
              filter: "blur(16px)",
              transform: "scale(1.6)",
            }}
          />

          {/* Logo container */}
          <div className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
              border: "1px solid rgba(59,130,246,0.3)",
              boxShadow: "0 0 40px rgba(59,130,246,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {/* Network / proxy SVG icon */}
            <svg viewBox="0 0 48 48" className="w-11 h-11" fill="none">
              {/* Central node */}
              <circle cx="24" cy="24" r="5" fill="#3b82f6" opacity="0.95" />
              {/* Pulse ring */}
              <motion.circle
                cx="24" cy="24" r="9"
                stroke="#3b82f6" strokeWidth="1.2"
                fill="none" opacity="0.4"
                animate={{ r: [9, 13, 9], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
              {/* Outer nodes */}
              <circle cx="10" cy="14" r="3" fill="#60a5fa" opacity="0.8" />
              <circle cx="38" cy="14" r="3" fill="#60a5fa" opacity="0.8" />
              <circle cx="10" cy="34" r="3" fill="#60a5fa" opacity="0.8" />
              <circle cx="38" cy="34" r="3" fill="#60a5fa" opacity="0.8" />
              {/* Connection lines */}
              <line x1="24" y1="24" x2="10" y2="14" stroke="#3b82f6" strokeWidth="1.2" opacity="0.6" />
              <line x1="24" y1="24" x2="38" y2="14" stroke="#3b82f6" strokeWidth="1.2" opacity="0.6" />
              <line x1="24" y1="24" x2="10" y2="34" stroke="#3b82f6" strokeWidth="1.2" opacity="0.6" />
              <line x1="24" y1="24" x2="38" y2="34" stroke="#3b82f6" strokeWidth="1.2" opacity="0.6" />
              {/* Shield outline */}
              <path d="M24 4 L40 10 L40 26 C40 35 24 44 24 44 C24 44 8 35 8 26 L8 10 Z"
                stroke="#3b82f6" strokeWidth="1" fill="none" opacity="0.25" strokeLinejoin="round" />
            </svg>
          </div>
        </motion.div>

        {/* Brand name */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
          className="text-center"
        >
          <div className="text-2xl font-bold tracking-tight text-white" style={{ fontFamily: "Inter, sans-serif" }}>
            Proxies<span style={{ color: "#3b82f6" }}>.sx</span>
          </div>
          <div className="text-[11px] tracking-[0.25em] uppercase mt-1.5"
            style={{ color: "rgba(148,163,184,0.6)", fontFamily: "Inter, sans-serif" }}>
            Intel Engine
          </div>
        </motion.div>

        {/* Loading progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-48 flex flex-col items-center gap-2"
        >
          <div className="w-full h-0.5 rounded-full overflow-hidden"
            style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #3b82f6, #60a5fa)" }}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.6, duration: 1.2, ease: "easeInOut" }}
            />
          </div>
          <motion.div
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            className="text-[10px] tracking-[0.18em] uppercase"
            style={{ color: "rgba(148,163,184,0.5)", fontFamily: "Inter, sans-serif" }}
          >
            Loading…
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
