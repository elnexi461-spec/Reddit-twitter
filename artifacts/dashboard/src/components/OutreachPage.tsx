import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Copy, Check, Mail, MessageSquare, Users,
  ExternalLink, Flame, Thermometer, Minus,
} from "lucide-react";
import type { Lead } from "@/hooks/useLeads";

// ─── Deterministic variation picker (hash of lead.id) ────────────────────────

function hashPick<T>(id: string, arr: T[], salt = 0): T {
  let h = salt * 2654435769;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(h ^ id.charCodeAt(i), 2246822519)) >>> 0;
  }
  return arr[h % arr.length];
}

// ─── Deep context extraction ──────────────────────────────────────────────────

function extractContext(lead: Lead) {
  const t = lead.title.toLowerCase();
  const k = lead.keyword.toLowerCase();

  // Anti-bot system
  const antiBot =
    t.includes("turnstile") ? "Cloudflare Turnstile" :
    t.includes("cloudflare") ? "Cloudflare" :
    t.includes("datadome") ? "DataDome" :
    t.includes("akamai") ? "Akamai Bot Manager" :
    t.includes("perimeterx") || t.includes("px ") ? "PerimeterX" :
    t.includes("incapsula") || t.includes("imperva") ? "Imperva" :
    t.includes("recaptcha") || t.includes("captcha") ? "reCAPTCHA" :
    t.includes("fingerprint") ? "browser fingerprinting" :
    t.includes("bot detection") || t.includes("bot protect") ? "bot detection" :
    t.includes("rate limit") ? "rate limiting" :
    t.includes("access denied") || t.includes("403") ? "IP blocking" :
    t.includes("banned") ? "account/IP banning" :
    "bot protection";

  // Proxy type
  const proxyType =
    t.includes("sneaker") || t.includes("snkrs") ? "ISP proxies" :
    t.includes("isp") ? "ISP proxies" :
    t.includes("mobile") || t.includes("4g") ? "mobile proxies" :
    t.includes("rotating") ? "rotating residential proxies" :
    "residential proxies";

  // Programming language
  const language =
    t.includes("python") || k.includes("python") || t.includes("scrapy") || t.includes("requests") || t.includes("beautifulsoup") ? "Python" :
    t.includes("node") || t.includes("javascript") || t.includes("puppeteer") || t.includes("playwright") || t.includes("axios") ? "Node.js" :
    t.includes("go ") || t.includes("golang") ? "Go" :
    t.includes("java") || t.includes("spring") ? "Java" :
    t.includes("ruby") || t.includes("nokogiri") ? "Ruby" :
    t.includes("php") || t.includes("guzzle") ? "PHP" :
    t.includes("curl") ? "cURL" :
    "";

  // Automation tool
  const tool =
    t.includes("playwright") ? "Playwright" :
    t.includes("puppeteer") ? "Puppeteer" :
    t.includes("selenium") ? "Selenium" :
    t.includes("scrapy") ? "Scrapy" :
    t.includes("cheerio") ? "Cheerio" :
    "";

  // Use case
  const useCase =
    t.includes("price") ? "price monitoring" :
    t.includes("scraping") || t.includes("scrape") ? "web scraping" :
    t.includes("crawl") ? "crawling" :
    t.includes("monitor") ? "monitoring" :
    t.includes("automat") ? "automation" :
    t.includes("data collect") || t.includes("dataset") ? "data collection" :
    t.includes("check") || t.includes("stock") ? "inventory checking" :
    t.includes("sneaker") || t.includes("shoe") ? "sneaker copping" :
    t.includes("research") ? "market research" :
    t.includes("seo") ? "SEO tracking" :
    "data extraction";

  // Target site category
  const targetSite =
    t.includes("amazon") ? "Amazon" :
    t.includes("ebay") ? "eBay" :
    t.includes("shopify") || t.includes("ecommerce") || t.includes("e-commerce") ? "e-commerce" :
    t.includes("linkedin") ? "LinkedIn" :
    t.includes("twitter") || t.includes("x.com") ? "X/Twitter" :
    t.includes("instagram") ? "Instagram" :
    t.includes("reddit") ? "Reddit" :
    t.includes("google") ? "Google" :
    t.includes("zillow") || t.includes("realtor") || t.includes("real estate") ? "real estate" :
    t.includes("hotel") || t.includes("airbnb") || t.includes("booking") ? "travel booking" :
    "";

  // Urgency
  const urgency =
    lead.tier === "hot" ? "critical" :
    lead.tier === "warm" ? "high" :
    "medium";

  // Newbie signals
  const isNewbie =
    t.includes("new to") || t.includes("beginner") || t.includes("first time") ||
    t.includes("learning") || t.includes("how to") || t.includes("help me");

  // Extract key quoted phrase or first meaningful chunk of title
  const snippet = lead.title.length > 80 ? lead.title.slice(0, 77) + "…" : lead.title;

  // Compose the specific problem phrase
  const problemDetail = [
    antiBot !== "bot protection" ? antiBot : null,
    targetSite ? `on ${targetSite}` : null,
    language ? `with ${language}` : tool ? `using ${tool}` : null,
  ].filter(Boolean).join(" ") || "proxy blocking";

  const platform = lead.source === "reddit" ? "Reddit" : "Hacker News";

  return { antiBot, proxyType, language, tool, useCase, targetSite, urgency, isNewbie, snippet, problemDetail, platform };
}

