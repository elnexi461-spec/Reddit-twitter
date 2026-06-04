import { motion } from "framer-motion";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#07070e]">
      <div className="flex flex-col items-center gap-7">

        {/* Dual-ring geometric spinner */}
        <div className="relative w-24 h-24">
          {/* Outer ring */}
          <motion.svg
            viewBox="0 0 96 96"
            className="absolute inset-0 w-full h-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
            style={{ willChange: "transform" }}
          >
            <circle
              cx="48" cy="48" r="40"
              fill="none"
              stroke="#4f8fff"
              strokeWidth="2.5"
              strokeDasharray="94 158"
              strokeLinecap="round"
              opacity="0.9"
            />
          </motion.svg>

          {/* Inner ring (reverse) */}
          <motion.svg
            viewBox="0 0 96 96"
            className="absolute inset-0 w-full h-full"
            animate={{ rotate: -360 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
            style={{ willChange: "transform" }}
          >
            <circle
              cx="48" cy="48" r="26"
              fill="none"
              stroke="#22d668"
              strokeWidth="1.8"
              strokeDasharray="40 123"
              strokeLinecap="round"
              opacity="0.8"
            />
          </motion.svg>

          {/* Center pulse dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-2.5 h-2.5 rounded-full bg-blue-400"
              animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.45, ease: "easeOut" }}
          className="text-center"
        >
          <div className="text-xl font-bold tracking-tight text-white">
            Proxies<span className="text-blue-400">.sx</span>
          </div>
          <div className="text-[11px] text-zinc-500 mt-1 tracking-widest uppercase">
            Intel Engine
          </div>
        </motion.div>

        {/* Loading text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.6, 0.4, 0.7, 0.5] }}
          transition={{ delay: 0.5, duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="text-[10px] text-zinc-600 tracking-[0.2em] uppercase"
        >
          Initializing intelligence
        </motion.div>
      </div>
    </div>
  );
}
