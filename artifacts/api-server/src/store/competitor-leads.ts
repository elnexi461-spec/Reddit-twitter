import fs from "fs";
import path from "path";
import type { Competitor, SentimentLabel } from "../lib/qualify-competitor.js";
import { notifySlack, notifyDiscord } from "./integrations.js";

const MAX_LEADS = 300;
const BACKUP_PATH = path.resolve(process.cwd(), "data", "competitor_leads.json");

export type PipelineStatus = "unclaimed" | "contacted" | "qualified" | "converted";

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
  // Competitor-specific fields
  competitorMention: Competitor;
  frustrationScore: number;
  sentimentLabel: SentimentLabel;
  detectedLanguage?: string;
  priceComplaint: boolean;
}

interface BackupFile {
  leads: CompetitorLead[];
}

const leads: CompetitorLead[] = [];
const seenIds = new Set<string>();
const contentWindow: string[] = [];
const CONTENT_WINDOW_SIZE = 80;

const COMPETITOR_SCORE_BOOST: Record<Competitor, number> = {
  "Bright Data": 35,
  "Oxylabs": 30,
  "ScraperAPI": 28,
  "Crawlbase": 22,
  "Webshare": 20,
};

function normalize(t: string): string {
  return t.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}

function isDuplicate(title: string): boolean {
  return contentWindow.includes(normalize(title));
}

function trackContent(title: string): void {
  contentWindow.push(normalize(title));
  if (contentWindow.length > CONTENT_WINDOW_SIZE) contentWindow.shift();
}

function saveToDisk(): void {
  try {
    fs.mkdirSync(path.dirname(BACKUP_PATH), { recursive: true });
    fs.writeFileSync(BACKUP_PATH, JSON.stringify({ leads: leads.slice() }, null, 2), "utf8");
  } catch (err) {
    console.error("[competitor-store] save failed:", (err as Error).message);
  }
}

export function loadCompetitorLeads(): void {
  if (!fs.existsSync(BACKUP_PATH)) {
    console.log("[competitor-store] no backup found — starting fresh");
    return;
  }
  try {
    const raw = fs.readFileSync(BACKUP_PATH, "utf8");
    const parsed: BackupFile = JSON.parse(raw);
    if (Array.isArray(parsed.leads)) {
      const yearNow = new Date().getFullYear();
      const valid = parsed.leads.filter((l) => {
        if (!l.id || seenIds.has(l.id)) return false;
        if (new Date(l.timestamp).getFullYear() !== yearNow) return false;
        seenIds.add(l.id);
        return true;
      }).slice(0, MAX_LEADS);
      leads.push(...valid);
      leads.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      console.log(`[competitor-store] restored ${leads.length} competitor leads`);
    }
  } catch (err) {
    console.error("[competitor-store] parse failed:", (err as Error).message);
  }
}

export interface PushCompetitorLeadArgs {
  id: string;
  source: "reddit" | "HN";
  keyword: string;
  title: string;
  url: string;
  timestamp: string;
  competitorMention: Competitor;
  frustrationScore: number;
  sentimentLabel: SentimentLabel;
  detectedLanguage?: string;
  priceComplaint: boolean;
}

export function pushCompetitorLead(args: PushCompetitorLeadArgs): void {
  const yearNow = new Date().getFullYear();
  if (new Date(args.timestamp).getFullYear() !== yearNow) return;
  if (seenIds.has(args.id)) return;
  if (isDuplicate(args.title)) return;

  seenIds.add(args.id);
  trackContent(args.title);

  // Scoring: base from frustration + competitor-specific boost + price complaint bonus
  const base = args.frustrationScore;
  const competitorBoost = COMPETITOR_SCORE_BOOST[args.competitorMention] ?? 20;
  const priceBoost = args.priceComplaint ? 15 : 0;
  const score = Math.min(100, base + competitorBoost + priceBoost);

  const tier: "hot" | "warm" | "cool" =
    score >= 65 ? "hot"
    : score >= 35 ? "warm"
    : "cool";

  const lead: CompetitorLead = {
    ...args,
    score,
    tier,
    claimed: false,
    pipelineStatus: "unclaimed",
    notes: [],
  };

  leads.unshift(lead);
  leads.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  if (leads.length > MAX_LEADS) leads.length = MAX_LEADS;
  saveToDisk();

  console.log(
    `[competitor-store] ✓ ${args.competitorMention} — ${args.sentimentLabel} — score=${score} — "${args.title.slice(0, 70)}"`
  );

  // Fire Slack/Discord for hot competitor leads
  if (tier === "hot" || tier === "warm") {
    const alert = {
      id: lead.id,
      title: `[Competitor Intercept: ${args.competitorMention}] ${lead.title}`,
      url: lead.url,
      source: lead.source,
      keyword: lead.keyword,
      score,
      tier,
    };
    notifySlack(alert).catch(() => {});
    notifyDiscord(alert).catch(() => {});
  }
}

export function claimCompetitorLead(id: string): CompetitorLead | null {
  const lead = leads.find((l) => l.id === id);
  if (!lead || lead.claimed) return lead ?? null;
  lead.claimed = true;
  lead.claimedAt = new Date().toISOString();
  if (lead.pipelineStatus === "unclaimed") lead.pipelineStatus = "contacted";
  saveToDisk();
  return { ...lead };
}

export function unclaimCompetitorLead(id: string): CompetitorLead | null {
  const lead = leads.find((l) => l.id === id);
  if (!lead) return null;
  lead.claimed = false;
  delete lead.claimedAt;
  saveToDisk();
  return { ...lead };
}

export function updateCompetitorPipeline(id: string, status: PipelineStatus): CompetitorLead | null {
  const lead = leads.find((l) => l.id === id);
  if (!lead) return null;
  lead.pipelineStatus = status;
  saveToDisk();
  return { ...lead };
}

export function addCompetitorNote(id: string, text: string): CompetitorLead | null {
  const lead = leads.find((l) => l.id === id);
  if (!lead) return null;
  if (!Array.isArray(lead.notes)) lead.notes = [];
  lead.notes.push({ text: text.trim(), createdAt: new Date().toISOString() });
  saveToDisk();
  return { ...lead };
}

export function getAllCompetitorLeads() {
  return leads.slice();
}

export function getCompetitorSnapshot() {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const oneHourAgo = now - oneHour;

  // Competitor frequency map (last 7 days)
  const competitorTrend: Record<string, number> = {};
  for (const lead of leads) {
    const c = lead.competitorMention;
    competitorTrend[c] = (competitorTrend[c] ?? 0) + 1;
  }

  // Velocity: leads in last hour
  const velocity = leads.filter((l) => new Date(l.timestamp).getTime() > oneHourAgo).length;

  // Sentiment breakdown
  const extreme = leads.filter((l) => l.sentimentLabel === "extreme_churn_risk").length;
  const high = leads.filter((l) => l.sentimentLabel === "high_priority_migration").length;
  const potential = leads.filter((l) => l.sentimentLabel === "migration_potential").length;

  return {
    leads: leads.slice(),
    totalLeads: leads.length,
    velocity,
    competitorTrend,
    sentimentBreakdown: { extreme, high, potential },
    hotCount: leads.filter((l) => l.tier === "hot").length,
  };
}
