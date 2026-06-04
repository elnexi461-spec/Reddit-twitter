import { useState, useEffect, useCallback } from "react";

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
}

export interface ActivityResponse {
  uptime: number;
  totalLeads: number;
  workers: {
    reddit: "active" | "degraded";
    twitter: "active" | "degraded";
  };
  leads: Lead[];
}

export function useLeads() {
  const [data, setData] = useState<ActivityResponse | null>(null);
  const [claimedMap, setClaimedMap] = useState<Record<string, string>>({});
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/activity");
      if (!res.ok) throw new Error("Failed to fetch");
      const result: ActivityResponse = await res.json();
      setData(result);
      setError(null);
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
    fetchData();
    const interval = setInterval(fetchData, 10_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const claimLead = useCallback(async (lead: Lead) => {
    if (claimedMap[lead.id] || claimingId) return;
    setClaimingId(lead.id);
    try {
      const res = await fetch(`/api/leads/${lead.id}/claim`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to claim");
      const updated: Lead = await res.json();
      setClaimedMap((prev) => ({
        ...prev,
        [lead.id]: updated.claimedAt ?? new Date().toISOString(),
      }));
    } catch {
      // silent — row stays unclaimed
    } finally {
      setClaimingId(null);
    }
  }, [claimedMap, claimingId]);

  return { data, claimedMap, claimingId, error, claimLead, refetch: fetchData };
}
