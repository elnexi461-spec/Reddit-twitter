import { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink, UserCheck, Check, Flame, Thermometer, Minus,
  Search, MessageSquare, StickyNote, X, RefreshCw, AlertCircle,
  TrendingUp, Zap, Clock, DollarSign, Copy, ChevronDown, ChevronUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  useCompetitorLeads,
  type CompetitorLead,
  type Competitor,
  type SentimentLabel,
  type PipelineStatus,
  type FilterCompetitor,
  type FilterSentiment,
} from "@/hooks/useCompetitorLeads";

// ─── Competitor config ────────────────────────────────────────────────────────

const COMPETITOR_COLORS: Record<Competitor, { bg: string; text: string; border: string; dot: string }> = {
  "Bright Data":  { bg: "bg-blue-500/10",   text: "text-blue-400",   border: "border-blue-500/25",  dot: "bg-blue-400" },
  "Oxylabs":      { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/25",dot: "bg-purple-400" },
  "ScraperAPI":   { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/25",dot: "bg-orange-400" },
  "Crawlbase":    { bg: "bg-cyan-500/10",   text: "text-cyan-400",   border: "border-cyan-500/25",  dot: "bg-cyan-400" },
  "Webshare":     { bg: "bg-rose-500/10",   text: "text-rose-400",   border: "border-rose-500/25",  dot: "bg-rose-400" },
};

const SENTIMENT_CONFIG: Record<SentimentLabel, { label: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
  extreme_churn_risk:      { label: "Extreme Churn Risk",      bg: "bg-red-500/15",    text: "text-red-400",    border: "border-red-500/25",    icon: <Flame className="w-2.5 h-2.5" /> },
  high_priority_migration: { label: "High Priority Migration", bg: "bg-amber-500/15",  text: "text-amber-400",  border: "border-amber-500/25",  icon: <TrendingUp className="w-2.5 h-2.5" /> },
  migration_potential:     { label: "Migration Potential",     bg: "bg-emerald-500/15",text: "text-emerald-400",border: "border-emerald-500/25", icon: <Zap className="w-2.5 h-2.5" /> },
};

// ─── Competitor-specific outreach templates ───────────────────────────────────

interface OutreachTemplate {
  label: string;
  subject?: string;
  body: string;
}

function getCompetitorTemplates(competitor: Competitor, postTitle: string): OutreachTemplate[] {
  const advantages: Record<Competitor, { pitch: string; points: string[] }> = {
    "Bright Data": {
      pitch: "simpler pricing model and a single-endpoint scraping API that handles anti-bot bypass natively — no seat licenses, no minimum commitments",
      points: [
        "Pay-per-request, not per datacenter seat — you only pay for what you scrape",
        "Cloudflare Turnstile, DataDome, and PerimeterX bypass built into every request",
        "One API endpoint, no proxy rotation management on your end",
        "Free 1,000 API credits to test on your actual use case",
      ],
    },
    "Oxylabs": {
      pitch: "anti-bot detection bypass that works at the browser fingerprint level — Cloudflare, DataDome, and PerimeterX all handled server-side",
      points: [
        "Real browser rendering in the cloud — no local Playwright/Puppeteer infra to manage",
        "Cloudflare Turnstile, DataDome, and PerimeterX bypass on every request",
        "Pay-per-request pricing — scales down to zero when you're not scraping",
        "Python, Node, Go, PHP SDKs with working code examples for your stack",
      ],
    },
    "ScraperAPI": {
      pitch: "full JavaScript rendering with anti-bot bypass on every request — no extra config, just point it at the URL",
      points: [
        "Renders JS-heavy SPAs and handles bot protection in a single API call",
        "Premium residential IPs with automatic rotation — no ban recovery headaches",
        "No success-rate fees — flat per-request pricing with a clear calculator",
        "Free trial with 1,000 API credits, no credit card required",
      ],
    },
    "Crawlbase": {
      pitch: "better documentation, higher success rates on bot-protected pages, and a real browser rendering engine — not just proxied HTTP",
      points: [
        "Real Chromium-based rendering — handles SPAs, infinite scroll, and JS-heavy sites",
        "Cloudflare and DataDome bypass without needing to pass any extra flags",
        "Response times under 5s for 95th percentile — measurable in the dashboard",
        "Detailed error codes so you know exactly why a request failed",
      ],
    },
    "Webshare": {
      pitch: "a full scraping API, not just proxies — anti-bot handling, JS rendering, and automatic session rotation all server-side",
      points: [
        "Handles Cloudflare, DataDome, and CAPTCHA challenges — no local proxy rotation",
        "Browser fingerprint randomization on every request",
        "Works with any HTTP client — no SDK required, just a URL param",
        "Designed for scraping pipelines, not general-purpose proxies",
      ],
    },
  };

  const adv = advantages[competitor];

  const dm: OutreachTemplate = {
    label: "Direct Message (Reddit/HN)",
    body: `Hey — saw your post about ${competitor} issues.

We built ZenRows specifically to fix the kind of problems you're running into. It's ${adv.pitch}.

What it handles that ${competitor} doesn't:
${adv.points.map((p) => `• ${p}`).join("\n")}

If you want to test it on the exact URL that's giving you trouble, I can set you up with a free trial account — no card required. Just drop a reply here or check out zenrows.com.`,
  };

  const email: OutreachTemplate = {
    label: "Cold Email",
    subject: `Re: ${competitor} issues — ZenRows might be what you're looking for`,
    body: `Hi,

Came across your post about running into problems with ${competitor}.

ZenRows is ${adv.pitch}. A lot of developers switch after hitting the same wall you described.

Here's why it's a better fit for your use case:
${adv.points.map((p) => `• ${p}`).join("\n")}

Happy to set you up with a free trial — 1,000 API credits, no commitment. You can test it against the site that's blocking you right now.

Give it a look: https://zenrows.com
Or just reply here and I'll walk you through setup.

— [Your Name], ZenRows / https://zenrows.com`,
  };

  const community: OutreachTemplate = {
    label: "Community Reply",
    body: `I ran into the same ${competitor} limitations on a scraping project last year and ended up switching to ZenRows — it's ${adv.pitch}.

${adv.points[0]} — and ${adv.points[1].toLowerCase()}.

They have a free trial if you want to test it against whatever site is giving you trouble: https://zenrows.com`,
  };

  return [dm, email, community];
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function CompetitorBadge({ competitor }: { competitor: Competitor }) {
  const c = COMPETITOR_COLORS[competitor];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${c.bg} ${c.text} border ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {competitor}
    </span>
  );
}

function SentimentBadge({ label }: { label: SentimentLabel }) {
  const s = SENTIMENT_CONFIG[label];
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${s.bg} ${s.text} border ${s.border}`}>
      {s.icon} {s.label}
    </span>
  );
}

function TierBadge({ tier, score }: { tier: CompetitorLead["tier"]; score: number }) {
  if (tier === "hot") return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-red-500/15 text-red-400 border border-red-500/20">
      <Flame className="w-2 h-2" /> Hot {score}
    </span>
  );
  if (tier === "warm") return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/15 text-amber-400 border border-amber-500/20">
      <Thermometer className="w-2 h-2" /> Warm {score}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-zinc-500/15 text-zinc-500 border border-zinc-500/20 dark:text-zinc-400">
      <Minus className="w-2 h-2" /> Cool {score}
    </span>
  );
}

function SourceBadge({ source }: { source: "reddit" | "HN" }) {
  if (source === "reddit") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/20">
      <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
        <circle cx="10" cy="10" r="10" />
        <path fill="white" d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.07 2.13.45a1 1 0 1 0 1-1 1 1 0 0 0-.96.68l-2.38-.5a.27.27 0 0 0-.32.2l-.73 3.44a7.14 7.14 0 0 0-3.89 1.23 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .68-1.59zM7.27 11a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.58 2.71a3.58 3.58 0 0 1-2.85.87 3.58 3.58 0 0 1-2.85-.87.27.27 0 0 1 .38-.38 3.1 3.1 0 0 0 2.47.69 3.1 3.1 0 0 0 2.47-.69.27.27 0 0 1 .38.38zm-.13-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" />
      </svg>
      Reddit
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/20">
      <span className="font-black text-[9px]">Y</span> HN
    </span>
  );
}

function UrgencyBadge({ timestamp }: { timestamp: string }) {
  const ageMs = Date.now() - new Date(timestamp).getTime();
  const ageH = ageMs / (1000 * 60 * 60);

  if (ageH < 0.5) return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <Zap className="w-2 h-2" /> Fresh
    </span>
  );
  if (ageH > 48) return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-zinc-500/10 text-zinc-500 border border-zinc-500/20">
      <Clock className="w-2 h-2" /> Cooling
    </span>
  );
  return null;
}

// ─── Pipeline pill ────────────────────────────────────────────────────────────

const PIPELINE_STYLES: Record<PipelineStatus, { pill: string; dot: string }> = {
  unclaimed: { pill: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",     dot: "bg-zinc-500" },
  contacted: { pill: "bg-blue-500/10 text-blue-400 border-blue-500/20",     dot: "bg-blue-500" },
  qualified: { pill: "bg-amber-500/10 text-amber-400 border-amber-500/20",  dot: "bg-amber-500" },
  converted: { pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500" },
};

const PIPELINE_STAGES: { status: PipelineStatus; label: string }[] = [
  { status: "unclaimed", label: "Unclaimed" },
  { status: "contacted", label: "Contacted" },
  { status: "qualified", label: "Qualified" },
  { status: "converted", label: "Converted" },
];

function PipelinePill({ status, onChange }: { status: PipelineStatus; onChange: (s: PipelineStatus) => void }) {
  const [open, setOpen] = useState(false);
  const s = PIPELINE_STYLES[status];
  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border transition-colors ${s.pill}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        {status}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 mt-1 z-20 min-w-[130px] dark:bg-zinc-900 bg-white border dark:border-zinc-700 border-zinc-200 rounded-xl shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {PIPELINE_STAGES.map((stage) => {
              const ss = PIPELINE_STYLES[stage.status];
              return (
                <button
                  key={stage.status}
                  onClick={() => { onChange(stage.status); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center gap-2
                    hover:dark:bg-zinc-800 hover:bg-zinc-50 transition-colors
                    ${status === stage.status ? "opacity-50 cursor-default" : ""}`}
                >
                  <span className={`w-2 h-2 rounded-full ${ss.dot}`} />
                  {stage.label}
                  {status === stage.status && <Check className="w-3 h-3 ml-auto dark:text-zinc-500 text-zinc-400" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      {open && <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />}
    </div>
  );
}

// ─── Outreach panel ───────────────────────────────────────────────────────────

function CompetitorOutreachPanel({ lead, onClose }: { lead: CompetitorLead; onClose: () => void }) {
  const templates = getCompetitorTemplates(lead.competitorMention, lead.title);
  const [activeIdx, setActiveIdx] = useState(0);
  const active = templates[activeIdx];

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success("Copied to clipboard")).catch(() => toast.error("Copy failed"));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.15 }}
      className="mt-3 rounded-xl border dark:border-emerald-500/20 border-emerald-200 dark:bg-emerald-950/10 bg-emerald-50/60 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-2.5 border-b dark:border-emerald-500/15 border-emerald-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
            Competitor Outreach — vs {lead.competitorMention}
          </span>
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Template tabs */}
      <div className="flex border-b dark:border-zinc-800 border-zinc-200">
        {templates.map((t, i) => (
          <button
            key={t.label}
            onClick={() => setActiveIdx(i)}
            className={`flex-1 px-3 py-2 text-[10px] font-semibold transition-colors
              ${activeIdx === i
                ? "dark:text-emerald-400 text-emerald-600 dark:border-b-2 dark:border-emerald-500 border-b-2 border-emerald-500"
                : "dark:text-zinc-500 text-zinc-400 hover:dark:text-zinc-300 hover:text-zinc-500"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Template body */}
      <div className="p-4 space-y-3">
        {active.subject && (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider dark:text-zinc-500 text-zinc-400 mb-1">Subject</div>
            <div className="flex items-start gap-2">
              <code className="flex-1 text-xs dark:text-zinc-300 text-zinc-700 dark:bg-zinc-800 bg-white border dark:border-zinc-700 border-zinc-200 rounded-lg p-2.5 font-mono leading-relaxed">
                {active.subject}
              </code>
              <button
                onClick={() => copy(active.subject!)}
                className="shrink-0 p-2 rounded-lg dark:bg-zinc-800 bg-white dark:border dark:border-zinc-700 border border-zinc-200 dark:text-zinc-400 text-zinc-500 hover:dark:text-emerald-400 hover:text-emerald-600 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider dark:text-zinc-500 text-zinc-400 mb-1">Message</div>
          <div className="flex items-start gap-2">
            <pre className="flex-1 text-xs dark:text-zinc-300 text-zinc-700 dark:bg-zinc-800 bg-white border dark:border-zinc-700 border-zinc-200 rounded-lg p-2.5 font-mono leading-relaxed whitespace-pre-wrap break-words">
              {active.body}
            </pre>
            <button
              onClick={() => copy(active.body)}
              className="shrink-0 p-2 rounded-lg dark:bg-zinc-800 bg-white dark:border dark:border-zinc-700 border border-zinc-200 dark:text-zinc-400 text-zinc-500 hover:dark:text-emerald-400 hover:text-emerald-600 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Lead card ────────────────────────────────────────────────────────────────

function CompetitorLeadCard({
  lead, index, isClaiming,
  onClaim, onUnclaim, onPipelineChange, onNoteAdd,
}: {
  lead: CompetitorLead;
  index: number;
  isClaiming: boolean;
  onClaim: () => void;
  onUnclaim: () => void;
  onPipelineChange: (s: PipelineStatus) => void;
  onNoteAdd: (text: string) => void;
}) {
  const [showOutreach, setShowOutreach] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const timeAgo = (() => {
    try { return formatDistanceToNow(new Date(lead.timestamp), { addSuffix: true }); }
    catch { return ""; }
  })();

  const handleNoteSubmit = () => {
    if (!noteText.trim()) return;
    onNoteAdd(noteText.trim());
    setNoteText("");
    setShowNote(false);
  };

  const isExtreme = lead.sentimentLabel === "extreme_churn_risk";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.25), duration: 0.2, ease: "easeOut" }}
      className={`relative rounded-xl border transition-all duration-200 overflow-hidden
        ${lead.claimed ? "opacity-70" : ""}
        ${isExtreme
          ? "dark:bg-red-950/10 bg-red-50/40 border-red-900/20 dark:border-red-900/15"
          : "dark:bg-zinc-900/40 bg-white border-zinc-200 dark:border-zinc-800/70"
        }`}
    >
      {/* Left pipeline stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5
        ${lead.pipelineStatus === "contacted" ? "bg-blue-500"
          : lead.pipelineStatus === "qualified" ? "bg-amber-500"
          : lead.pipelineStatus === "converted" ? "bg-emerald-500"
          : "bg-transparent"
        }`}
      />

      <div className="p-4 pl-5">
        {/* Badge row */}
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <SourceBadge source={lead.source} />
          <CompetitorBadge competitor={lead.competitorMention} />
          <SentimentBadge label={lead.sentimentLabel} />
          <TierBadge tier={lead.tier} score={lead.score} />
          {lead.priceComplaint && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
              <DollarSign className="w-2 h-2" /> Price Complaint
            </span>
          )}
          {lead.detectedLanguage && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
              {lead.detectedLanguage}
            </span>
          )}
          <UrgencyBadge timestamp={lead.timestamp} />
          <PipelinePill status={lead.pipelineStatus ?? "unclaimed"} onChange={onPipelineChange} />
          <span className="text-[10px] dark:text-zinc-600 text-zinc-400 ml-auto whitespace-nowrap">{timeAgo}</span>
        </div>

        {/* Title */}
        <p className="text-sm font-medium leading-snug dark:text-zinc-100 text-zinc-900 line-clamp-2 mb-2">
          {lead.title}
        </p>

        {/* Keyword */}
        <div className="mb-3">
          <code className="text-[10px] px-1.5 py-0.5 rounded dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-400 text-zinc-500 font-mono">
            {lead.keyword}
          </code>
          {lead.frustrationScore >= 50 && (
            <span className="ml-2 text-[10px] dark:text-zinc-600 text-zinc-400">
              frustration score: <span className="dark:text-zinc-400 text-zinc-600 font-mono">{lead.frustrationScore}</span>
            </span>
          )}
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={lead.url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
              dark:bg-blue-500/15 bg-blue-50 dark:text-blue-400 text-blue-600
              dark:border dark:border-blue-500/25 border border-blue-200
              hover:dark:bg-blue-500/25 hover:bg-blue-100 active:scale-95"
          >
            View Post <ExternalLink className="w-3 h-3" />
          </a>

          {lead.claimed ? (
            <button
              onClick={onUnclaim}
              disabled={isClaiming}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all
                text-emerald-500 bg-emerald-500/10 border border-emerald-500/20
                hover:bg-emerald-500/20 hover:text-emerald-400 active:scale-95 disabled:opacity-40"
            >
              {isClaiming ? "…" : <><Check className="w-3 h-3" /> Claimed</>}
            </button>
          ) : (
            <button
              onClick={onClaim}
              disabled={isClaiming}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-300 text-zinc-600
                dark:border dark:border-zinc-700 border border-zinc-200
                hover:dark:bg-zinc-700 hover:bg-zinc-200 disabled:opacity-40 active:scale-95"
            >
              <UserCheck className="w-3 h-3" /> {isClaiming ? "…" : "Claim"}
            </button>
          )}

          <button
            onClick={() => { setShowOutreach((v) => !v); setShowNote(false); }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
              border active:scale-95
              ${showOutreach
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 dark:bg-emerald-500/20"
                : "dark:bg-emerald-500/10 bg-emerald-50 dark:text-emerald-400 text-emerald-600 dark:border-emerald-500/20 border-emerald-200 hover:dark:bg-emerald-500/20 hover:bg-emerald-100"
              }`}
          >
            <MessageSquare className="w-3 h-3" />
            {showOutreach ? "Close Outreach" : "Outreach"}
          </button>

          <button
            onClick={() => { setShowNote(!showNote); setTimeout(() => noteRef.current?.focus(), 80); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
              dark:text-zinc-500 text-zinc-400 hover:dark:text-zinc-300 hover:text-zinc-600
              dark:border dark:border-zinc-800 border border-zinc-200 hover:dark:bg-zinc-800 hover:bg-zinc-50 active:scale-95"
          >
            <StickyNote className="w-3 h-3" />
            {lead.notes?.length ? `${lead.notes.length} note${lead.notes.length > 1 ? "s" : ""}` : "Note"}
          </button>
        </div>

        {/* Outreach panel */}
        <AnimatePresence>
          {showOutreach && (
            <CompetitorOutreachPanel lead={lead} onClose={() => setShowOutreach(false)} />
          )}
        </AnimatePresence>

        {/* Notes */}
        <AnimatePresence>
          {showNote && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="mt-3 space-y-2"
            >
              {lead.notes?.map((n, i) => (
                <div key={i} className="text-xs dark:text-zinc-400 text-zinc-500 dark:bg-zinc-800/60 bg-zinc-50 border dark:border-zinc-700 border-zinc-200 rounded-lg px-3 py-2">
                  {n.text}
                </div>
              ))}
              <div className="flex gap-2">
                <textarea
                  ref={noteRef}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note about this lead…"
                  rows={2}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleNoteSubmit(); }}
                  className="flex-1 text-xs rounded-lg px-3 py-2 dark:bg-zinc-800 bg-white
                    dark:border dark:border-zinc-700 border border-zinc-200
                    dark:text-zinc-200 text-zinc-700 placeholder:dark:text-zinc-600 placeholder:text-zinc-400
                    focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                />
                <button
                  onClick={handleNoteSubmit}
                  disabled={!noteText.trim()}
                  className="self-end px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-500 text-white
                    hover:bg-emerald-600 disabled:opacity-40 transition-colors active:scale-95"
                >
                  Save
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Velocity + trend header ──────────────────────────────────────────────────

function InterceptHeader({ velocity, competitorTrend, total, hotCount }: {
  velocity: number;
  competitorTrend: Record<string, number>;
  total: number;
  hotCount: number;
}) {
  const sortedTrend = Object.entries(competitorTrend)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxCount = sortedTrend[0]?.[1] ?? 1;

  return (
    <div className="mb-5 rounded-xl border dark:border-zinc-800 border-zinc-200 dark:bg-zinc-900/50 bg-white overflow-hidden">
      {/* Stats row */}
      <div className="grid grid-cols-3 divide-x dark:divide-zinc-800 divide-zinc-100">
        <div className="px-4 py-3 text-center">
          <div className="text-2xl font-black dark:text-zinc-100 text-zinc-900">{total}</div>
          <div className="text-[10px] font-semibold uppercase tracking-wider dark:text-zinc-500 text-zinc-400 mt-0.5">Total Intercepts</div>
        </div>
        <div className="px-4 py-3 text-center">
          <div className="text-2xl font-black text-red-400">{hotCount}</div>
          <div className="text-[10px] font-semibold uppercase tracking-wider dark:text-zinc-500 text-zinc-400 mt-0.5">Hot Leads</div>
        </div>
        <div className="px-4 py-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <div className="text-2xl font-black text-emerald-400">{velocity}</div>
            <Zap className="w-4 h-4 text-emerald-400 mb-0.5" />
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider dark:text-zinc-500 text-zinc-400 mt-0.5">Mentions / Hour</div>
        </div>
      </div>

      {/* Competitor trend */}
      {sortedTrend.length > 0 && (
        <div className="px-4 py-3 border-t dark:border-zinc-800 border-zinc-100">
          <div className="text-[10px] font-bold uppercase tracking-wider dark:text-zinc-500 text-zinc-400 mb-2.5">
            Competitor Mention Frequency
          </div>
          <div className="space-y-2">
            {sortedTrend.map(([name, count]) => {
              const c = COMPETITOR_COLORS[name as Competitor];
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={name} className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold w-20 shrink-0 ${c?.text ?? "text-zinc-400"}`}>{name}</span>
                  <div className="flex-1 h-1.5 rounded-full dark:bg-zinc-800 bg-zinc-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={`h-full rounded-full ${c?.dot ?? "bg-zinc-400"}`}
                    />
                  </div>
                  <span className="text-[10px] dark:text-zinc-500 text-zinc-400 w-6 text-right font-mono">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "rgba(0,255,179,0.06)", border: "1px solid rgba(0,255,179,0.12)" }}
      >
        <TrendingUp className="w-6 h-6" style={{ color: "#00ffb3" }} />
      </div>
      <div className="text-sm font-semibold dark:text-zinc-300 text-zinc-700 mb-1">
        {hasFilters ? "No matches for your filters" : "No competitor mentions yet"}
      </div>
      <div className="text-xs dark:text-zinc-600 text-zinc-400 max-w-xs leading-relaxed">
        {hasFilters
          ? "Try clearing the competitor or sentiment filter to see more results."
          : "The engine monitors Reddit and HN every 4 minutes. Competitor intercepts appear here as they're detected."
        }
      </div>
    </div>
  );
}

