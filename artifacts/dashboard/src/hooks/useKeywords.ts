import { useState, useEffect, useCallback } from "react";

export type KeywordSource = "reddit" | "twitter" | "both";

export interface Keyword {
  id: string;
  term: string;
  source: KeywordSource;
  enabled: boolean;
  createdAt: string;
}

export function useKeywords() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKeywords = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/keywords");
      if (!res.ok) throw new Error("Failed to fetch");
      const data: Keyword[] = await res.json();
      setKeywords(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  const addKeyword = useCallback(async (term: string, source: KeywordSource) => {
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term, source }),
      });
      if (!res.ok) throw new Error("Failed to add keyword");
      const kw: Keyword = await res.json();
      setKeywords((prev) => [...prev, kw]);
      return kw;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown");
      return null;
    }
  }, []);

  const toggleKeyword = useCallback(async (id: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/keywords/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Failed to update");
      const kw: Keyword = await res.json();
      setKeywords((prev) => prev.map((k) => k.id === id ? kw : k));
    } catch {}
  }, []);

  const deleteKeyword = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/keywords/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setKeywords((prev) => prev.filter((k) => k.id !== id));
    } catch {}
  }, []);

  return { keywords, isLoading, error, addKeyword, toggleKeyword, deleteKeyword, refetch: fetchKeywords };
}
