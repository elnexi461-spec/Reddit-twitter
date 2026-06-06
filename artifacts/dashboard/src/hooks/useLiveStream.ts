import { useState, useEffect, useRef } from "react";

// ─── Live data types ──────────────────────────────────────────────────────────
export interface LiveLead {
  id: string;
  ts: string;
  source: string;
  title: string;
  url: string;
  keyword: string;
  score: number;
  tier: string;
  [key: string]: unknown;
}

export interface LivePackageEvent {
  id: string;
  ts: string;
  registry: string;
  packageName: string;
  weeklyDownloads: number;
  githubStars: number;
  signal: string;
  riskScore: number;
  [key: string]: unknown;
}

export interface LiveJobEvent {
  id: string;
  ts: string;
  company: string;
  title: string;
  location: string;
  salary: string;
  platform: string;
  postedAt: string;
  [key: string]: unknown;
}

export interface LiveInfraEvent {
  id: string;
  ts: string;
  provider: string;
  region: string;
  ipCount: number;
  reverseDnsPattern: string;
  egressGbh: number;
  riskLevel: string;
  [key: string]: unknown;
}

export interface LiveStreamState {
  connected: boolean;
  leads: LiveLead[];
  packages: LivePackageEvent[];
  jobs: LiveJobEvent[];
  infra: LiveInfraEvent[];
}

const MAX_ITEMS = 50;

export function useLiveStream(active: boolean): LiveStreamState {
  const [connected, setConnected] = useState(false);
  const [leads, setLeads] = useState<LiveLead[]>([]);
  const [packages, setPackages] = useState<LivePackageEvent[]>([]);
  const [jobs, setJobs] = useState<LiveJobEvent[]>([]);
  const [infra, setInfra] = useState<LiveInfraEvent[]>([]);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!active) {
      esRef.current?.close();
      esRef.current = null;
      setConnected(false);
      setLeads([]);
      setPackages([]);
      setJobs([]);
      setInfra([]);
      return;
    }

    const es = new EventSource("/api/live-stream");
    esRef.current = es;

    es.addEventListener("connected", () => setConnected(true));
    es.addEventListener("ping", () => {});
    es.onerror = () => setConnected(false);

    es.addEventListener("lead", (e: MessageEvent) => {
      try {
        const data: LiveLead = JSON.parse(e.data);
        setLeads((prev) => [data, ...prev].slice(0, MAX_ITEMS));
      } catch {}
    });

    es.addEventListener("package", (e: MessageEvent) => {
      try {
        const data: LivePackageEvent = JSON.parse(e.data);
        setPackages((prev) => [data, ...prev].slice(0, MAX_ITEMS));
      } catch {}
    });

    es.addEventListener("job", (e: MessageEvent) => {
      try {
        const data: LiveJobEvent = JSON.parse(e.data);
        setJobs((prev) => [data, ...prev].slice(0, MAX_ITEMS));
      } catch {}
    });

    es.addEventListener("infra", (e: MessageEvent) => {
      try {
        const data: LiveInfraEvent = JSON.parse(e.data);
        setInfra((prev) => [data, ...prev].slice(0, MAX_ITEMS));
      } catch {}
    });

    return () => {
      es.close();
      esRef.current = null;
      setConnected(false);
    };
  }, [active]);

  return { connected, leads, packages, jobs, infra };
}
