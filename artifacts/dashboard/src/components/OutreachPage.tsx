import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Copy, Check, Mail, MessageSquare, Users,
  ExternalLink, Flame, Thermometer, Minus,
} from "lucide-react";
import type { Lead } from "@/hooks/useLeads";

// ─── Template builder (identical logic from OutreachModal) ───────────────────

function detectAntiBot(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("turnstile")) return "Cloudflare Turnstile";
  if (t.includes("cloudflare")) return "Cloudflare";
  if (t.includes("datadome")) return "DataDome";
  if (t.includes("akamai")) return "Akamai Bot Manager";
  if (t.includes("perimeterx") || t.includes("px ")) return "PerimeterX";
  if (t.includes("incapsula") || t.includes("imperva")) return "Imperva";
  if (t.includes("captcha") || t.includes("recaptcha")) return "CAPTCHA systems";
  if (t.includes("bot detection")) return "bot detection";
  if (t.includes("playwright") || t.includes("puppeteer")) return "browser automation detection";
  if (t.includes("access denied")) return "access restriction";
  return "anti-bot systems";
}

function detectProxyType(lead: Lead): string {
  const t = lead.title.toLowerCase();
  if (t.includes("sneaker") || t.includes("snkrs") || t.includes("shoe")) return "ISP proxies";
  if (t.includes("isp")) return "ISP proxies";
  if (t.includes("mobile")) return "mobile proxies";
  return "residential proxies";
}

interface Template {
  type: string;
  label: string;
  icon: React.ReactNode;
  subject?: string;
  body: string;
}

function buildTemplates(lead: Lead): Template[] {
  const platform = lead.source === "reddit" ? "Reddit" : "Hacker News";
  const antiBot = detectAntiBot(lead.title);
  const proxyType = detectProxyType(lead);
  const snippet = lead.title.length > 72 ? lead.title.slice(0, 69) + "…" : lead.title;

  return [
    {
      type: "dm",
      label: "Quick DM",
      icon: <MessageSquare className="w-3.5 h-3.5" />,
      body:
        `Hey! Saw your post about "${snippet}". We solve exactly this at Proxies.sx — ${proxyType} with auto-rotation and ${antiBot} bypass built in.\n\n` +
        `Happy to set you up with a free 500MB trial if you're still looking. What's your use case?`,
    },
    {
      type: "email",
      label: "Cold Email",
      icon: <Mail className="w-3.5 h-3.5" />,
      subject: `Re: ${snippet}`,
      body:
        `Hi,\n\nFound your post on ${platform} about ${antiBot} issues.\n\nAt Proxies.sx we offer:\n` +
        `• 40M+ residential IPs across 195 countries\n` +
        `• Auto-rotation with sticky session support\n` +
        `• ${antiBot} bypass — works out of the box\n` +
        `• Pay-per-GB, no monthly seats\n\n` +
        `Most teams fix their blocking issues within 24 hours of switching.\n\n` +
        `Want a 500MB free trial? 2-minute setup.\n\n` +
        `— [Your Name], Proxies.sx\nhttps://proxies.sx`,
    },
    {
      type: "reply",
      label: "Community Reply",
      icon: <Users className="w-3.5 h-3.5" />,
      body:
        `For ${antiBot} specifically, the issue is usually that datacenter IPs are pre-flagged in their reputation databases — switching to ${proxyType} with proper TLS fingerprinting fixes it for most sites.\n\n` +
        `A few things that actually work:\n` +
        `1. ${proxyType.charAt(0).toUpperCase() + proxyType.slice(1)} (not datacenter)\n` +
        `2. Match browser fingerprints — JA3/HTTP2 headers matter\n` +
        `3. Respect request timing — randomize intervals\n\n` +
        `We handle all of this at Proxies.sx if you want to skip the setup. What site/platform is giving you trouble specifically?`,
    },
  ];
}

// ─── Copy button ─────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
        dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-300 text-zinc-600
        dark:border dark:border-zinc-700 border border-zinc-200
        hover:dark:bg-zinc-700 hover:bg-zinc-200 active:scale-95"
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span key="check" initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="flex items-center gap-1 text-emerald-500">
            <Check className="w-3 h-3" /> Copied!
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ scale: 0.7 }} animate={{ scale: 1 }} className="flex items-center gap-1">
            <Copy className="w-3 h-3" /> Copy
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

