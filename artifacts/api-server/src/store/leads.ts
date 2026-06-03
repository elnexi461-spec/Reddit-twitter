import fs from "fs";
import path from "path";
import { scoreLead } from "../lib/score.js";

const MAX_LEADS = 100;
const CONTENT_WINDOW = 50;
const CURRENT_YEAR = 2026;
const BACKUP_PATH = path.resolve(process.cwd(), "data", "leads_backup.json");

export type WorkerStatus = "active" | "degraded";

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

interface WorkerState {
  reddit: WorkerStatus;
  twitter: WorkerStatus;
}

interface BackupFile {
  leads: Lead[];
  contentWindow: string[];
}

const leads: Lead[] = [];
const seenIds = new Set<string>();
const workerStatus: WorkerState = { reddit: "active", twitter: "active" };
let startedAt = Date.now();

const contentWindow: string[] = [];

// ---------------------------------------------------------------------------
// Temporal guard
// ---------------------------------------------------------------------------

function isCurrentYear(timestamp: string): boolean {
  try {
    return new Date(timestamp).getFullYear() === CURRENT_YEAR;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isDuplicateContent(text: string): boolean {
  return contentWindow.includes(normalize(text));
}

function trackContent(text: string): void {
  contentWindow.push(normalize(text));
  if (contentWindow.length > CONTENT_WINDOW) contentWindow.shift();
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

function saveToDisk(): void {
  try {
    fs.mkdirSync(path.dirname(BACKUP_PATH), { recursive: true });
    const payload: BackupFile = {
      leads: leads.slice(),
      contentWindow: contentWindow.slice(),
    };
    fs.writeFileSync(BACKUP_PATH, JSON.stringify(payload), "utf8");
  } catch (err) {
    console.error("[store] save failed:", (err as Error).message);
  }
}

function migrateLead(lead: Partial<Lead>): Lead {
  let result = lead as Lead;

  if (result.score === undefined || result.tier === undefined) {
    const { score, tier } = scoreLead(
      result.keyword ?? "",
      result.source ?? "",
      result.title ?? ""
    );
    result = { ...result, score, tier };
  }

  if (result.claimed === undefined) {
    result = { ...result, claimed: false };
  }

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

    console.log(
      `[store] restored ${leads.length} leads from disk (${CURRENT_YEAR} only)`
    );
  } catch (err) {
    console.error(
      "[store] backup parse failed, starting clean:",
      (err as Error).message
    );
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function pushLead(
  lead: Omit<Lead, "score" | "tier" | "claimed" | "claimedAt">
): void {
  // 1. Temporal guard — only accept leads from the current calendar year
  if (!isCurrentYear(lead.timestamp)) return;

  // 2. ID deduplication
  if (seenIds.has(lead.id)) return;

  // 3. Content deduplication
  if (isDuplicateContent(lead.title)) return;

  seenIds.add(lead.id);
  trackContent(lead.title);

  const { score, tier } = scoreLead(lead.keyword, lead.source, lead.title);
  const full: Lead = { ...lead, score, tier, claimed: false };

  leads.unshift(full);
  leads.sort((a, b) => b.score - a.score);
  if (leads.length > MAX_LEADS) leads.length = MAX_LEADS;
  saveToDisk();
}

export function claimLead(id: string): Lead | null {
  const lead = leads.find((l) => l.id === id);
  if (!lead) return null;
  if (lead.claimed) return lead;

  lead.claimed = true;
  lead.claimedAt = new Date().toISOString();
  saveToDisk();
  return { ...lead };
}

export function setWorkerStatus(
  worker: keyof WorkerState,
  status: WorkerStatus
): void {
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