// ─── Main CompetitorFeed ──────────────────────────────────────────────────────

export default function CompetitorFeed() {
  const {
    data, error, claimingId, filteredLeads,
    filterCompetitor, setFilterCompetitor,
    filterSentiment, setFilterSentiment,
    filterText, setFilterText,
    sortOrder, setSortOrder,
    claimLead, unclaimLead, updatePipeline, addNote,
    refetch,
  } = useCompetitorLeads();

  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const pagedLeads = useMemo(() => filteredLeads.slice(0, page * PAGE_SIZE), [filteredLeads, page]);
  const hasMore = filteredLeads.length > pagedLeads.length;
  const hasFilters = filterCompetitor !== "all" || filterSentiment !== "all" || filterText.trim() !== "";

  const COMPETITORS: Competitor[] = ["Bright Data", "Oxylabs", "ScraperAPI", "Crawlbase", "Webshare"];
  const SENTIMENTS: { value: FilterSentiment; label: string }[] = [
    { value: "all",                     label: "All Severity" },
    { value: "extreme_churn_risk",      label: "Extreme Churn Risk" },
    { value: "high_priority_migration", label: "High Priority Migration" },
    { value: "migration_potential",     label: "Migration Potential" },
  ];

  if (error) return (
    <div className="flex items-center gap-2 p-4 rounded-xl dark:bg-red-950/20 bg-red-50 border dark:border-red-900/30 border-red-200 text-red-400 text-sm">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span>{error}</span>
      <button onClick={refetch} className="ml-auto flex items-center gap-1 text-xs hover:text-red-300">
        <RefreshCw className="w-3 h-3" /> Retry
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header stats + trend */}
      <InterceptHeader
        velocity={data?.velocity ?? 0}
        competitorTrend={data?.competitorTrend ?? {}}
        total={data?.totalLeads ?? 0}
        hotCount={data?.hotCount ?? 0}
      />

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 dark:text-zinc-600 text-zinc-400" />
          <input
            type="text"
            placeholder="Search leads…"
            value={filterText}
            onChange={(e) => { setFilterText(e.target.value); setPage(1); }}
            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg dark:bg-zinc-900 bg-white
              dark:border dark:border-zinc-800 border border-zinc-200
              dark:text-zinc-200 text-zinc-800 placeholder:dark:text-zinc-600 placeholder:text-zinc-400
              focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          />
        </div>

        {/* Toggle filters */}
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border
            ${hasFilters
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "dark:bg-zinc-900 bg-white dark:text-zinc-400 text-zinc-500 dark:border-zinc-800 border-zinc-200 hover:dark:bg-zinc-800 hover:bg-zinc-50"
            }`}
        >
          Filters
          {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {/* Sort */}
        <button
          onClick={() => setSortOrder((v) => v === "newest" ? "score" : "newest")}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all
            dark:bg-zinc-900 bg-white dark:text-zinc-400 text-zinc-500 dark:border dark:border-zinc-800 border border-zinc-200
            hover:dark:bg-zinc-800 hover:bg-zinc-50"
        >
          {sortOrder === "newest" ? "Newest first" : "Highest score"}
        </button>

        {/* Refresh */}
        <button
          onClick={refetch}
          className="p-2 rounded-lg dark:bg-zinc-900 bg-white dark:border dark:border-zinc-800 border border-zinc-200 dark:text-zinc-500 text-zinc-400 hover:dark:text-zinc-300 hover:text-zinc-600 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Expanded filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 flex-wrap overflow-hidden"
          >
            {/* Competitor filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider dark:text-zinc-600 text-zinc-400">Competitor:</span>
              <button
                onClick={() => { setFilterCompetitor("all"); setPage(1); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border
                  ${filterCompetitor === "all" ? "bg-zinc-700/60 text-zinc-200 border-zinc-600" : "dark:bg-zinc-900 bg-white dark:text-zinc-400 text-zinc-500 dark:border-zinc-800 border-zinc-200 hover:dark:bg-zinc-800"}`}
              >
                All
              </button>
              {COMPETITORS.map((c) => {
                const col = COMPETITOR_COLORS[c];
                return (
                  <button
                    key={c}
                    onClick={() => { setFilterCompetitor(c); setPage(1); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border
                      ${filterCompetitor === c ? `${col.bg} ${col.text} ${col.border}` : "dark:bg-zinc-900 bg-white dark:text-zinc-400 text-zinc-500 dark:border-zinc-800 border-zinc-200 hover:dark:bg-zinc-800"}`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>

            {/* Sentiment filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider dark:text-zinc-600 text-zinc-400">Severity:</span>
              {SENTIMENTS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => { setFilterSentiment(s.value); setPage(1); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border
                    ${filterSentiment === s.value
                      ? "bg-zinc-700/60 text-zinc-200 border-zinc-600"
                      : "dark:bg-zinc-900 bg-white dark:text-zinc-400 text-zinc-500 dark:border-zinc-800 border-zinc-200 hover:dark:bg-zinc-800"
                    }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lead count */}
      {filteredLeads.length > 0 && (
        <div className="text-[11px] dark:text-zinc-600 text-zinc-400">
          {filteredLeads.length} competitor intercept{filteredLeads.length !== 1 ? "s" : ""}
          {hasFilters ? " matching filters" : ""} · {data?.hotCount ?? 0} hot
        </div>
      )}

      {/* Lead list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {pagedLeads.length === 0 ? (
            <EmptyState hasFilters={hasFilters} />
          ) : (
            pagedLeads.map((lead, i) => (
              <CompetitorLeadCard
                key={lead.id}
                lead={lead}
                index={i}
                isClaiming={claimingId === lead.id}
                onClaim={() => claimLead(lead)}
                onUnclaim={() => unclaimLead(lead)}
                onPipelineChange={(s) => updatePipeline(lead.id, s)}
                onNoteAdd={(text) => addNote(lead.id, text)}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Load more */}
      {hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          className="w-full py-3 rounded-xl text-xs font-semibold dark:bg-zinc-900 bg-zinc-50 dark:border dark:border-zinc-800 border border-zinc-200 dark:text-zinc-400 text-zinc-500 hover:dark:bg-zinc-800 hover:bg-zinc-100 transition-colors"
        >
          Load {Math.min(PAGE_SIZE, filteredLeads.length - pagedLeads.length)} more
        </button>
      )}
    </div>
  );
}