// ─── Tier badge ───────────────────────────────────────────────────────────────

function TierTag({ tier, score }: { tier: Lead["tier"]; score: number }) {
  if (tier === "hot") return (
    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-500/15 text-red-400 border border-red-500/20">
      <Flame className="w-3 h-3" /> Hot · {score}pts
    </span>
  );
  if (tier === "warm") return (
    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/20">
      <Thermometer className="w-3 h-3" /> Warm · {score}pts
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-500/15 text-zinc-400 border border-zinc-500/20">
      <Minus className="w-3 h-3" /> Cool · {score}pts
    </span>
  );
}

// ─── OutreachPage ─────────────────────────────────────────────────────────────

interface Props {
  lead: Lead;
  onBack: () => void;
}

export default function OutreachPage({ lead, onBack }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const templates = buildTemplates(lead);
  const active = templates[activeTab];

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -12 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="space-y-5"
    >
      {/* Back button + header */}
      <div className="flex items-start gap-3">
        <button
          onClick={onBack}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all
            dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-300 text-zinc-600
            dark:border dark:border-zinc-700 border border-zinc-200
            hover:dark:bg-zinc-700 hover:bg-zinc-200 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Leads
        </button>
      </div>

      {/* Lead context card */}
      <div className="rounded-2xl border dark:bg-zinc-900/60 bg-white dark:border-zinc-800 border-zinc-200 p-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border
            ${lead.source === "reddit"
              ? "bg-orange-500/15 text-orange-400 border-orange-500/20"
              : "bg-amber-500/15 text-amber-400 border-amber-500/20"
            }`}
          >
            {lead.source === "reddit" ? "Reddit" : "HN"}
          </span>
          <TierTag tier={lead.tier} score={lead.score} />
        </div>
        <h2 className="text-base font-semibold dark:text-zinc-100 text-zinc-900 leading-snug mb-2">
          {lead.title}
        </h2>
        <div className="flex items-center gap-3 flex-wrap">
          <code className="text-[10px] dark:text-zinc-500 text-zinc-400 font-mono">{lead.keyword}</code>
          <a
            href={lead.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Open original post <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Template selector */}
      <div className="flex gap-2 flex-wrap">
        {templates.map((t, i) => (
          <button
            key={t.type}
            onClick={() => setActiveTab(i)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
              ${activeTab === i
                ? "dark:bg-blue-500/20 bg-blue-50 text-blue-500 dark:text-blue-400 border dark:border-blue-500/30 border-blue-200 shadow-sm"
                : "dark:text-zinc-500 text-zinc-500 hover:dark:text-zinc-300 hover:text-zinc-700 dark:hover:bg-zinc-800 hover:bg-zinc-50 border dark:border-zinc-800 border-zinc-200"
              }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Active template */}
      <AnimatePresence mode="wait" initial={false}>
        {active && (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            {active.subject && (
              <div className="rounded-2xl border dark:bg-zinc-900/50 bg-white dark:border-zinc-800 border-zinc-200 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b dark:border-zinc-800 border-zinc-100">
                  <span className="text-[11px] uppercase tracking-wider font-semibold dark:text-zinc-500 text-zinc-400">
                    Subject Line
                  </span>
                  <CopyButton text={active.subject} />
                </div>
                <div className="px-5 py-4">
                  <p className="text-sm dark:text-zinc-200 text-zinc-700 font-medium leading-relaxed">
                    {active.subject}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-2xl border dark:bg-zinc-900/50 bg-white dark:border-zinc-800 border-zinc-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b dark:border-zinc-800 border-zinc-100">
                <span className="text-[11px] uppercase tracking-wider font-semibold dark:text-zinc-500 text-zinc-400">
                  Message Body
                </span>
                <CopyButton text={active.body} />
              </div>
              <div className="px-5 py-4">
                <pre className="text-sm dark:text-zinc-300 text-zinc-700 whitespace-pre-wrap leading-relaxed font-sans">
                  {active.body}
                </pre>
              </div>
            </div>

            <a
              href={lead.url}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-semibold
                bg-blue-500 text-white hover:bg-blue-600 transition-colors active:scale-[0.99]"
            >
              Open Original Post & Send <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
