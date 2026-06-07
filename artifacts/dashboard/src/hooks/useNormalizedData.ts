import { useMemo } from "react";
import { useLeads, type Lead } from "@/hooks/useLeads";

// ─── Unified Enterprise Schema ─────────────────────────────────────────────────
export interface NormalizedLead {
  target_id: string;
  company_name: string;
  intent_source: "registry_tracking" | "job_board_scraping" | "infrastructure_fingerprint";
  signal_strength: "Low" | "Medium" | "High";
  extracted_metadata: {
    packages?: string[];
    job_description?: string;
    cloud_provider?: string;
    server_ip_regions?: string[];
    keyword?: string;
    raw_title?: string;
    url?: string;
    score?: number;
    source_platform?: string;
  };
  discovery_timestamp: string;
}

// ─── Fast deterministic hash (no crypto required) ─────────────────────────────
function hashStr(s: string): string {
  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0") + "-" +
    Math.abs(s.length * 2654435761).toString(16).padStart(8, "0").slice(0, 8);
}

// ─── Extract a best-effort company / entity name from a lead title ─────────────
function extractCompany(lead: Lead): string {
  const title = lead.title;
  // Look for "at <Company>" pattern (job-board style)
  const atMatch = title.match(/\bat\s+([A-Z][a-zA-Z0-9&\s.]{2,24}?)(?:\s*[-,–]|$)/);
  if (atMatch) return atMatch[1].trim();
  // Look for "for <Company>" pattern
  const forMatch = title.match(/\bfor\s+([A-Z][a-zA-Z0-9&\s.]{2,24}?)(?:\s+(?:team|project|app|api|platform))?(?:\s*[-,–?]|$)/i);
  if (forMatch) return forMatch[1].trim();
  // Derive from subreddit or source
  if (lead.source === "HN") return "HN Community Post";
  // Fall back to keyword-derived entity
  const kw = lead.keyword ?? "";
  if (kw.includes("cloudflare")) return "Cloudflare-Protected Site Operator";
  if (kw.includes("datadome")) return "DataDome Enterprise Client";
  if (kw.includes("puppeteer") || kw.includes("playwright")) return "Headless Browser Developer";
  if (kw.includes("proxy") || kw.includes("residential ip")) return "Proxy Infrastructure Buyer";
  if (kw.includes("scrapy") || kw.includes("scraping")) return "Data Extraction Engineer";
  return "Independent Developer";
}

// ─── Map score to signal strength ─────────────────────────────────────────────
function signalStrength(score: number): "Low" | "Medium" | "High" {
  if (score >= 80) return "High";
  if (score >= 60) return "Medium";
  return "Low";
}

// ─── Map lead source to intent source ─────────────────────────────────────────
function intentSource(lead: Lead): NormalizedLead["intent_source"] {
  const kw = (lead.keyword ?? "").toLowerCase();
  if (kw.includes("npm") || kw.includes("package") || kw.includes("registry") ||
      kw.includes("puppeteer") || kw.includes("playwright") || kw.includes("scrapy")) {
    return "registry_tracking";
  }
  if (kw.includes("hiring") || kw.includes("job") || kw.includes("engineer") ||
      kw.includes("architect") || kw.includes("developer")) {
    return "job_board_scraping";
  }
  return "registry_tracking"; // default for keyword signals
}

// ─── Build extracted_metadata from a lead ─────────────────────────────────────
function buildMetadata(lead: Lead): NormalizedLead["extracted_metadata"] {
  const kw = (lead.keyword ?? "").toLowerCase();
  const packages: string[] = [];
  if (kw.includes("puppeteer"))  packages.push("puppeteer");
  if (kw.includes("playwright")) packages.push("playwright");
  if (kw.includes("scrapy"))     packages.push("scrapy");
  if (kw.includes("selenium"))   packages.push("selenium-webdriver");
  if (kw.includes("cheerio"))    packages.push("cheerio");
  if (kw.includes("axios"))      packages.push("axios");

  return {
    packages: packages.length ? packages : undefined,
    keyword: lead.keyword,
    raw_title: lead.title,
    url: lead.url,
    score: lead.score,
    source_platform: lead.source,
  };
}

// ─── Normalize a Lead[] into NormalizedLead[] ──────────────────────────────────
export function normalizeLeads(leads: Lead[]): NormalizedLead[] {
  return leads.map((lead) => ({
    target_id: hashStr(lead.url ?? lead.id),
    company_name: extractCompany(lead),
    intent_source: intentSource(lead),
    signal_strength: signalStrength(lead.score),
    extracted_metadata: buildMetadata(lead),
    discovery_timestamp: lead.timestamp ?? new Date().toISOString(),
  }));
}

// ─── Export helpers ────────────────────────────────────────────────────────────
export function exportAsJSON(records: NormalizedLead[]): void {
  const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `zenrows-intel-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportAsCSV(records: NormalizedLead[]): void {
  const headers = [
    "target_id", "company_name", "intent_source", "signal_strength",
    "discovery_timestamp", "keyword", "score", "source_platform",
    "url", "raw_title", "packages",
  ];
  const rows = records.map((r) => [
    r.target_id,
    `"${r.company_name.replace(/"/g, '""')}"`,
    r.intent_source,
    r.signal_strength,
    r.discovery_timestamp,
    r.extracted_metadata.keyword ?? "",
    r.extracted_metadata.score ?? "",
    r.extracted_metadata.source_platform ?? "",
    r.extracted_metadata.url ?? "",
    `"${(r.extracted_metadata.raw_title ?? "").replace(/"/g, '""')}"`,
    `"${(r.extracted_metadata.packages ?? []).join(";")}"`,
  ].join(","));

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `zenrows-intel-manifest-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Composite stats ───────────────────────────────────────────────────────────
export interface NormalizedStats {
  normalizedLeads: NormalizedLead[];
  totalCount: number;
  payloadSizeKB: number;
  marketReadyCount: number;
  marketReadyPct: number;
}

export function computeStats(records: NormalizedLead[]): NormalizedStats {
  const json = JSON.stringify(records);
  const payloadSizeKB = Math.round(new Blob([json]).size / 1024 * 10) / 10;
  const marketReadyCount = records.filter((r) => r.signal_strength !== "Low").length;
  const marketReadyPct = records.length
    ? Math.round((marketReadyCount / records.length) * 100)
    : 0;
  return { normalizedLeads: records, totalCount: records.length, payloadSizeKB, marketReadyCount, marketReadyPct };
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useNormalizedData(demoLeads?: Lead[]) {
  const { leads: apiLeads } = useLeads();
  const source = demoLeads && demoLeads.length > 0 ? demoLeads : apiLeads;
  return useMemo(() => {
    const records = normalizeLeads(source);
    return computeStats(records);
  }, [source]);
}
