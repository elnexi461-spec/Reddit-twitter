import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Download,
  Tags,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Flame,
  Thermometer,
  Minus,
  UserCheck,
  Check,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Lead {
  id: string;
  source: "reddit" | "twitter" | "X" | "HN";
  keyword: string;
  title: string;
  url: string;
  timestamp: string;
  score: number;
  tier: "hot" | "warm" | "cool";
  claimed: boolean;
  claimedAt?: string;
}

interface ActivityResponse {
  uptime: number;
  totalLeads: number;
  workers: {
    reddit: "active" | "degraded";
    twitter: "active" | "degraded";
  };
  leads: Lead[];
}

type KeywordSource = "reddit" | "twitter" | "both";

interface Keyword {
  id: string;
  term: string;
  source: KeywordSource;
  enabled: boolean;
  createdAt: string;
}

type ActiveTab = "feed" | "keywords";

const SOURCE_LABELS: Record<KeywordSource, string> = {
  reddit: "Reddit",
  twitter: "X / Twitter",
  both: "Both",
};

const SOURCE_COLORS: Record<KeywordSource, string> = {
  reddit: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  twitter: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  both: "bg-violet-500/10 text-violet-400 border-violet-500/20",
};

function ScoreBadge({ tier, score }: { tier: Lead["tier"]; score?: number }) {
  if (tier === "hot") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-red-500/15 text-red-400 border border-red-500/25">
        <Flame className="w-2.5 h-2.5" />
        Hot{score !== undefined && <span className="font-mono opacity-70 ml-0.5">{score}</span>}
      </span>
    );
  }
  if (tier === "warm") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/25">
        <Thermometer className="w-2.5 h-2.5" />
        Warm{score !== undefined && <span className="font-mono opacity-70 ml-0.5">{score}</span>}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-zinc-500/15 text-zinc-400 border border-zinc-500/25">
      <Minus className="w-2.5 h-2.5" />
      Cool{score !== undefined && <span className="font-mono opacity-70 ml-0.5">{score}</span>}
    </span>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("feed");

  // Optimistic claim state — maps lead id → claimedAt timestamp
  const [claimedMap, setClaimedMap] = useState<Record<string, string>>({});
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [kwLoading, setKwLoading] = useState(false);
  const [newTerm, setNewTerm] = useState("");
  const [newSource, setNewSource] = useState<KeywordSource>("both");
  const [kwError, setKwError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch("/api/activity");
      if (!response.ok) throw new Error("Failed to fetch activity data");
      const result: ActivityResponse = await response.json();
      setData(result);
      setLastUpdated(new Date());
      setError(null);
      // Sync server-side claimed state into local map
      setClaimedMap((prev) => {
        const next = { ...prev };
        for (const lead of result.leads) {
          if (lead.claimed && lead.claimedAt && !next[lead.id]) {
            next[lead.id] = lead.claimedAt;
          }
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.add("dark");
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === "keywords") fetchKeywords();
  }, [activeTab]);

  async function handleClaim(lead: Lead) {
    if (claimedMap[lead.id] || claimingId) return;
    setClaimingId(lead.id);
    try {
      const res = await fetch(`/api/leads/${lead.id}/claim`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to claim lead");
      const updated: Lead = await res.json();
      setClaimedMap((prev) => ({
        ...prev,
        [lead.id]: updated.claimedAt ?? new Date().toISOString(),
      }));
    } catch {
      // silently ignore — row stays unclaimed, user can retry
    } finally {
      setClaimingId(null);
    }
  }

  async function fetchKeywords() {
    setKwLoading(true);
    setKwError(null);
    try {
      const res = await fetch("/api/keywords");
      if (!res.ok) throw new Error("Failed to load keywords");
      setKeywords(await res.json());
    } catch (err) {
      setKwError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setKwLoading(false);
    }
  }

  async function handleToggle(kw: Keyword) {
    try {
      const res = await fetch(`/api/keywords/${kw.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !kw.enabled }),
      });
      if (!res.ok) throw new Error("Failed to update keyword");
      const updated: Keyword = await res.json();
      setKeywords((prev) => prev.map((k) => (k.id === updated.id ? updated : k)));
    } catch (err) {
      setKwError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/keywords/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete keyword");
      setKeywords((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      setKwError(err instanceof Error ? err.message : "Unknown error");
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTerm.trim()) return;
    setAdding(true);
    setKwError(null);
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term: newTerm.trim(), source: newSource }),
      });
      if (!res.ok) throw new Error("Failed to add keyword");
      const created: Keyword = await res.json();
      setKeywords((prev) => [...prev, created]);
      setNewTerm("");
    } catch (err) {
      setKwError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAdding(false);
    }
  }

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const hotCount = data?.leads.filter((l) => l.tier === "hot").length ?? 0;
  const claimedCount = Object.keys(claimedMap).length;

  return (
    <div className="min-h-screen w-full bg-zinc-950 text-zinc-50 font-sans selection:bg-zinc-800">
      {/* Top Navigation */}
      <header className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-zinc-900 border border-zinc-800">
            <Activity className="w-4 h-4 text-zinc-400" />
          </div>
          <h1 className="text-sm font-semibold tracking-tight text-zinc-100" data-testid="text-sys-name">
            Proxies.sx Intel Engine
          </h1>
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-900 border border-zinc-800">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400" data-testid="status-live">Live</span>
          </div>
          {hotCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20">
              <Flame className="w-3 h-3 text-red-400" />
              <span className="text-[10px] font-semibold text-red-400">{hotCount} hot</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/activity/export/csv"
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-300 bg-zinc-900 border border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 hover:border-zinc-600 transition-colors"
            data-testid="button-export-csv"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </a>
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span data-testid="text-last-updated">
              {lastUpdated ? format(lastUpdated, "HH:mm:ss") : "Connecting..."}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {error && (
          <div className="p-4 rounded-md bg-red-950/30 border border-red-900/50 text-red-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-zinc-950 border-zinc-800 shadow-sm" data-testid="card-total-leads">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Total Leads</CardTitle>
            </CardHeader>
            <CardContent>
              {data ? (
                <div className="text-3xl font-bold tracking-tight text-zinc-100" data-testid="value-total-leads">
                  {data.totalLeads.toLocaleString()}
                </div>
              ) : <Skeleton className="h-9 w-24 bg-zinc-800" />}
            </CardContent>
          </Card>

          <Card className="bg-zinc-950 border-zinc-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Hot Leads</CardTitle>
            </CardHeader>
            <CardContent>
              {data ? (
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-red-400" />
                  <span className="text-3xl font-bold tracking-tight text-red-400">{hotCount}</span>
                </div>
              ) : <Skeleton className="h-9 w-16 bg-zinc-800" />}
            </CardContent>
          </Card>

          <Card className="bg-zinc-950 border-zinc-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Claimed</CardTitle>
            </CardHeader>
            <CardContent>
              {data ? (
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                  <span className="text-3xl font-bold tracking-tight text-emerald-400">{claimedCount}</span>
                </div>
              ) : <Skeleton className="h-9 w-16 bg-zinc-800" />}
            </CardContent>
          </Card>

          <Card className="bg-zinc-950 border-zinc-800 shadow-sm" data-testid="card-reddit-worker">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Reddit Worker</CardTitle>
            </CardHeader>
            <CardContent>
              {data ? (
                <div className="flex items-center gap-2" data-testid={`status-reddit-${data.workers.reddit}`}>
                  {data.workers.reddit === "active"
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    : <AlertCircle className="w-5 h-5 text-amber-500" />}
                  <span className="text-lg font-medium capitalize text-zinc-200">{data.workers.reddit}</span>
                </div>
              ) : <Skeleton className="h-7 w-28 bg-zinc-800" />}
            </CardContent>
          </Card>

          <Card className="bg-zinc-950 border-zinc-800 shadow-sm" data-testid="card-twitter-worker">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-zinc-400 uppercase tracking-wider">HN / Algolia Worker</CardTitle>
            </CardHeader>
            <CardContent>
              {data ? (
                <div className="flex items-center gap-2" data-testid={`status-twitter-${data.workers.twitter}`}>
                  {data.workers.twitter === "active"
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    : <AlertCircle className="w-5 h-5 text-amber-500" />}
                  <span className="text-lg font-medium capitalize text-zinc-200">{data.workers.twitter}</span>
                </div>
              ) : <Skeleton className="h-7 w-28 bg-zinc-800" />}
            </CardContent>
          </Card>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center gap-1 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab("feed")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "feed" ? "border-zinc-100 text-zinc-100" : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Activity Feed
          </button>
          <button
            onClick={() => setActiveTab("keywords")}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "keywords" ? "border-zinc-100 text-zinc-100" : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Tags className="w-3.5 h-3.5" />
            Keywords
            {keywords.length > 0 && (
              <span className="text-[10px] font-mono bg-zinc-800 text-zinc-400 rounded px-1.5 py-0.5">
                {keywords.filter((k) => k.enabled).length}/{keywords.length}
              </span>
            )}
          </button>
        </div>

        {/* Activity Feed Tab */}
        {activeTab === "feed" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">
                Real-Time Activity Feed
                <span className="ml-2 text-xs font-normal text-zinc-500">— newest first · 2026 only</span>
              </h2>
              {data && (
                <span className="text-xs text-zinc-500 font-mono">Uptime: {formatUptime(data.uptime)}</span>
              )}
            </div>

            <div className="rounded-md border border-zinc-800 bg-zinc-950 overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-zinc-900/50">
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider w-[110px]">Score</TableHead>
                    <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider w-[165px]">Timestamp</TableHead>
                    <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider w-[90px]">Source</TableHead>
                    <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider w-[140px]">Keyword</TableHead>
                    <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider">Lead Title</TableHead>
                    <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider text-right w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!data ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`skeleton-${i}`} className="border-zinc-800 hover:bg-zinc-900/30">
                        <TableCell><Skeleton className="h-5 w-16 bg-zinc-800 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32 bg-zinc-800" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-14 bg-zinc-800 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20 bg-zinc-800" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-full bg-zinc-800" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-32 bg-zinc-800 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : data.leads.length === 0 ? (
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                        Listening for 2026 high-intent signals...
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.leads.map((lead) => {
                      const isClaimed = !!(claimedMap[lead.id] || lead.claimed);
                      const isClaiming = claimingId === lead.id;
                      return (
                        <TableRow
                          key={lead.id}
                          className={`border-zinc-800 transition-colors group ${
                            isClaimed
                              ? "opacity-60 hover:opacity-80"
                              : lead.tier === "hot"
                              ? "bg-red-950/5 hover:bg-zinc-900/50"
                              : "hover:bg-zinc-900/50"
                          }`}
                        >
                          <TableCell>
                            <ScoreBadge tier={lead.tier ?? "cool"} score={lead.score} />
                          </TableCell>
                          <TableCell className="text-zinc-400 font-mono text-xs whitespace-nowrap" data-testid={`timestamp-${lead.id}`}>
                            {format(new Date(lead.timestamp), "MMM dd, HH:mm:ss")}
                          </TableCell>
                          <TableCell data-testid={`source-${lead.id}`}>
                            {lead.source === "reddit" ? (
                              <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/20 font-medium text-[10px] uppercase tracking-wider">Reddit</Badge>
                            ) : lead.source === "HN" ? (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 font-medium text-[10px] uppercase tracking-wider">HN</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-sky-500/10 text-sky-400 border-sky-500/20 font-medium text-[10px] uppercase tracking-wider">X</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-zinc-300 font-mono text-xs" data-testid={`keyword-${lead.id}`}>
                            {lead.keyword}
                          </TableCell>
                          <TableCell className="text-sm max-w-[360px]" data-testid={`title-${lead.id}`} title={lead.title}>
                            <a
                              href={lead.url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 hover:underline truncate max-w-full transition-colors"
                              data-testid={`link-review-${lead.id}`}
                            >
                              <span className="truncate">{lead.title}</span>
                              <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                            </a>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end">
                              {isClaimed ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                                  <Check className="w-3 h-3" />
                                  Claimed
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleClaim(lead)}
                                  disabled={isClaiming}
                                  title="Claim this lead for outreach"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors text-zinc-200 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:border-zinc-500 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  {isClaiming ? "Claiming…" : "Claim"}
                                </button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Keywords Tab */}
        {activeTab === "keywords" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100 tracking-tight">Keyword Management</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Add, toggle, or remove the terms workers scan for. Changes apply on the next poll cycle.
              </p>
            </div>

            {kwError && (
              <div className="p-3 rounded-md bg-red-950/30 border border-red-900/50 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {kwError}
              </div>
            )}

            <form onSubmit={handleAdd} className="flex items-center gap-2 p-4 rounded-md border border-zinc-800 bg-zinc-900/40">
              <input
                type="text"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="New keyword or phrase…"
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500 transition-colors"
              />
              <select
                value={newSource}
                onChange={(e) => setNewSource(e.target.value as KeywordSource)}
                className="bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-500 focus:border-zinc-500 transition-colors"
              >
                <option value="both">Both platforms</option>
                <option value="reddit">Reddit only</option>
                <option value="twitter">HN only</option>
              </select>
              <button
                type="submit"
                disabled={adding || !newTerm.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-100 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                {adding ? "Adding…" : "Add"}
              </button>
            </form>

            <div className="rounded-md border border-zinc-800 bg-zinc-950 overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-zinc-900/50">
                  <TableRow className="border-zinc-800 hover:bg-transparent">
                    <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider">Term</TableHead>
                    <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider w-[140px]">Platform</TableHead>
                    <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider w-[100px]">Status</TableHead>
                    <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider w-[180px]">Added</TableHead>
                    <TableHead className="text-zinc-400 font-medium text-xs uppercase tracking-wider text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kwLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <TableRow key={`kw-skeleton-${i}`} className="border-zinc-800">
                        <TableCell><Skeleton className="h-4 w-32 bg-zinc-800" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20 bg-zinc-800 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16 bg-zinc-800 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-28 bg-zinc-800" /></TableCell>
                        <TableCell />
                      </TableRow>
                    ))
                  ) : keywords.length === 0 ? (
                    <TableRow className="border-zinc-800 hover:bg-transparent">
                      <TableCell colSpan={5} className="h-24 text-center text-zinc-500 text-sm">
                        No keywords configured. Add one above.
                      </TableCell>
                    </TableRow>
                  ) : (
                    keywords.map((kw) => (
                      <TableRow
                        key={kw.id}
                        className={`border-zinc-800 hover:bg-zinc-900/50 transition-colors group ${!kw.enabled ? "opacity-50" : ""}`}
                      >
                        <TableCell className="font-mono text-sm text-zinc-200">{kw.term}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`font-medium text-[10px] uppercase tracking-wider ${SOURCE_COLORS[kw.source]}`}>
                            {SOURCE_LABELS[kw.source]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {kw.enabled ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 inline-block" />Paused
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-zinc-500 font-mono text-xs">
                          {format(new Date(kw.createdAt), "MMM dd, yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleToggle(kw)}
                              title={kw.enabled ? "Pause keyword" : "Resume keyword"}
                              className="p-1.5 rounded text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                            >
                              {kw.enabled
                                ? <ToggleRight className="w-4 h-4 text-emerald-400" />
                                : <ToggleLeft className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDelete(kw.id)}
                              title="Delete keyword"
                              className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
