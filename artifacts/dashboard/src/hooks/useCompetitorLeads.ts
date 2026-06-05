import { useState, useEffect, useCallback, useMemo } from "react";

export type PipelineStatus = "unclaimed" | "contacted" | "qualified" | "converted";
export type SentimentLabel = "extreme_churn_risk" | "high_priority_migration" | "migration_potential";
export type Competitor = "Bright Data" | "Oxylabs" | "ScraperAPI" | "Crawlbase" | "Webshare";

export interface CompetitorLeadNote {
  text: string;
  createdAt: string;
}

export interface CompetitorLead {
  id: string;
  source: "reddit" | "HN";
  keyword: string;
  title: string;
  url: string;
  timestamp: string;
  score: number;
  tier: "hot" | "warm" | "cool";
  claimed: boolean;
  claimedAt?: string;
  pipelineStatus: PipelineStatus;
  notes: CompetitorLeadNote[];
  competitorMention: Competitor;
  frustrationScore: number;
  sentimentLabel: SentimentLabel;
  detectedLanguage?: string;
  priceComplaint: boolean;
}

export interface CompetitorSnapshot {
  leads: CompetitorLead[];
  totalLeads: number;
  velocity: number;
  competitorTrend: Record<string, number>;
  sentimentBreakdown: { extreme: number; high: number; potential: number };
  hotCount: number;
}

export type FilterCompetitor = "all" | Competitor;
export type FilterSentiment = "all" | SentimentLabel;

export function useCompetitorLeads() {
  const [data, setData] = useState<CompetitorSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [filterCompetitor, setFilterCompetitor] = useState<FilterCompetitor>("all");
  const [filterSentiment, setFilterSentiment] = useState<FilterSentiment>("all");
  const [filterText, setFilterText] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "score">("newest");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/competitor-leads");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result: CompetitorSnapshot = await res.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 12_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const claimLead = useCallback(async (lead: CompetitorLead) => {
    if (lead.claimed || claimingId) return;
    setClaimingId(lead.id);
    try {
      const res = await fetch(`/api/competitor-leads/${lead.id}/claim`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const updated: CompetitorLead = await res.json();
      setData((prev) => prev ? { ...prev, leads: prev.leads.map((l) => l.id === updated.id ? updated : l) } : prev);
    } catch { /* silent */ }
    finally { setClaimingId(null); }
  }, [claimingId]);

  const unclaimLead = useCallback(async (lead: CompetitorLead) => {
    if (!lead.claimed || claimingId) return;
    setClaimingId(lead.id);
    try {
      const res = await fetch(`/api/competitor-leads/${lead.id}/unclaim`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const updated: CompetitorLead = await res.json();
      setData((prev) => prev ? { ...prev, leads: prev.leads.map((l) => l.id === updated.id ? updated : l) } : prev);
    } catch { /* silent */ }
    finally { setClaimingId(null); }
  }, [claimingId]);

  const updatePipeline = useCallback(async (id: string, status: PipelineStatus) => {
    try {
      const res = await fetch(`/api/competitor-leads/${id}/pipeline`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated: CompetitorLead = await res.json();
      setData((prev) => prev ? { ...prev, leads: prev.leads.map((l) => l.id === updated.id ? updated : l) } : prev);
      return updated;
    } catch { return null; }
  }, []);

  const addNote = useCallback(async (id: string, note: string) => {
    try {
      const res = await fetch(`/api/competitor-leads/${id}/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated: CompetitorLead = await res.json();
      setData((prev) => prev ? { ...prev, leads: prev.leads.map((l) => l.id === updated.id ? updated : l) } : prev);
      return updated;
    } catch { return null; }
  }, []);

  const filteredLeads = useMemo(() => {
    if (!data?.leads) return [];
    let list = [...data.leads];
    if (filterCompetitor !== "all") list = list.filter((l) => l.competitorMention === filterCompetitor);
    if (filterSentiment !== "all") list = list.filter((l) => l.sentimentLabel === filterSentiment);
    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      list = list.filter((l) => l.title.toLowerCase().includes(q) || l.competitorMention.toLowerCase().includes(q));
    }
    if (sortOrder === "score") list.sort((a, b) => b.score - a.score);
    return list;
  }, [data?.leads, filterCompetitor, filterSentiment, filterText, sortOrder]);

  return {
    data,
    error,
    claimingId,
    filteredLeads,
    filterCompetitor, setFilterCompetitor,
    filterSentiment, setFilterSentiment,
    filterText, setFilterText,
    sortOrder, setSortOrder,
    claimLead,
    unclaimLead,
    updatePipeline,
    addNote,
    refetch: fetchData,
  };
}