// ─── Template builders ────────────────────────────────────────────────────────

interface Template {
  type: string;
  label: string;
  icon: React.ReactNode;
  subject?: string;
  body: string;
}

function buildDM(lead: Lead, ctx: ReturnType<typeof extractContext>): Template {
  const { antiBot, proxyType, useCase, urgency, isNewbie, snippet, problemDetail, platform } = ctx;

  const angle = hashPick(lead.id, ["empathy", "solution", "social", "curiosity", "direct"], 0);

  const openings: Record<string, string> = {
    empathy:
      `Hey — that ${antiBot} block you're hitting on your ${useCase} project is a well-known pain. ` +
      `The short version: ${antiBot} fingerprints request headers and IP reputation simultaneously, ` +
      `which is why standard proxies don't cut it anymore.`,
    solution:
      `Quick answer to your "${snippet.slice(0, 50)}…" post: ` +
      `${antiBot} needs ${proxyType} with real browser TLS fingerprints — ` +
      `once you match those two things, bypass rate jumps to 95%+.`,
    social:
      `Saw your ${platform} post about ${problemDetail}. ` +
      `We fixed this exact setup for ${hashPick(lead.id, ["3 teams", "a fintech startup", "a data agency", "two solo devs"], 1)} last week — ` +
      `the culprit was ${antiBot} cross-referencing IP reputation with browser JA3 signatures.`,
    curiosity:
      `There's a specific reason ${antiBot} is catching your ${useCase} requests — ` +
      `it's not just the IP, it's the TLS handshake signature that flags automated traffic before your first request lands.`,
    direct:
      `Your ${useCase} project is blocked because ${antiBot} blacklists ${
        hashPick(lead.id, ["datacenter IP ranges", "ASN prefixes used by cloud VMs", "IP ranges tied to hosting providers", "non-residential ASNs"], 2)
      } at the edge. ${proxyType.charAt(0).toUpperCase() + proxyType.slice(1)} with proper browser fingerprints solves it.`,
  };

  const cta = urgency === "critical"
    ? `I can get you a free 500MB trial running in under 10 minutes — want the setup link?`
    : urgency === "high"
    ? `Happy to set you up with a free trial — no credit card. What's your target volume?`
    : isNewbie
    ? `If you're new to proxies, I can walk you through setup in about 15 minutes. Interested?`
    : `Let me know your target site and I'll tell you exactly which config you need.`;

  return {
    type: "dm",
    label: "Quick DM",
    icon: <MessageSquare className="w-3.5 h-3.5" />,
    body: `${openings[angle]}\n\nAt Proxies.sx we offer ${proxyType} with ${antiBot} bypass built in — 40M+ IPs, pay-per-GB, no seats.\n\n${cta}`,
  };
}

