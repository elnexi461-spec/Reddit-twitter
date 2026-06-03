import fs from "fs";
import path from "path";
import { scoreLead } from "../lib/score.js";

const MAX_LEADS = 100;
const CONTENT_WINDOW = 50;
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

function migrateScore(lead: Partial<Lead>): Lead {
  if (lead.score === undefined || lead.tier === undefined) {
    const { score, tier } = scoreLead(
      lead.keyword ?? "",
      lead.source ?? "",
      lead.title ?? ""
    );
    return { ...(lead as Lead), score, tier };
  }
  return lead as Lead;
}

export function loadFromDisk(): void {
  if (!fs.existsSync(BACKUP_PATH)) return;

  try {
    const raw = fs.readFileSync(BACKUP_PATH, "utf8");
    const parsed: BackupFile = JSON.parse(raw);

    if (Array.isArray(parsed.leads)) {
      const unique = parsed.leads
        .map(migrateScore)
        .filter((l) => {
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

    console.log(`[store] restored ${leads.length} leads from disk`);
  } catch (err) {
    console.error("[store] backup parse failed, starting clean:", (err as Error).message);
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function pushLead(lead: Omit<Lead, "score" | "tier">): void {
  if (seenIds.has(lead.id)) return;
  if (isDuplicateContent(lead.title)) return;
  seenIds.add(lead.id);
  trackContent(lead.title);

  const { score, tier } = scoreLead(lead.keyword, lead.source, lead.title);
  const full: Lead = { ...lead, score, tier };

  leads.unshift(full);
  leads.sort((a, b) => b.score - a.score);
  if (leads.length > MAX_LEADS) leads.length = MAX_LEADS;
  saveToDisk();
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
