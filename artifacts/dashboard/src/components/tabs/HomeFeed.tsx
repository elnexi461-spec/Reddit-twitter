import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, UserCheck, Check, Flame, Thermometer, Minus, AlertCircle, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useLeads, type Lead } from "@/hooks/useLeads";

function SourceBadge({ source }: { source: Lead["source"] }) {
  if (source === "reddit") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/20">
        <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
          <circle cx="10" cy="10" r="10" />
          <path fill="white" d="M16.67 10a1.46 1.46 0 0 0-2.47-1 7.12 7.12 0 0 0-3.85-1.23l.65-3.07 2.13.45a1 1 0 1 0 1-1 1 1 0 0 0-.96.68l-2.38-.5a.27.27 0 0 0-.32.2l-.73 3.44a7.14 7.14 0 0 0-3.89 1.23 1.46 1.46 0 1 0-1.61 2.39 2.87 2.87 0 0 0 0 .44c0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06a2.87 2.87 0 0 0 0-.44 1.46 1.46 0 0 0 .68-1.59zM7.27 11a1 1 0 1 1 1 1 1 1 0 0 1-1-1zm5.58 2.71a3.58 3.58 0 0 1-2.85.87 3.58 3.58 0 0 1-2.85-.87.27.27 0 0 1 .38-.38 3.1 3.1 0 0 0 2.47.69 3.1 3.1 0 0 0 2.47-.69.27.27 0 0 1 .38.38zm-.13-1.71a1 1 0 1 1 1-1 1 1 0 0 1-1 1z" />
        </svg>
        Reddit
      </span>
    );
  }
  if (source === "HN") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/20">
        <span className="font-black text-[9px]">Y</span>
        HN
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-sky-500/15 text-sky-400 border border-sky-500/20">
      𝕏
    </span>
  );
}

function TierBadge({ tier, score }: { tier: Lead["tier"]; score: number }) {
  if (tier === "hot") return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/20">
      <Flame className="w-2 h-2" /> Hot {score}
    </span>
  );
  if (tier === "warm") return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/20">
      <Thermometer className="w-2 h-2" /> Warm {score}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-zinc-500/15 text-zinc-500 border border-zinc-500/20 dark:text-zinc-400">
      <Minus className="w-2 h-2" /> Cool {score}
    </span>
  );
}

function LeadCard({ lead, index, isClaimed, isClaiming, onClaim }: {
  lead: Lead;
  index: number;
  isClaimed: boolean;
  isClaiming: boolean;
  onClaim: () => void;
}) {
  const timeAgo = (() => {
    try { return formatDistanceToNow(new Date(lead.timestamp), { addSuffix: true }); }
    catch { return ""; }
  })();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.5), duration: 0.22, ease: "easeOut" }}
      className={`group relative rounded-xl border transition-colors duration-200 overflow-hidden
        ${isClaimed
          ? "opacity-55 dark:bg-zinc-900/30 bg-zinc-50/80 border-zinc-200 dark:border-zinc-800"
          : lead.tier === "hot"
          ? "dark:bg-red-950/10 bg-red-50/60 border-red-900/30 dark:border-red-900/25 hover:dark:bg-red-950/20 hover:bg-red-50"
          : "dark:bg-zinc-900/40 bg-white border-zinc-200 dark:border-zinc-800/70 hover:dark:bg-zinc-900/70 hover:bg-zinc-50"
        }
      `}
    >
      <div className="p-4">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <SourceBadge source={lead.source} />
          <TierBadge tier={lead.tier} score={lead.score} />
          <span className="text-[10px] text-zinc-500 dark:text-zinc-600 ml-auto whitespace-nowrap">
            {timeAgo}
          </span>
        </div>

        {/* Pain point snippet */}
        <p className="text-sm font-medium leading-snug dark:text-zinc-100 text-zinc-900 line-clamp-2 mb-2">
          {lead.title}
        </p>

        {/* Keyword tag */}
        <div className="mb-3">
          <code className="text-[10px] px-1.5 py-0.5 rounded dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-400 text-zinc-500 font-mono">
            {lead.keyword}
          </code>
        </div>

        {/* Action row */}
        <div className="flex items-center gap-2">
          <a
            href={lead.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
              dark:bg-blue-500/15 bg-blue-50 dark:text-blue-400 text-blue-600
              dark:border dark:border-blue-500/25 border border-blue-200
              hover:dark:bg-blue-500/25 hover:bg-blue-100
              active:scale-95"
          >
            Target Client
            <ExternalLink className="w-3 h-3" />
          </a>

          {isClaimed ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-500 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
              <Check className="w-3 h-3" /> Claimed
            </span>
          ) : (
            <button
              onClick={onClaim}
              disabled={isClaiming}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-300 text-zinc-600
                dark:border dark:border-zinc-700 border border-zinc-200
                hover:dark:bg-zinc-700 hover:bg-zinc-200
                disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
            >
              <UserCheck className="w-3 h-3" />
              {isClaiming ? "…" : "Claim"}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function HomeFeed() {
  const { data, claimedMap, claimingId, error, claimLead, refetch } = useLeads();

  const hotCount = data?.leads.filter(l => l.tier === "hot").length ?? 0;
  const claimedCount = Object.keys(claimedMap).length;

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      {data && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full dark:bg-zinc-900 bg-zinc-100 border dark:border-zinc-800 border-zinc-200">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-medium dark:text-zinc-400 text-zinc-600">
              {data.totalLeads} leads · {hotCount} hot · {claimedCount} claimed
            </span>
          </div>
          <button
            onClick={refetch}
            className="inline-flex items-center gap-1.5 text-[11px] dark:text-zinc-500 text-zinc-400 hover:dark:text-zinc-300 hover:text-zinc-600 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl dark:bg-red-950/30 bg-red-50 border dark:border-red-900/40 border-red-200 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Lead cards */}
      <AnimatePresence mode="popLayout">
        {!data ? (
          Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={`sk-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-[118px] rounded-xl dark:bg-zinc-900/40 bg-zinc-100 border dark:border-zinc-800 border-zinc-200 animate-pulse"
            />
          ))
        ) : data.leads.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-48 rounded-xl dark:bg-zinc-900/30 bg-zinc-50 border dark:border-zinc-800 border-zinc-200"
          >
            <div className="text-2xl mb-2">🎯</div>
            <p className="text-sm dark:text-zinc-500 text-zinc-400">Scanning for 2026 high-intent signals…</p>
          </motion.div>
        ) : (
          data.leads.map((lead, i) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              index={i}
              isClaimed={!!(claimedMap[lead.id] || lead.claimed)}
              isClaiming={claimingId === lead.id}
              onClaim={() => claimLead(lead)}
            />
          ))
        )}
      </AnimatePresence>
    </div>
  );
}
