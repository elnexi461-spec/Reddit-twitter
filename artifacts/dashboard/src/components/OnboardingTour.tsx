import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Shield, Webhook, MessageSquare,
  RefreshCw, X, ChevronRight, ChevronLeft, Sparkles,
} from "lucide-react";

interface Step {
  icon: React.ReactNode;
  color: string;
  title: string;
  body: string;
  tip?: string;
}

const STEPS: Step[] = [
  {
    icon: <Sparkles className="w-7 h-7" />,
    color: "#00ffb3",
    title: "Welcome to ZenRows Intel Engine 👋",
    body: "This is your autonomous lead generation dashboard. It monitors Reddit, Hacker News, and other sources 24/7 — surfacing developers hitting Cloudflare blocks, Playwright timeouts, and anti-bot walls right now.",
    tip: "New developer pain signals appear automatically every 10 seconds.",
  },
  {
    icon: <Activity className="w-7 h-7" />,
    color: "#f97316",
    title: "Live Feed — Your Lead Pipeline",
    body: "The Live Feed shows real-time buyer signals scored by intent. 🔥 Hot leads scored 65+ are people actively blocked and searching for a solution today.",
    tip: "Click any lead's Reach Out button to get a ready-made outreach message.",
  },
  {
    icon: <MessageSquare className="w-7 h-7" />,
    color: "#8b5cf6",
    title: "Reach Out — Instant Outreach",
    body: "Click Reach Out on any lead to open a full-page composer with three message templates: a Quick DM, Cold Email, and a helpful Community Reply — all personalised to the lead.",
    tip: "Copy the message and paste it directly into Reddit, HN, or your email client.",
  },
  {
    icon: <Shield className="w-7 h-7" />,
    color: "#10b981",
    title: "ZenRows API Gateway Monitor",
    body: "The ZenRows Gateway Monitor tab shows live scraping telemetry: anti-bot success rate, gateway latency, circuit-breaker status, and residential pool rotation health. Currently shown with demo data.",
    tip: "Connect your ZenRows API gateway to see real metrics here.",
  },
  {
    icon: <Webhook className="w-7 h-7" />,
    color: "#f59e0b",
    title: "Integrations — Go Live",
    body: "Connect your Slack or Discord webhook to get instant hot-lead alerts in your team channel. Once connected, the system switches from demo data to real live feeds automatically.",
    tip: "Settings → Integrations to add your first webhook in under 60 seconds.",
  },
  {
    icon: <RefreshCw className="w-7 h-7" />,
    color: "#06b6d4",
    title: "You're All Set! 🚀",
    body: "The Intel Engine runs 24/7 in the background — scraping, scoring, and alerting you the moment a hot buyer signal appears. You never miss a qualified lead again.",
    tip: "Tip: Press Ctrl+R anytime to hard-refresh while keeping your place in the dashboard.",
  },
];

const LS_KEY = "zenrows_intel_onboarded";

export function isNewUser(): boolean {
  try { return !localStorage.getItem(LS_KEY); } catch { return false; }
}

export function markOnboarded(): void {
  try { localStorage.setItem(LS_KEY, "1"); } catch {}
}

interface Props {
  onClose: () => void;
}

export default function OnboardingTour({ onClose }: Props) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const go = (dir: number) => {
    const next = step + dir;
    if (next < 0 || next >= STEPS.length) return;
    setDirection(dir);
    setStep(next);
  };

  const handleDone = () => {
    markOnboarded();
    onClose();
  };

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      />

      {/* Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          className="relative w-full max-w-lg rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(160deg, #0c0f1e 0%, #0a0d1a 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,255,180,0.1)",
          }}
        >
          {/* Header gradient bar */}
          <div
            className="h-1 w-full"
            style={{
              background: `linear-gradient(90deg, transparent ${(step / (STEPS.length - 1)) * 0}%, ${current.color} 0%, ${current.color} ${((step + 1) / STEPS.length) * 100}%, rgba(255,255,255,0.07) ${((step + 1) / STEPS.length) * 100}%)`,
              transition: "all 0.4s ease",
            }}
          />

          {/* Close */}
          <button
            onClick={handleDone}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            <X className="w-3.5 h-3.5 text-zinc-400" />
          </button>

          {/* Step content */}
          <div className="px-8 pt-8 pb-6 min-h-[280px] flex flex-col">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex-1 flex flex-col"
              >
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 shrink-0"
                  style={{
                    background: `${current.color}18`,
                    border: `1px solid ${current.color}30`,
                    color: current.color,
                  }}
                >
                  {current.icon}
                </div>

                {/* Step number */}
                <div className="text-[10px] font-bold uppercase tracking-widest mb-2"
                  style={{ color: current.color }}
                >
                  Step {step + 1} of {STEPS.length}
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-white leading-tight mb-3">
                  {current.title}
                </h2>

                {/* Body */}
                <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                  {current.body}
                </p>

                {/* Tip */}
                {current.tip && (
                  <div
                    className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs"
                    style={{
                      background: `${current.color}0f`,
                      border: `1px solid ${current.color}20`,
                      color: current.color,
                    }}
                  >
                    <span className="shrink-0 mt-0.5">💡</span>
                    <span className="leading-relaxed">{current.tip}</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="px-8 pb-7 flex items-center justify-between gap-3">
            {/* Dot indicators */}
            <div className="flex items-center gap-1.5">
              {STEPS.map((_, i) => (
                <button key={i} onClick={() => { setDirection(i > step ? 1 : -1); setStep(i); }}
                  className="transition-all duration-300 rounded-full"
                  style={{
                    width: i === step ? 20 : 6,
                    height: 6,
                    background: i === step ? current.color : "rgba(255,255,255,0.15)",
                  }}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button
                  onClick={() => go(-1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                  style={{ background: "rgba(255,255,255,0.07)", color: "rgba(148,163,184,0.9)" }}
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Back
                </button>
              )}
              {isLast ? (
                <button
                  onClick={handleDone}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
                  style={{ background: current.color, color: "#fff" }}
                >
                  Get Started 🚀
                </button>
              ) : (
                <button
                  onClick={() => go(1)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
                  style={{ background: current.color, color: "#fff" }}
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
