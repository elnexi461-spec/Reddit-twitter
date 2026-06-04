import { useState, useEffect, useCallback } from "react";

export interface StatsData {
  dailyCounts: { date: string; reddit: number; hn: number; total: number }[];
  sourceBreakdown: { reddit: number; hn: number };
  tierBreakdown: { hot: number; warm: number; cool: number };
  topKeywords: { term: string; count: number }[];
  claimRate: number;
  totalToday: number;
  totalLeads: number;
  claimedCount: number;
  avgScore: number;
  pipelineBreakdown: {
    unclaimed: number;
    contacted: number;
    qualified: number;
    converted: number;
  };
  hotCount: number;
  warmCount: number;
}

export function useStats() {
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    try {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const json: StatsData = await res.json();
      setData(json);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown");
    }
  }, []);

  useEffect(() => {
    fetch_();
    const interval = setInterval(fetch_, 30_000);
    return () => clearInterval(interval);
  }, [fetch_]);

  return { data, error, refetch: fetch_ };
}
