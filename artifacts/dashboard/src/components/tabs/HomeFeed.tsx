import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExternalLink, UserCheck, Check, Flame, Thermometer, Minus,
  Search, SlidersHorizontal, LayoutGrid, List,
  MessageSquare, StickyNote, ChevronRight, ChevronLeft,
  AlertCircle, RefreshCw, X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useLeads, type Lead, type PipelineStatus } from "@/hooks/useLeads";
import OutreachDrawer from "@/components/OutreachDrawer";

// ─── Types ────────────────────────────────────────────────────────────────────

const PIPELINE_STAGES: { status: PipelineStatus; label: string }[] = [
  { status: "unclaimed",  label: "Unclaimed" },
  { status: "contacted",  label: "Contacted" },
  { status: "qualified",  label: "Qualified" },
  { status: "converted",  label: "Converted" },
];

const PIPELINE_STYLES: Record<PipelineStatus, { pill: string; dot: string }> = {
  unclaimed: { pill: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",  dot: "bg-zinc-500" },
  contacted: { pill: "bg-blue-500/10 text-blue-400 border-blue-500/20",  dot: "bg-blue-500" },
  qualified: { pill: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-500" },
  converted: { pill: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500" },
};

const PIPELINE_COLUMN_STYLES: Record<PipelineStatus, string> = {
  unclaimed: "dark:bg-zinc-900/40 bg-zinc-50 border-zinc-200 dark:border-zinc-800",
  contacted: "dark:bg-blue-950/20 bg-blue-50/60 border-blue-200/50 dark:border-blue-900/30",
  qualified: "dark:bg-amber-950/20 bg-amber-50/60 border-amber-200/50 dark:border-amber-900/30",
  converted: "dark:bg-emerald-950/20 bg-emerald-50/60 border-emerald-200/50 dark:border-emerald-900/30",
};

// ─── Micro-components ────────────────────────────────────────────────────────

function SourceBadge({ source }: { source: Lead["source"] }) {
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

function TierBadge({ tier, score }: { tier: Lead["tier"]; score: number }) {
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

// ─── Lead Card ────────────────────────────────────────────────────────────────

function LeadCard({
  lead, index, isFocused, isClaiming, onClaim, onOpenDrawer, onPipelineChange, onNoteAdd,
}: {
  lead: Lead;
  index: number;
  isFocused: boolean;
  isClaiming: boolean;
  onClaim: () => void;
  onOpenDrawer: () => void;
  onPipelineChange: (status: PipelineStatus) => void;
  onNoteAdd: (text: string) => void;
}) {
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

  return (
    <motion.div
      layout
      data-lead-index={index}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.4), duration: 0.2, ease: "easeOut" }}
      className={`relative rounded-xl border transition-all duration-200 overflow-hidden group
        ${isFocused ? "ring-2 ring-blue-500/50 ring-offset-0 dark:ring-offset-0" : ""}
        ${lead.claimed ? "opacity-60" : ""}
        ${lead.tier === "hot"
          ? "dark:bg-red-950/10 bg-red-50/60 border-red-900/25 dark:border-red-900/20"
          : "dark:bg-zinc-900/40 bg-white border-zinc-200 dark:border-zinc-800/70"
        }`}
    >
      {/* Pipeline left-border accent */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5
        ${lead.pipelineStatus === "contacted" ? "bg-blue-500"
          : lead.pipelineStatus === "qualified" ? "bg-amber-500"
          : lead.pipelineStatus === "converted" ? "bg-emerald-500"
          : "bg-transparent"
        }`}
      />

      <div className="p-4 pl-5">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2.5 flex-wrap">
          <SourceBadge source={lead.source} />
          <TierBadge tier={lead.tier} score={lead.score} />
          <PipelinePill status={lead.pipelineStatus ?? "unclaimed"} onChange={onPipelineChange} />
          <span className="text-[10px] dark:text-zinc-600 text-zinc-400 ml-auto whitespace-nowrap">
            {timeAgo}
          </span>
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
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={lead.url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
              dark:bg-blue-500/15 bg-blue-50 dark:text-blue-400 text-blue-600
              dark:border dark:border-blue-500/25 border border-blue-200
              hover:dark:bg-blue-500/25 hover:bg-blue-100 active:scale-95"
          >
            Target Client <ExternalLink className="w-3 h-3" />
          </a>

          {lead.claimed ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20">
              <Check className="w-3 h-3" /> Claimed
            </span>
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
            onClick={onOpenDrawer}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
              dark:bg-violet-500/10 bg-violet-50 dark:text-violet-400 text-violet-600
              dark:border dark:border-violet-500/20 border border-violet-200
              hover:dark:bg-violet-500/20 hover:bg-violet-100 active:scale-95"
          >
            <MessageSquare className="w-3 h-3" /> Reach Out
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

        {/* Notes section */}
        <AnimatePresence>
          {showNote && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t dark:border-zinc-800 border-zinc-100 space-y-2">
                {lead.notes?.map((note, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs dark:text-zinc-400 text-zinc-500">
                    <span className="dark:text-zinc-600 text-zinc-400 font-mono text-[10px] mt-0.5 shrink-0">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                    <span className="leading-relaxed">{note.text}</span>
                  </div>
                ))}
                <div className="flex gap-2">
                  <textarea
                    ref={noteRef}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleNoteSubmit(); } if (e.key === "Escape") setShowNote(false); }}
                    placeholder="Add a note… (Enter to save, Esc to close)"
                    rows={2}
                    className="flex-1 text-xs px-3 py-2 rounded-lg resize-none
                      dark:bg-zinc-800 bg-zinc-50 dark:text-zinc-200 text-zinc-700
                      dark:border dark:border-zinc-700 border border-zinc-200
                      focus:outline-none focus:ring-2 focus:ring-blue-500/40
                      placeholder:dark:text-zinc-600 placeholder:text-zinc-400"
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={handleNoteSubmit}
                      disabled={!noteText.trim()}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 transition-colors"
                    >
                      Save
                    </button>
                    <button onClick={() => setShowNote(false)} className="px-2.5 py-1.5 rounded-lg text-xs dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-400 text-zinc-500 hover:dark:bg-zinc-700 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Pipeline Board ────────────────────────────────────────────────────────────

function PipelineMiniCard({ lead, onMove, onOpenDrawer }: {
  lead: Lead;
  onMove: (s: PipelineStatus) => void;
  onOpenDrawer: () => void;
}) {
  const stageIdx = PIPELINE_STAGES.findIndex((s) => s.status === (lead.pipelineStatus ?? "unclaimed"));
  const canPrev = stageIdx > 0;
  const canNext = stageIdx < PIPELINE_STAGES.length - 1;

  return (
    <div className="rounded-xl border dark:bg-zinc-900/60 bg-white dark:border-zinc-800 border-zinc-200 p-3 space-y-2 hover:dark:bg-zinc-900 hover:bg-zinc-50 transition-colors cursor-pointer group"
      onClick={onOpenDrawer}
    >
      <div className="flex items-center gap-1.5 flex-wrap">
        <SourceBadge source={lead.source} />
        <TierBadge tier={lead.tier} score={lead.score} />
      </div>
      <p className="text-xs font-medium dark:text-zinc-200 text-zinc-800 line-clamp-2 leading-snug">{lead.title}</p>
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          disabled={!canPrev}
          onClick={() => onMove(PIPELINE_STAGES[stageIdx - 1].status)}
          className="p-1 rounded dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-400 text-zinc-500 disabled:opacity-30 hover:dark:bg-zinc-700 hover:bg-zinc-200 transition-colors"
        >
          <ChevronLeft className="w-3 h-3" />
        </button>
        <span className="flex-1 text-[9px] dark:text-zinc-500 text-zinc-400 text-center font-mono">
          {stageIdx + 1}/{PIPELINE_STAGES.length}
        </span>
        <button
          disabled={!canNext}
          onClick={() => onMove(PIPELINE_STAGES[stageIdx + 1].status)}
          className="p-1 rounded dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-400 text-zinc-500 disabled:opacity-30 hover:dark:bg-zinc-700 hover:bg-zinc-200 transition-colors"
        >
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function PipelineBoard({ leads, onPipelineChange, onOpenDrawer }: {
  leads: Lead[];
  onPipelineChange: (id: string, status: PipelineStatus) => void;
  onOpenDrawer: (lead: Lead) => void;
}) {
  const groups = useMemo(() => {
    const map: Record<PipelineStatus, Lead[]> = { unclaimed: [], contacted: [], qualified: [], converted: [] };
    for (const l of leads) map[l.pipelineStatus ?? "unclaimed"].push(l);
    return map;
  }, [leads]);

  return (
    <div className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1">
      {PIPELINE_STAGES.map((stage) => (
        <div key={stage.status} className="shrink-0 w-60 sm:w-64">
          <div className={`flex items-center justify-between mb-2.5 px-3 py-2 rounded-lg border ${PIPELINE_COLUMN_STYLES[stage.status]}`}>
            <span className="text-[11px] font-bold uppercase tracking-wider dark:text-zinc-300 text-zinc-700">
              {stage.label}
            </span>
            <span className="text-[11px] font-bold tabular-nums dark:text-zinc-500 text-zinc-400 px-1.5 py-0.5 rounded-full dark:bg-zinc-800 bg-zinc-200">
              {groups[stage.status].length}
            </span>
          </div>
          <div className="space-y-2 min-h-[80px]">
            <AnimatePresence>
              {groups[stage.status].map((lead) => (
                <motion.div key={lead.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <PipelineMiniCard
                    lead={lead}
                    onMove={(s) => onPipelineChange(lead.id, s)}
                    onOpenDrawer={() => onOpenDrawer(lead)}
                  />
                </motion.div>
              ))}
              {groups[stage.status].length === 0 && (
                <div className="flex items-center justify-center h-16 rounded-xl dark:bg-zinc-900/30 bg-zinc-50 border dark:border-zinc-800/50 border-zinc-200 border-dashed">
                  <span className="text-[10px] dark:text-zinc-700 text-zinc-400">Empty</span>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

function FilterBar({
  filterSource, setFilterSource,
  filterTier, setFilterTier,
  filterText, setFilterText,
  sortOrder, setSortOrder,
  resultCount,
  searchRef,
}: {
  filterSource: string; setFilterSource: (s: any) => void;
  filterTier: string; setFilterTier: (s: any) => void;
  filterText: string; setFilterText: (s: string) => void;
  sortOrder: string; setSortOrder: (s: any) => void;
  resultCount: number;
  searchRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="space-y-2">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 dark:text-zinc-500 text-zinc-400" />
        <input
          ref={searchRef as React.RefObject<HTMLInputElement>}
          type="text"
          placeholder='Search leads… (press / to focus)'
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="w-full pl-9 pr-9 py-2 text-sm rounded-xl dark:bg-zinc-900 bg-white
            dark:border dark:border-zinc-800 border border-zinc-200
            dark:text-zinc-200 text-zinc-800 placeholder:dark:text-zinc-600 placeholder:text-zinc-400
            focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
        {filterText && (
          <button onClick={() => setFilterText("")} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-3.5 h-3.5 dark:text-zinc-500 text-zinc-400" />
          </button>
        )}
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Source */}
        <div className="flex items-center gap-1 dark:bg-zinc-900 bg-zinc-100 rounded-lg p-1 border dark:border-zinc-800 border-zinc-200">
          {(["all", "reddit", "HN"] as const).map((src) => (
            <button
              key={src}
              onClick={() => setFilterSource(src)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all
                ${filterSource === src
                  ? "dark:bg-zinc-700 bg-white shadow-sm dark:text-zinc-100 text-zinc-900"
                  : "dark:text-zinc-500 text-zinc-500 hover:dark:text-zinc-300 hover:text-zinc-700"
                }`}
            >
              {src === "all" ? "All" : src === "reddit" ? "Reddit" : "HN"}
            </button>
          ))}
        </div>

        {/* Tier */}
        <div className="flex items-center gap-1 dark:bg-zinc-900 bg-zinc-100 rounded-lg p-1 border dark:border-zinc-800 border-zinc-200">
          {(["all", "hot", "warm", "cool"] as const).map((tier) => (
            <button
              key={tier}
              onClick={() => setFilterTier(tier)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all capitalize
                ${filterTier === tier
                  ? "dark:bg-zinc-700 bg-white shadow-sm dark:text-zinc-100 text-zinc-900"
                  : "dark:text-zinc-500 text-zinc-500 hover:dark:text-zinc-300 hover:text-zinc-700"
                }
                ${tier === "hot" && filterTier === "hot" ? "!text-red-400" : ""}
                ${tier === "warm" && filterTier === "warm" ? "!text-amber-400" : ""}
              `}
            >
              {tier === "hot" ? "🔥 Hot" : tier === "all" ? "All" : tier.charAt(0).toUpperCase() + tier.slice(1)}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1 ml-auto">
          <SlidersHorizontal className="w-3 h-3 dark:text-zinc-600 text-zinc-400" />
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="text-xs dark:bg-zinc-900 bg-zinc-100 dark:text-zinc-400 text-zinc-600
              dark:border dark:border-zinc-800 border border-zinc-200 rounded-lg px-2 py-1.5
              focus:outline-none cursor-pointer"
          >
            <option value="newest">Newest first</option>
            <option value="score">By score</option>
          </select>
        </div>

        {/* Count */}
        {(filterSource !== "all" || filterTier !== "all" || filterText) && (
          <span className="text-[10px] dark:text-zinc-500 text-zinc-400">
            {resultCount} result{resultCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main HomeFeed ────────────────────────────────────────────────────────────

export default function HomeFeed() {
  const {
    data, filteredLeads, leads, error,
    filterSource, setFilterSource,
    filterTier, setFilterTier,
    filterText, setFilterText,
    sortOrder, setSortOrder,
    claimingId, claimLead, updatePipeline, addNote, refetch,
  } = useLeads();

  const [viewMode, setViewMode] = useState<"feed" | "pipeline">("feed");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [drawerLead, setDrawerLead] = useState<Lead | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  // Stats strip
  const hotCount = leads.filter((l) => l.tier === "hot").length;
  const claimedCount = leads.filter((l) => l.claimed).length;
  const claimRate = leads.length ? Math.round((claimedCount / leads.length) * 100) : 0;

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (drawerLead) { if (e.key === "Escape") setDrawerLead(null); return; }
    const target = e.target as HTMLElement;
    const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

    if (e.key === "/" && !isInput) {
      e.preventDefault();
      searchRef.current?.focus();
      return;
    }
    if (e.key === "Escape" && isInput) { target.blur(); return; }
    if (isInput) return;

    if (e.key === "j" || e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((i) => Math.min(i + 1, filteredLeads.length - 1));
    }
    if (e.key === "k" || e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((i) => Math.max(i - 1, 0));
    }
    if (e.key === "c" && focusedIndex >= 0) {
      const lead = filteredLeads[focusedIndex];
      if (lead && !lead.claimed) claimLead(lead).then(() => toast.success("Lead claimed!"));
    }
    if (e.key === "o" && focusedIndex >= 0) {
      const lead = filteredLeads[focusedIndex];
      if (lead) window.open(lead.url, "_blank");
    }
    if (e.key === "t" && focusedIndex >= 0) {
      const lead = filteredLeads[focusedIndex];
      if (lead) setDrawerLead(lead);
    }
  }, [drawerLead, filteredLeads, focusedIndex, claimLead]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleClaim = useCallback(async (lead: Lead) => {
    await claimLead(lead);
    toast.success(`Lead claimed: ${lead.title.slice(0, 40)}…`, { duration: 3000 });
  }, [claimLead]);

  const handlePipelineChange = useCallback(async (id: string, status: PipelineStatus) => {
    await updatePipeline(id, status);
    const label = PIPELINE_STAGES.find((s) => s.status === status)?.label ?? status;
    toast.success(`Pipeline → ${label}`);
  }, [updatePipeline]);

  const handleAddNote = useCallback(async (id: string, text: string) => {
    await addNote(id, text);
    toast.success("Note saved");
  }, [addNote]);

  return (
    <div className="space-y-4">
      {/* Stats strip */}
      {data && (
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full dark:bg-zinc-900 bg-zinc-100 border dark:border-zinc-800 border-zinc-200">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-medium dark:text-zinc-400 text-zinc-600">
              {data.totalLeads} total · <span className="text-red-400">{hotCount} 🔥</span> · {claimRate}% claimed
            </span>
          </div>
          <button onClick={refetch}
            className="inline-flex items-center gap-1 text-[11px] dark:text-zinc-500 text-zinc-400 hover:dark:text-zinc-300 hover:text-zinc-600 transition-colors">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
          {/* Keyboard hint */}
          <span className="hidden sm:flex items-center gap-2 text-[10px] dark:text-zinc-700 text-zinc-400 ml-auto">
            <kbd className="px-1.5 py-0.5 rounded dark:bg-zinc-800 bg-zinc-200 font-mono">j/k</kbd> nav
            <kbd className="px-1.5 py-0.5 rounded dark:bg-zinc-800 bg-zinc-200 font-mono">c</kbd> claim
            <kbd className="px-1.5 py-0.5 rounded dark:bg-zinc-800 bg-zinc-200 font-mono">t</kbd> reach out
            <kbd className="px-1.5 py-0.5 rounded dark:bg-zinc-800 bg-zinc-200 font-mono">/</kbd> search
          </span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl dark:bg-red-950/30 bg-red-50 border dark:border-red-900/40 border-red-200 text-red-500 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Filter bar */}
      <FilterBar
        filterSource={filterSource} setFilterSource={setFilterSource}
        filterTier={filterTier} setFilterTier={setFilterTier}
        filterText={filterText} setFilterText={setFilterText}
        sortOrder={sortOrder} setSortOrder={setSortOrder}
        resultCount={filteredLeads.length}
        searchRef={searchRef}
      />

      {/* View toggle */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 dark:bg-zinc-900 bg-zinc-100 rounded-lg p-1 border dark:border-zinc-800 border-zinc-200">
          <button onClick={() => setViewMode("feed")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all
              ${viewMode === "feed" ? "dark:bg-zinc-700 bg-white shadow-sm dark:text-zinc-100 text-zinc-900" : "dark:text-zinc-500 text-zinc-500"}`}
          >
            <List className="w-3.5 h-3.5" /> Feed
          </button>
          <button onClick={() => setViewMode("pipeline")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all
              ${viewMode === "pipeline" ? "dark:bg-zinc-700 bg-white shadow-sm dark:text-zinc-100 text-zinc-900" : "dark:text-zinc-500 text-zinc-500"}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Pipeline
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait" initial={false}>
        {viewMode === "feed" ? (
          <motion.div key="feed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }} className="space-y-3"
          >
            {!data ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[130px] rounded-xl dark:bg-zinc-900/40 bg-zinc-100 border dark:border-zinc-800 border-zinc-200 animate-pulse" />
              ))
            ) : filteredLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 rounded-xl dark:bg-zinc-900/30 bg-zinc-50 border dark:border-zinc-800 border-zinc-200 border-dashed">
                <div className="text-2xl mb-2">🎯</div>
                <p className="text-sm dark:text-zinc-500 text-zinc-400">No leads match your filters</p>
                <button onClick={() => { setFilterSource("all"); setFilterTier("all"); setFilterText(""); }}
                  className="mt-2 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  Clear filters
                </button>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredLeads.map((lead, i) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    index={i}
                    isFocused={focusedIndex === i}
                    isClaiming={claimingId === lead.id}
                    onClaim={() => handleClaim(lead)}
                    onOpenDrawer={() => setDrawerLead(lead)}
                    onPipelineChange={(s) => handlePipelineChange(lead.id, s)}
                    onNoteAdd={(text) => handleAddNote(lead.id, text)}
                  />
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        ) : (
          <motion.div key="pipeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <PipelineBoard
              leads={filteredLeads}
              onPipelineChange={handlePipelineChange}
              onOpenDrawer={setDrawerLead}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outreach Drawer */}
      <OutreachDrawer lead={drawerLead} onClose={() => setDrawerLead(null)} />
    </div>
  );
}
