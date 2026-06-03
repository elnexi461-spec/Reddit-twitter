const MAX_LEADS = 100;

export type WorkerStatus = "active" | "degraded";

export interface Lead {
  id: string;
  source: "reddit" | "twitter";
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

export function pushLead(lead: Lead): void {
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
