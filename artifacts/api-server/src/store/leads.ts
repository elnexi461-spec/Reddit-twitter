import fs from "fs";
import path from "path";
import { scoreLead } from "../lib/score.js";
import { notifySlack, notifyDiscord } from "./integrations.js";

const MAX_LEADS = 200;
const CONTENT_WINDOW = 50;
const CURRENT_YEAR = 2026;
const BACKUP_PATH = path.resolve(process.cwd(), "data", "leads_backup.json");

export type WorkerStatus = "active" | "degraded";
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

interface WorkerState {
  reddit: WorkerStatus;
  twitter: WorkerStatus;
}

interface BackupFile {
  leads: Lead[];
  contentWindow: string[];
}

export interface StatsSnapshot {
  dailyCounts: { date: string; reddit: number; hn: number; total: number }[];
  sourceBreakdown: { reddit: number; hn: number };
  tierBreakdown: { hot: number; warm: number; cool: number };
  topKeywords: { term: string; count: number }[];
  claimRate: number;
  totalToday: number;
  totalLeads: number;
  claimedCount: number;
  avgScore: number;
  pipelineBreakdown: Record<PipelineStatus, number>;
  hotCount: number;
  warmCount: number;
}

const leads: Lead[] = [];
const seenIds = new Set<string>();
const workerStatus: WorkerState = { reddit: "active", twitter: "active" };
let startedAt = Date.now();
const contentWindow: string[] = [];

function isCurrentYear(timestamp: string): boolean {
  try { return new Date(timestamp).getFullYear() === CURRENT_YEAR; } catch { return false; }
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}

function isDuplicateContent(text: string): boolean {
  return contentWindow.includes(normalize(text));
}

function trackContent(text: string): void {
  contentWindow.push(normalize(text));
  if (contentWindow.length > CONTENT_WINDOW) contentWindow.shift();
}

function saveToDisk(): void {
  try {
    fs.mkdirSync(path.dirname(BACKUP_PATH), { recursive: true });
    const payload: BackupFile = { leads: leads.slice(), contentWindow: contentWindow.slice() };
    fs.writeFileSync(BACKUP_PATH, JSON.stringify(payload), "utf8");
  } catch (err) {
    console.error("[store] save failed:", (err as Error).message);
  }
}

function migrateLead(lead: Partial<Lead>): Lead {
  let result = lead as Lead;
  if (result.score === undefined || result.tier === undefined) {
    const { score, tier } = scoreLead(result.keyword ?? "", result.source ?? "", result.title ?? "");
    result = { ...result, score, tier };
  }
  if (result.claimed === undefined) result = { ...result, claimed: false };
  if (result.pipelineStatus === undefined) result = { ...result, pipelineStatus: "unclaimed" };
  if (!Array.isArray(result.notes)) result = { ...result, notes: [] };
  return result;
}

export function loadFromDisk(): void {
  if (!fs.existsSync(BACKUP_PATH)) return;
  try {
    const raw = fs.readFileSync(BACKUP_PATH, "utf8");
    const parsed: BackupFile = JSON.parse(raw);

    if (Array.isArray(parsed.leads)) {
      const unique = parsed.leads
        .map(migrateLead)
        .filter((l) => {
          if (!isCurrentYear(l.timestamp)) return false;
          if (seenIds.has(l.id)) return false;
          seenIds.add(l.id);
          return true;
        })
        .slice(0, MAX_LEADS);
      leads.push(...unique);
    }
    if (Array.isArray(parsed.contentWindow)) {
      contentWindow.push(...parsed.contentWindow.slice(0, CONTENT_WINDOW));
    }
    leads.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    console.log(`[store] restored ${leads.length} leads from disk (${CURRENT_YEAR} only, sorted by date desc)`);
  } catch (err) {
    console.error("[store] backup parse failed, starting clean:", (err as Error).message);
  }
}

