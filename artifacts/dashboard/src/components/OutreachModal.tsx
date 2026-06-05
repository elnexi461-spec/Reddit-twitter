import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Mail, MessageSquare, Users, ExternalLink } from "lucide-react";
import type { Lead } from "@/hooks/useLeads";

interface Template {
  type: string;
  label: string;
  icon: React.ReactNode;
  subject?: string;
  body: string;
}

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
        `Hey! Saw your post about "${snippet}". ZenRows solves exactly this — our Web Scraping API has ${antiBot} bypass built in, no setup needed.\n\n` +
        `Happy to get you a free trial if you're still looking. What's your use case?`,
    },
    {
      type: "email",
      label: "Cold Email",
      icon: <Mail className="w-3.5 h-3.5" />,
      subject: `Re: ${snippet}`,
      body:
        `Hi,\n\nFound your post on ${platform} about ${antiBot} issues.\n\nZenRows is a Web Scraping API that handles this for you:\n` +
        `• ${antiBot} bypass — preconfigured, works out of the box\n` +
        `• Real browser rendering with anti-fingerprint headers\n` +
        `• Rotating residential IPs + stealth mode in one API call\n` +
        `• Pay-per-request, no monthly seats or minimums\n\n` +
        `Most devs unblock their scraping within 24 hours of switching.\n\n` +
        `Free trial, no card needed.\n\n` +
        `— [Your Name], ZenRows\nhttps://zenrows.com`,
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
        `ZenRows handles all of this at the API layer if you want to skip the setup. What site/platform is giving you trouble specifically?`,
    },
  ];
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
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

interface Props {
  lead: Lead | null;
  onClose: () => void;
}

export default function OutreachModal({ lead, onClose }: Props) {
  const [activeTab, setActiveTab] = useState(0);

  const templates = lead ? buildTemplates(lead) : [];
  const active = templates[activeTab];

  return (
    <AnimatePresence>
      {lead && (
        <>
          {/* Full-screen backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 dark:bg-black/70 bg-black/40 backdrop-blur-md"
          />

          {/* Centered full-page modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl
                dark:bg-[#0e0f1a] bg-white
                border dark:border-zinc-800/80 border-zinc-200"
              style={{
                boxShadow: "0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,255,180,0.07)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 px-6 pt-6 pb-4
                dark:bg-[#0e0f1a]/95 bg-white/95 backdrop-blur-sm
                border-b dark:border-zinc-800/60 border-zinc-100"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border
                        ${lead.source === "reddit"
                          ? "bg-orange-500/15 text-orange-400 border-orange-500/20"
                          : "bg-amber-500/15 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {lead.source === "reddit" ? "Reddit" : "HN"}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border
                        ${lead.tier === "hot" ? "bg-red-500/15 text-red-400 border-red-500/20"
                          : lead.tier === "warm" ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                          : "bg-zinc-500/15 text-zinc-400 border-zinc-500/20"
                        }`}
                      >
                        {lead.tier} · {lead.score}pts
                      </span>
                    </div>
                    <h2 className="text-base font-semibold dark:text-zinc-100 text-zinc-900 leading-snug line-clamp-2">
                      {lead.title}
                    </h2>
                    <code className="text-[10px] dark:text-zinc-500 text-zinc-400 font-mono mt-1 block">{lead.keyword}</code>
                  </div>
                  <button
                    onClick={onClose}
                    className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
                      dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-400 text-zinc-500
                      hover:dark:bg-zinc-700 hover:bg-zinc-200 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                {/* Template tabs */}
                <div className="flex gap-2 mb-5 pb-4 border-b dark:border-zinc-800 border-zinc-100">
                  {templates.map((t, i) => (
                    <button
                      key={t.type}
                      onClick={() => setActiveTab(i)}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all
                        ${activeTab === i
                          ? "dark:bg-emerald-500/20 bg-emerald-50 text-emerald-500 dark:text-emerald-400 border dark:border-emerald-500/30 border-emerald-200"
                          : "dark:text-zinc-500 text-zinc-500 hover:dark:text-zinc-300 hover:text-zinc-700 dark:hover:bg-zinc-800 hover:bg-zinc-50 border border-transparent"
                        }`}
                    >
                      {t.icon} {t.label}
                    </button>
                  ))}
                </div>

                {/* Active template content */}
                {active && (
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-4"
                  >
                    {active.subject && (
                      <div className="p-4 rounded-xl dark:bg-zinc-800/50 bg-zinc-50 border dark:border-zinc-700/50 border-zinc-200">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[10px] uppercase tracking-wider font-semibold dark:text-zinc-500 text-zinc-400">Subject Line</div>
                          <CopyButton text={active.subject} />
                        </div>
                        <p className="text-sm dark:text-zinc-200 text-zinc-700 font-medium">{active.subject}</p>
                      </div>
                    )}

                    <div className="p-4 rounded-xl dark:bg-zinc-800/50 bg-zinc-50 border dark:border-zinc-700/50 border-zinc-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-[10px] uppercase tracking-wider font-semibold dark:text-zinc-500 text-zinc-400">Message Body</div>
                        <CopyButton text={active.body} />
                      </div>
                      <pre className="text-sm dark:text-zinc-300 text-zinc-700 whitespace-pre-wrap leading-relaxed font-sans">
                        {active.body}
                      </pre>
                    </div>

                    <a
                      href={lead.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold
                        bg-emerald-500 text-white hover:bg-emerald-600 transition-colors active:scale-[0.99]"
                    >
                      Open Original Post <ExternalLink className="w-4 h-4" />
                    </a>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
