import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Mail, MessageSquare, Users } from "lucide-react";
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
  if (t.includes("cloudflare")) return "Cloudflare";
  if (t.includes("akamai")) return "Akamai Bot Manager";
  if (t.includes("datadome")) return "DataDome";
  if (t.includes("perimeterx") || t.includes("px ")) return "PerimeterX";
  if (t.includes("incapsula") || t.includes("imperva")) return "Imperva";
  if (t.includes("captcha") || t.includes("recaptcha")) return "CAPTCHA systems";
  if (t.includes("bot detection")) return "bot detection";
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

export default function OutreachDrawer({ lead, onClose }: Props) {
  const [activeTab, setActiveTab] = useState(0);

  const templates = lead ? buildTemplates(lead) : [];
  const active = templates[activeTab];

  return (
    <AnimatePresence>
      {lead && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 dark:bg-black/60 bg-black/30 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto
              dark:bg-[#0e0e1a] bg-white
              border-t dark:border-zinc-800 border-zinc-200
              rounded-t-2xl shadow-2xl"
            style={{ willChange: "transform" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full dark:bg-zinc-700 bg-zinc-300" />
            </div>

            <div className="px-4 pb-8 pt-2 max-w-2xl mx-auto">
              {/* Lead context */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1.5">
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
                  <p className="text-sm font-semibold dark:text-zinc-100 text-zinc-900 leading-snug line-clamp-2">
                    {lead.title}
                  </p>
                  <code className="text-[10px] dark:text-zinc-500 text-zinc-400 font-mono">{lead.keyword}</code>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-400 text-zinc-500 hover:dark:bg-zinc-700 hover:bg-zinc-200 transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Template selector */}
              <div className="flex gap-2 mb-4 border-b dark:border-zinc-800 border-zinc-100 pb-3">
                {templates.map((t, i) => (
                  <button
                    key={t.type}
                    onClick={() => setActiveTab(i)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                      ${activeTab === i
                        ? "dark:bg-blue-500/20 bg-blue-50 text-blue-500 dark:text-blue-400 border dark:border-blue-500/30 border-blue-200"
                        : "dark:text-zinc-500 text-zinc-500 hover:dark:text-zinc-300 hover:text-zinc-700"
                      }`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* Active template */}
              {active && (
                <div className="space-y-3">
                  {active.subject && (
                    <div className="p-3 rounded-xl dark:bg-zinc-800/50 bg-zinc-50 border dark:border-zinc-700/50 border-zinc-200">
                      <div className="text-[10px] uppercase tracking-wider dark:text-zinc-500 text-zinc-400 mb-1">Subject Line</div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm dark:text-zinc-200 text-zinc-700 font-medium">{active.subject}</p>
                        <CopyButton text={active.subject} />
                      </div>
                    </div>
                  )}

                  <div className="p-3 rounded-xl dark:bg-zinc-800/50 bg-zinc-50 border dark:border-zinc-700/50 border-zinc-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] uppercase tracking-wider dark:text-zinc-500 text-zinc-400">Message Body</div>
                      <CopyButton text={active.body} />
                    </div>
                    <pre className="text-xs dark:text-zinc-300 text-zinc-700 whitespace-pre-wrap leading-relaxed font-sans">
                      {active.body}
                    </pre>
                  </div>

                  <a
                    href={lead.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold
                      bg-blue-500 text-white hover:bg-blue-600 transition-colors active:scale-[0.99]"
                  >
                    Open Original Post ↗
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