export function pushLead(lead: Omit<Lead, "score" | "tier" | "claimed" | "claimedAt" | "pipelineStatus" | "notes">): void {
  if (!isCurrentYear(lead.timestamp)) return;
  if (seenIds.has(lead.id)) return;
  if (isDuplicateContent(lead.title)) return;

  seenIds.add(lead.id);
  trackContent(lead.title);

  const { score, tier } = scoreLead(lead.keyword, lead.source, lead.title);
  const full: Lead = { ...lead, score, tier, claimed: false, pipelineStatus: "unclaimed", notes: [] };

  leads.unshift(full);
  leads.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  if (leads.length > MAX_LEADS) leads.length = MAX_LEADS;
  saveToDisk();

  // Fire Slack/Discord alerts for hot/warm leads (non-blocking)
  if (tier === "hot" || tier === "warm") {
    const alert = { id: full.id, title: full.title, url: full.url, source: full.source, keyword: full.keyword, score, tier };
    notifySlack(alert).catch(() => {});
    notifyDiscord(alert).catch(() => {});
  }
}

export function unclaimLead(id: string): Lead | null {
  const lead = leads.find((l) => l.id === id);
  if (!lead) return null;
  lead.claimed = false;
  delete lead.claimedAt;
  saveToDisk();
  return lead;
}

export function claimLead(id: string): Lead | null {
  const lead = leads.find((l) => l.id === id);
  if (!lead) return null;
  if (lead.claimed) return lead;
  lead.claimed = true;
  lead.claimedAt = new Date().toISOString();
  if (lead.pipelineStatus === "unclaimed") lead.pipelineStatus = "contacted";
  saveToDisk();
  return { ...lead };
}

export function updatePipelineStatus(id: string, status: PipelineStatus): Lead | null {
  const lead = leads.find((l) => l.id === id);
  if (!lead) return null;
  lead.pipelineStatus = status;
  saveToDisk();
  return { ...lead };
}

export function addNote(id: string, text: string): Lead | null {
  const lead = leads.find((l) => l.id === id);
  if (!lead) return null;
  if (!Array.isArray(lead.notes)) lead.notes = [];
  lead.notes.push({ text: text.trim(), createdAt: new Date().toISOString() });
  saveToDisk();
  return { ...lead };
}

export function setWorkerStatus(worker: keyof WorkerState, status: WorkerStatus): void {
  workerStatus[worker] = status;
}

export function getSnapshot() {
  return {
    uptime: Math.floor((Date.now() - startedAt) / 1000),
    totalLeads: leads.length,
    workers: { ...workerStatus },
    leads: leads.slice(),
  };
}

export function getStats(): StatsSnapshot {
  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const total = leads.length || 1;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const dailyCounts = days.map((date) => {
    const dayLeads = leads.filter((l) => l.timestamp.startsWith(date));
    return {
      date,
      reddit: dayLeads.filter((l) => l.source === "reddit").length,
      hn: dayLeads.filter((l) => l.source === "HN").length,
      total: dayLeads.length,
    };
  });

  const redditCount = leads.filter((l) => l.source === "reddit").length;
  const hnCount = leads.filter((l) => l.source === "HN").length;
  const hotCount = leads.filter((l) => l.tier === "hot").length;
  const warmCount = leads.filter((l) => l.tier === "warm").length;
  const coolCount = leads.filter((l) => l.tier === "cool").length;

  const kwMap = new Map<string, number>();
  for (const lead of leads) kwMap.set(lead.keyword, (kwMap.get(lead.keyword) ?? 0) + 1);
  const topKeywords = Array.from(kwMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([term, count]) => ({ term, count }));

  const claimedCount = leads.filter((l) => l.claimed).length;
  const pipelineBreakdown: Record<PipelineStatus, number> = {
    unclaimed: leads.filter((l) => l.pipelineStatus === "unclaimed").length,
    contacted: leads.filter((l) => l.pipelineStatus === "contacted").length,
    qualified: leads.filter((l) => l.pipelineStatus === "qualified").length,
    converted: leads.filter((l) => l.pipelineStatus === "converted").length,
  };

  const totalToday = leads.filter((l) => l.timestamp.startsWith(todayStr)).length;
  const avgScore = Math.round((leads.reduce((s, l) => s + l.score, 0) / total) * 10) / 10;

  return {
    dailyCounts,
    sourceBreakdown: { reddit: Math.round((redditCount / total) * 100), hn: Math.round((hnCount / total) * 100) },
    tierBreakdown: { hot: hotCount, warm: warmCount, cool: coolCount },
    topKeywords,
    claimRate: Math.round((claimedCount / total) * 100),
    totalToday,
    totalLeads: leads.length,
    claimedCount,
    avgScore,
    pipelineBreakdown,
    hotCount,
    warmCount,
  };
}
