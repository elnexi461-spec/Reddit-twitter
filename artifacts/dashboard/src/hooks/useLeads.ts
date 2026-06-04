import { useState, useEffect, useCallback, useMemo } from "react";

export type PipelineStatus = "unclaimed" | "contacted" | "qualified" | "converted";

export interface LeadNote {
  text: string;
  createdAt: string;
}

export interface Lead {
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
  pipelineStatus: PipelineStatus;
  notes: LeadNote[];
}

export interface ActivityResponse {
  uptime: number;
  totalLeads: number;
  workers: { reddit: "active" | "degraded"; twitter: "active" | "degraded" };
  leads: Lead[];
}

export type FilterSource = "all" | "reddit" | "HN";
export type FilterTier = "all" | "hot" | "warm" | "cool";
export type SortOrder = "newest" | "score";

export function useLeads() {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  // Filters
  const [filterSource, setFilterSource] = useState<FilterSource>("all");
  const [filterTier, setFilterTier] = useState<FilterTier>("all");
  const [filterText, setFilterText] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/activity");
      if (!res.ok) throw new Error("Failed to fetch");
      const result: ActivityResponse = await res.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const claimLead = useCallback(async (lead: Lead) => {
    if (lead.claimed || claimingId) return;
    setClaimingId(lead.id);
    try {
      const res = await fetch(`/api/leads/${lead.id}/claim`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to claim");
      const updated: Lead = await res.json();
      setData((prev) => prev ? {
        ...prev,
        leads: prev.leads.map((l) => l.id === updated.id ? updated : l),
      } : prev);
    } catch {
      // silent
    } finally {
      setClaimingId(null);
    }
  }, [claimingId]);

  const updatePipeline = useCallback(async (id: string, status: PipelineStatus) => {
    try {
      const res = await fetch(`/api/leads/${id}/pipeline`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update pipeline");
      const updated: Lead = await res.json();
      setData((prev) => prev ? {
        ...prev,
        leads: prev.leads.map((l) => l.id === updated.id ? updated : l),
      } : prev);
      return updated;
    } catch {
      return null;
    }
  }, []);

  const addNote = useCallback(async (id: string, note: string) => {
    try {
      const res = await fetch(`/api/leads/${id}/note`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      const updated: Lead = await res.json();
      setData((prev) => prev ? {
        ...prev,
        leads: prev.leads.map((l) => l.id === updated.id ? updated : l),
      } : prev);
      return updated;
    } catch {
      return null;
    }
  }, []);

  const filteredLeads = useMemo(() => {
    if (!data?.leads) return [];
    let list = [...data.leads];

    if (filterSource !== "all") list = list.filter((l) => l.source === filterSource);
    if (filterTier !== "all") list = list.filter((l) => l.tier === filterTier);
    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      list = list.filter((l) =>
        l.title.toLowerCase().includes(q) ||
        l.keyword.toLowerCase().includes(q)
      );
    }

    if (sortOrder === "score") list.sort((a, b) => b.score - a.score);
    // else: already sorted by newest from server

    return list;
  }, [data?.leads, filterSource, filterTier, filterText, sortOrder]);

  return {
    data,
    leads: data?.leads ?? [],
    filteredLeads,
    error,
    claimingId,
    filterSource, setFilterSource,
    filterTier, setFilterTier,
    filterText, setFilterText,
    sortOrder, setSortOrder,
    claimLead,
    updatePipeline,
    addNote,
    refetch: fetchData,
  };
}