function buildEmail(lead: Lead, ctx: ReturnType<typeof extractContext>): Template {
  const { antiBot, proxyType, useCase, urgency, language, tool, targetSite, snippet, problemDetail, platform } = ctx;

  const subjectAngle = hashPick(lead.id, ["repost", "problem", "fix", "specific", "value"], 3);
  const subjects: Record<string, string> = {
    repost: `Re: ${snippet}`,
    problem: `${antiBot} blocking your ${useCase}?`,
    fix: `Fix for ${problemDetail}`,
    specific: `${targetSite ? targetSite + " " : ""}${antiBot} bypass — ${proxyType}`,
    value: `Your ${useCase} project unblocked in 24h`,
  };

  const bodyAngle = hashPick(lead.id, ["story", "bullets", "technical", "roi"], 4);

  const langLine = language ? `\n• Works seamlessly with ${language}${tool ? " + " + tool : ""}` : "";

  const bodies: Record<string, string> = {
    story:
      `Hi,\n\nFound your post on ${platform} about ${problemDetail}.\n\n` +
      `${antiBot} is designed to catch exactly what most proxy services offer — ` +
      `it cross-checks IP reputation, TLS fingerprint, and HTTP/2 frame ordering in a single request. ` +
      `That's why datacenter or cheap rotating proxies stop working overnight.\n\n` +
      `At Proxies.sx we solve this with:\n` +
      `• 40M+ real residential IPs (actual ISP-assigned, not hosting ASNs)\n` +
      `• Auto-rotation with browser-grade TLS fingerprints (JA3 + HTTP/2 SETTINGS)\n` +
      `• ${antiBot} bypass — preconfigured, works day one${langLine}\n` +
      `• Pay-per-GB, no monthly seats or minimums\n\n` +
      `Most teams unblock their ${useCase} within 24 hours. Free 500MB trial — 2-minute setup.\n\n` +
      `— [Your Name], Proxies.sx\nhttps://proxies.sx`,
    bullets:
      `Hi,\n\nYour ${platform} post about ${problemDetail} caught our eye — this is exactly what Proxies.sx was built for.\n\n` +
      `Here's why ${antiBot} is specifically hard:\n` +
      `• It uses IP reputation scoring + behavioral analysis combined\n` +
      `• Standard rotating proxies fail because the ASN flags them immediately\n` +
      `• Most "residential" proxies are actually peer-to-peer and get flagged too\n\n` +
      `What we offer instead:\n` +
      `• Verified ISP-grade residential IPs — not peer-to-peer${langLine}\n` +
      `• ${antiBot} bypass preconfigured out of the box\n` +
      `• Sticky sessions + auto-rotation in one endpoint\n` +
      `• Pay-per-GB — you only pay for what you use\n\n` +
      `Want to test it on your ${useCase} setup? Free 500MB, no card needed.\n\n` +
      `— [Your Name], Proxies.sx\nhttps://proxies.sx`,
    technical:
      `Hi,\n\nSaw your post about ${problemDetail}.\n\n` +
      `The root cause: ${antiBot} combines IP reputation lookup with TLS client hello fingerprinting ` +
      `(JA3/JA3S) and HTTP/2 SETTINGS frame analysis. Even a clean IP gets flagged if the TLS ` +
      `fingerprint matches known automation stacks${language ? ` like ${language}'s default ssl library` : ""}.\n\n` +
      `Our solution:\n` +
      `• Residential IPs on genuine ISP ASNs (not hosting providers)\n` +
      `• TLS fingerprints that match real Chrome/Firefox/Safari clients\n` +
      `• ${antiBot}-specific header profiles included${langLine}\n` +
      `• 40M+ IPs, 195 countries, pay-per-GB\n\n` +
      `500MB free trial — drop me a reply and I'll get you set up today.\n\n` +
      `— [Your Name], Proxies.sx\nhttps://proxies.sx`,
    roi:
      `Hi,\n\nFounders and devs posting on ${platform} about ${antiBot} issues usually fall into one of two camps: ` +
      `either they've wasted weeks fighting it themselves, or they've already paid for a "solution" that stopped working.\n\n` +
      `If that sounds familiar — here's what actually works for ${useCase}:\n\n` +
      `→ ${proxyType.charAt(0).toUpperCase() + proxyType.slice(1)} on real ISP ASNs\n` +
      `→ Browser-grade TLS fingerprints (not automation-default)\n` +
      `→ ${antiBot} bypass profiles, preconfigured${langLine}\n\n` +
      `Proxies.sx: 40M+ IPs, pay-per-GB, free 500MB trial.\n` +
      `Most customers stop fighting ${antiBot} blocks within 24 hours.\n\n` +
      `Worth a try?\n\n` +
      `— [Your Name], Proxies.sx\nhttps://proxies.sx`,
  };

  return {
    type: "email",
    label: "Cold Email",
    icon: <Mail className="w-3.5 h-3.5" />,
    subject: subjects[subjectAngle],
    body: bodies[bodyAngle],
  };
}

