import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";

const ACCESS_TOKEN = "AETHER_INTEL_2026";
const SESSION_KEY = "zenrows_gatekeeper_v1";

export function isGatekeeperAuthenticated(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function setGatekeeperAuthenticated(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {}
}

interface Props {
  onAuthenticated: () => void;
}

export default function GatekeeperLogin({ onAuthenticated }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || loading) return;
    setLoading(true);
    setTimeout(() => {
      if (value.trim() === ACCESS_TOKEN) {
        setGatekeeperAuthenticated();
        onAuthenticated();
      } else {
        setError(true);
        setLoading(false);
        setValue("");
        setTimeout(() => setError(false), 2800);
        inputRef.current?.focus();
      }
    }, 650);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 35%, #0b0b16 0%, #050507 100%)" }}
    >
      {/* Subtle dot-grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(rgba(0,255,179,0.07) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 72%)",
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 480,
          height: 480,
          borderRadius: "50%",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -55%)",
          background: "radial-gradient(ellipse, rgba(0,255,179,0.05) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[360px] mx-4"
      >
        <div
          className="rounded-2xl p-8 flex flex-col gap-7"
          style={{
            background: "linear-gradient(160deg, rgba(18,18,28,0.98) 0%, rgba(10,10,16,0.99) 100%)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow:
              "0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,255,179,0.05), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* Header */}
          <div className="flex flex-col items-center gap-4 text-center">
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4, type: "spring", stiffness: 300 }}
              className="relative"
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, rgba(0,255,179,0.12), rgba(0,140,100,0.07))",
                  border: "1px solid rgba(0,255,179,0.18)",
                  boxShadow: "0 0 28px rgba(0,255,179,0.09)",
                }}
              >
                <ShieldCheck className="w-6 h-6" style={{ color: "#00ffb3" }} />
              </div>
              <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                style={{ boxShadow: "0 0 16px rgba(0,255,179,0.12)" }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              <h1
                className="text-sm font-bold tracking-[0.22em] uppercase"
                style={{ color: "#e8e8f0" }}
              >
                Gatekeeper
              </h1>
              <p className="text-[11px] mt-1.5 tracking-wide" style={{ color: "rgba(255,255,255,0.25)" }}>
                Restricted access · Authorized personnel only
              </p>
            </motion.div>
          </div>

          {/* Divider */}
          <div
            className="h-px w-full"
            style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }}
          />

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
          >
            <div className="flex flex-col gap-2">
              <label
                className="text-[9px] font-bold tracking-[0.28em] uppercase"
                style={{ color: "rgba(255,255,255,0.28)" }}
              >
                Access Key / Password
              </label>

              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Lock className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.22)" }} />
                </div>

                <input
                  ref={inputRef}
                  type={showKey ? "text" : "password"}
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    if (error) setError(false);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit(e as unknown as React.FormEvent)}
                  placeholder="Enter access key…"
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full pl-10 pr-11 py-3 rounded-xl text-[13px] font-mono tracking-widest outline-none transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: error
                      ? "1px solid rgba(239,68,68,0.55)"
                      : "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(220,220,235,0.9)",
                    boxShadow: error
                      ? "0 0 0 3px rgba(239,68,68,0.1), inset 0 1px 0 rgba(255,255,255,0.03)"
                      : "inset 0 1px 0 rgba(255,255,255,0.03)",
                  }}
                />

                <button
                  type="button"
                  onClick={() => setShowKey((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors duration-150"
                  style={{ color: "rgba(255,255,255,0.22)" }}
                  tabIndex={-1}
                >
                  {showKey
                    ? <EyeOff className="w-3.5 h-3.5" />
                    : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    key="err"
                    initial={{ opacity: 0, y: -4, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[11px] font-medium"
                    style={{ color: "#f87171" }}
                  >
                    Invalid access key — authentication failed.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <button
              type="submit"
              disabled={!value.trim() || loading}
              className="w-full py-3 rounded-xl text-[13px] font-bold tracking-wider transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              style={
                loading
                  ? {
                      background: "rgba(0,255,179,0.08)",
                      border: "1px solid rgba(0,255,179,0.18)",
                      color: "#00ffb3",
                    }
                  : {
                      background: "linear-gradient(135deg, #00c87a 0%, #00ffb3 100%)",
                      color: "#010f08",
                      boxShadow: "0 6px 24px rgba(0,255,179,0.22), inset 0 1px 0 rgba(255,255,255,0.15)",
                    }
              }
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2.5">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }}
                    className="inline-block w-3.5 h-3.5 border-[2px] border-current border-t-transparent rounded-full"
                  />
                  Authenticating…
                </span>
              ) : (
                "Authenticate"
              )}
            </button>
          </motion.form>

          {/* Footer badge */}
          <motion.div
            className="flex items-center justify-center gap-2 pt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55, duration: 0.4 }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#00ffb3", boxShadow: "0 0 6px #00ffb3" }}
            />
            <span
              className="text-[9px] font-semibold tracking-[0.24em] uppercase"
              style={{ color: "rgba(255,255,255,0.18)" }}
            >
              ZenRows Intel Engine · Staging
            </span>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
