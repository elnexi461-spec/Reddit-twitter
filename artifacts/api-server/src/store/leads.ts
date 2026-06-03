const MAX_LEADS = 100;
const CONTENT_WINDOW = 50;

export type WorkerStatus = "active" | "degraded";

export interface Lead {
  id: string;
  source: "reddit" | "twitter" | "X";
  keyword: string;
  title: string;
  url: string;
  timestamp: string;
}

interface WorkerState {
  reddit: WorkerStatus;
  twitter: WorkerStatus;
}

const leads: Lead[] = [];
const workerStatus: WorkerState = { reddit: "active", twitter: "active" };
const startedAt = Date.now();

// Sliding window of normalized content fingerprints across both sources
const contentWindow: string[] = [];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isDuplicateContent(text: string): boolean {
  const fingerprint = normalize(text);
  return contentWindow.includes(fingerprint);
}

function trackContent(text: string): void {
  const fingerprint = normalize(text);
  contentWindow.push(fingerprint);
  if (contentWindow.length > CONTENT_WINDOW) contentWindow.shift();
}

export function pushLead(lead: Lead): void {
  if (isDuplicateContent(lead.title)) return;
  trackContent(lead.title);
  leads.unshift(lead);
  if (leads.length > MAX_LEADS) leads.length = MAX_LEADS;
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