function buildReply(lead: Lead, ctx: ReturnType<typeof extractContext>): Template {
  const { antiBot, proxyType, language, tool, useCase, targetSite, isNewbie, snippet } = ctx;

  const replyAngle = hashPick(lead.id, ["diagnostic", "technical", "practical", "story"], 5);

  const actionTool = tool || (language === "Python" ? "requests/httpx" : language === "Node.js" ? "fetch/axios" : "your HTTP client");

  const bodies: Record<string, string> = {
    diagnostic:
      `The ${antiBot} issue you're seeing is usually one of three things:\n\n` +
      `1. **IP reputation** — your IP's ASN is flagged as non-residential (datacenter ranges get blacklisted at the edge)\n` +
      `2. **TLS fingerprint mismatch** — ${antiBot} checks JA3/HTTP2 fingerprints; ${actionTool} default TLS looks nothing like a real browser\n` +
      `3. **Behavioral signals** — request timing, header order, and missing browser-native headers\n\n` +
      `For ${useCase}${targetSite ? " on " + targetSite : ""}, the fastest fix is switching to ${proxyType} and setting headers that match a real browser session.\n\n` +
      `${isNewbie
        ? `If you want a step-by-step, happy to help — what's your tech stack?`
        : `If you want, I can share a working config for ${antiBot} specifically.`}` +
      `\n\n(We handle this end-to-end at Proxies.sx if you'd rather skip the setup — ${proxyType} with ${antiBot} bypass preconfigured.)`,

    technical:
      `${antiBot} uses a multi-layer detection pipeline:\n\n` +
      `1. **IP layer** — ASN reputation scoring at ingress (cloud/hosting ASNs get 90%+ rejection rate)\n` +
      `2. **TLS layer** — JA3/JA3S + HTTP/2 SETTINGS frame fingerprinting\n` +
      `3. **Behavioral layer** — inter-request timing, header ordering, missing or wrong Accept-Language/Sec-CH-UA\n\n` +
      `Fixing step 1: Use genuine residential IPs (ISP-assigned, not peer-to-peer)\n` +
      `Fixing step 2: Override TLS fingerprints — ${language === "Python" ? "use `curl_cffi` with `impersonate=\"chrome110\"`" : language === "Node.js" ? "use `undici` or `fetch` with a Chromium TLS profile" : "match the TLS ClientHello to Chrome/Firefox"}\n` +
      `Fixing step 3: Copy headers verbatim from DevTools on the ${targetSite || "target site"} — every header in order\n\n` +
      `This combination resolves ${antiBot} blocks for ${useCase} in most cases. What's your current setup?`,

    practical:
      `For ${antiBot} on your ${useCase} project, here's what actually moves the needle:\n\n` +
      `✓ Switch to ${proxyType} — datacenter IPs are pre-flagged in ${antiBot}'s reputation DB\n` +
      `✓ Match TLS fingerprints — ${antiBot} checks JA3 signatures before your first byte lands\n` +
      `✓ Add missing browser headers — especially \`Sec-CH-UA\`, \`Sec-Fetch-*\`, \`Accept-Encoding\`\n` +
      `✓ Randomize request intervals — even 200–800ms jitter makes a big difference\n` +
      `✓ Use sticky sessions for multi-step flows (login → action)\n\n` +
      `The order matters: IP first, then TLS, then headers. Most people fix the headers and wonder why it still doesn't work.\n\n` +
      `Happy to share a working example for ${actionTool} if that helps.`,

    story:
      `Ran into this exact problem ${hashPick(lead.id, ["six months ago", "building a price tracker", "on a client project", "when scaling a monitoring tool"], 6)} — ${antiBot} is particularly nasty because it operates at the CDN layer, before your request even hits the origin server.\n\n` +
      `What finally worked for me:\n\n` +
      `1. ${proxyType.charAt(0).toUpperCase() + proxyType.slice(1)} — not datacenter, not peer-to-peer (P2P residential proxies share IPs with too many users and get flagged)\n` +
      `2. \`curl_cffi\` ${language === "Python" ? "(drop-in replacement for requests)" : language === "Node.js" ? "or a Node port of it" : ""} with Chrome impersonation — this fixes the TLS fingerprint problem in one line\n` +
      `3. Headers copied from a real browser session on ${targetSite || "the target site"} — DevTools → Network → copy as cURL, then import to ${actionTool}\n\n` +
      `${antiBot} detection dropped to near zero once all three were in place.\n\n` +
      `What stack are you using? I can give you a more specific config.`,
  };

  return {
    type: "reply",
    label: "Community Reply",
    icon: <Users className="w-3.5 h-3.5" />,
    body: bodies[replyAngle],
  };
}

function buildTemplates(lead: Lead): Template[] {
  const ctx = extractContext(lead);
  return [
    buildDM(lead, ctx),
    buildEmail(lead, ctx),
    buildReply(lead, ctx),
  ];
}

// ─── Copy button ──────────────────────────────────────────────────────────────

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
      {/* Back button */}
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
