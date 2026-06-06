import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, User, KeyRound, Activity } from "lucide-react";

const CREDENTIALS = {
  username: "Elbadoo461",
  password: "Elbadoo@461330",
} as const;

const SESSION_KEY = "zenrows_gatekeeper_v1";

export function isGatekeeperAuthenticated(): boolean {
  try { return sessionStorage.getItem(SESSION_KEY) === "1"; } catch { return false; }
}

export function setGatekeeperAuthenticated(): void {
  try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
}

interface Props { onAuthenticated: () => void; }

// Tiny floating orb
function Orb({ x, y, size, delay, color }: { x: string; y: string; size: number; delay: number; color: string }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ left: x, top: y, width: size, height: size, background: color, filter: "blur(40px)" }}
      animate={{ opacity: [0.12, 0.28, 0.12], scale: [1, 1.15, 1] }}
      transition={{ duration: 4 + delay, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

export default function GatekeeperLogin({ onAuthenticated }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);

  const clearError = () => setError(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || loading) return;
    setLoading(true);
    setError(null);

    setTimeout(() => {
      if (username.trim() === CREDENTIALS.username && password === CREDENTIALS.password) {
        setAuthenticated(true);
        setTimeout(() => {
          setGatekeeperAuthenticated();
          onAuthenticated();
        }, 600);
      } else {
        const msg = username.trim() !== CREDENTIALS.username
          ? "Unrecognized username. Access denied."
          : "Incorrect password. Access denied.";
        setError(msg);
        setLoading(false);
        setPassword("");
        setTimeout(() => {
          (username.trim() !== CREDENTIALS.username ? usernameRef : passwordRef).current?.focus();
        }, 50);
      }
    }, 750);
  };

  return (
    <AnimatePresence>
      {!authenticated && (
        <motion.div
          key="gate"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.5, ease: "easeIn" }}
          className="fixed inset-0 z-[200] flex overflow-hidden"
          style={{ background: "#06060d" }}
        >
          {/* ── Ambient background ── */}
          <Orb x="10%"  y="15%"  size={360} delay={0}   color="rgba(0,255,179,0.08)"  />
          <Orb x="65%"  y="60%"  size={300} delay={1.5} color="rgba(99,102,241,0.07)" />
          <Orb x="50%"  y="5%"   size={260} delay={2.8} color="rgba(0,200,122,0.05)"  />
          <Orb x="5%"   y="70%"  size={200} delay={0.8} color="rgba(245,158,11,0.04)" />

          {/* Dot grid */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }} />

          {/* ── Left panel — branding ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex flex-col justify-between p-12 w-[42%] shrink-0 relative"
          >
            {/* Logo + name */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, rgba(0,255,179,0.15), rgba(0,140,100,0.08))", border: "1px solid rgba(0,255,179,0.2)" }}>
                <Activity className="w-4.5 h-4.5" style={{ color: "#00ffb3" }} />
              </div>
              <span className="text-sm font-bold tracking-tight" style={{ color: "rgba(255,255,255,0.85)" }}>
                ZenRows <span className="font-normal" style={{ color: "rgba(255,255,255,0.3)" }}>Intel Engine</span>
              </span>
            </div>

            {/* Hero text */}
            <div className="flex flex-col gap-6">
              <div>
                <p className="text-[11px] font-bold tracking-[0.25em] uppercase mb-4" style={{ color: "#00ffb3" }}>
                  Restricted System Access
                </p>
                <h1 className="text-4xl font-black leading-tight tracking-tight" style={{ color: "rgba(255,255,255,0.92)" }}>
                  Sales Intelligence
                  <br />
                  <span style={{ color: "#00ffb3" }}>Command Center</span>
                </h1>
                <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Real-time developer pain signals from Reddit and Hacker News. Competitor intercept. Outreach automation. Unified in one secure workspace.
                </p>
              </div>

              {/* System status */}
              <div className="flex flex-col gap-2">
                {[
                  { label: "Lead Engine",       status: "Operational", color: "#00ffb3" },
                  { label: "Intercept Monitor", status: "Operational", color: "#00ffb3" },
                  { label: "Webhook Gateway",   status: "Standby",     color: "#f59e0b" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
                    <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{s.label}</span>
                    <span className="ml-auto text-[10px] font-semibold tracking-wide" style={{ color: s.color }}>{s.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)" }}>
              © 2026 ZenRows · Confidential · Authorized Personnel Only
            </p>

            {/* Vertical separator */}
            <div className="absolute right-0 top-12 bottom-12 w-px"
              style={{ background: "linear-gradient(180deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
          </motion.div>

          {/* ── Right panel — login form ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12"
          >
            <div className="w-full max-w-[380px]">

              {/* Card */}
              <div className="rounded-2xl p-8 flex flex-col gap-7"
                style={{
                  background: "linear-gradient(160deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 40px 100px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)",
                  backdropFilter: "blur(12px)",
                }}
              >
                {/* Card header */}
                <div className="flex flex-col gap-1.5">
                  <h2 className="text-xl font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>Sign in</h2>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Enter your credentials to access the dashboard.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                  {/* Username */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.3)" }}>
                      Username
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "rgba(255,255,255,0.2)" }} />
                      <input
                        ref={usernameRef}
                        type="text"
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); clearError(); }}
                        onKeyDown={(e) => { if (e.key === "Enter" && username.trim() && !password) passwordRef.current?.focus(); }}
                        placeholder="Username"
                        autoFocus
                        autoComplete="off"
                        spellCheck={false}
                        className="w-full pl-10 pr-4 py-3 rounded-xl text-[13px] outline-none transition-all duration-200"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: error ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.1)",
                          color: "rgba(220,220,240,0.95)",
                          caretColor: "#00ffb3",
                        }}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.3)" }}>
                      Password
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "rgba(255,255,255,0.2)" }} />
                      <input
                        ref={passwordRef}
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); clearError(); }}
                        placeholder="Password"
                        autoComplete="current-password"
                        className="w-full pl-10 pr-11 py-3 rounded-xl text-[13px] outline-none transition-all duration-200 font-mono tracking-widest"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: error ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.1)",
                          color: "rgba(220,220,240,0.95)",
                          caretColor: "#00ffb3",
                        }}
                      />
                      <button type="button" tabIndex={-1}
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                        style={{ color: "rgba(255,255,255,0.2)" }}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        key="err"
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-3 py-2 rounded-xl text-xs font-medium"
                        style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}
                      >
                        ⚠ {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={!username.trim() || !password || loading}
                    className="w-full py-3 rounded-xl text-[13px] font-bold tracking-wide transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed mt-1"
                    style={loading
                      ? { background: "rgba(0,255,179,0.07)", border: "1px solid rgba(0,255,179,0.18)", color: "#00ffb3" }
                      : {
                          background: "linear-gradient(135deg, #00b86e 0%, #00ffb3 100%)",
                          color: "#011208",
                          boxShadow: "0 8px 28px rgba(0,255,179,0.2), inset 0 1px 0 rgba(255,255,255,0.15)",
                        }
                    }
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2.5">
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }}
                          className="inline-block w-3.5 h-3.5 border-[2px] border-current border-t-transparent rounded-full" />
                        Verifying credentials…
                      </span>
                    ) : authenticated ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-base">✓</motion.span>
                        Access Granted
                      </span>
                    ) : "Sign in →"}
                  </button>
                </form>
              </div>

              {/* Below-card note */}
              <p className="text-center text-[10px] mt-4" style={{ color: "rgba(255,255,255,0.14)" }}>
                Unauthorized access attempts are logged and reported.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
