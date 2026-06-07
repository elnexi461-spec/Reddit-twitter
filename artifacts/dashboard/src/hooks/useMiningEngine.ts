import { useState, useCallback, useRef } from "react";

export type MiningStatus = "idle" | "harvesting" | "complete";
export type LogLevel = "INFO" | "SUCCESS" | "WARN" | "ERROR" | "DEBUG";

export interface TerminalEntry {
  id: string;
  level: LogLevel;
  message: string;
  ts: string;
}

function ts() {
  return new Date().toISOString().slice(11, 23);
}
function uid() { return Math.random().toString(36).slice(2, 9); }

const MINING_SCRIPT: Array<{ delay: number; level: LogLevel; message: string }> = [
  { delay: 0,    level: "INFO",    message: "Initializing ZenRows Mining Matrix v3.2…" },
  { delay: 180,  level: "DEBUG",   message: "Allocating signal normalization buffers…" },
  { delay: 420,  level: "INFO",    message: "[ Vector 1 ] Connecting to npm registry feed…" },
  { delay: 680,  level: "INFO",    message: "Parsing npm registry for puppeteer@latest…" },
  { delay: 900,  level: "INFO",    message: "Parsing npm registry for playwright@latest…" },
  { delay: 1100, level: "INFO",    message: "Parsing npm registry for scrapy==2.11.*…" },
  { delay: 1350, level: "SUCCESS", message: "14 high-intent npm package targets structured" },
  { delay: 1600, level: "INFO",    message: "Scanning PyPI download velocity signals…" },
  { delay: 1850, level: "SUCCESS", message: "9 Python scraping library adopters fingerprinted" },
  { delay: 2100, level: "INFO",    message: "[ Vector 2 ] Engaging job board aggregator…" },
  { delay: 2300, level: "INFO",    message: "Scanning LinkedIn: 'web scraping architect'…" },
  { delay: 2550, level: "INFO",    message: "Scanning Greenhouse/Lever: 'data extraction'…" },
  { delay: 2750, level: "SUCCESS", message: "11 corporate job-board signals qualified" },
  { delay: 2950, level: "INFO",    message: "Extracting job description intent strings…" },
  { delay: 3200, level: "SUCCESS", message: "8 companies with active scraping infrastructure hiring" },
  { delay: 3450, level: "INFO",    message: "[ Vector 3 ] Fingerprinting cloud infrastructure…" },
  { delay: 3650, level: "INFO",    message: "Probing AWS us-east-1 high-bandwidth clusters…" },
  { delay: 3900, level: "INFO",    message: "Probing DigitalOcean & Hetzner automation nodes…" },
  { delay: 4100, level: "INFO",    message: "Reverse DNS scan: automation pipeline detection…" },
  { delay: 4350, level: "WARN",    message: "3 targets under Cloudflare proxy — depth-2 resolve applied" },
  { delay: 4600, level: "SUCCESS", message: "22 cloud infrastructure targets classified" },
  { delay: 4850, level: "INFO",    message: "Running normalization engine on raw payloads…" },
  { delay: 5050, level: "DEBUG",   message: "Hashing target_id keys (FNV-1a 32-bit)…" },
  { delay: 5250, level: "DEBUG",   message: "Mapping signal_strength thresholds [High≥80, Med≥60]…" },
  { delay: 5500, level: "INFO",    message: "Deduplicating targets across all three vectors…" },
  { delay: 5750, level: "SUCCESS", message: "54 unique normalized entities committed to store" },
  { delay: 5950, level: "INFO",    message: "Calculating market readiness index…" },
  { delay: 6200, level: "SUCCESS", message: "Market-ready signals: 38 High + 12 Medium = 50 total" },
  { delay: 6400, level: "INFO",    message: "Preparing export schemas (JSON + CSV)…" },
  { delay: 6600, level: "SUCCESS", message: "Export manifests ready — 54 structured payloads" },
  { delay: 6800, level: "SUCCESS", message: "━━━ MINING COMPLETE — ENGINE RETURNING TO IDLE ━━━" },
];

export interface MiningEngineState {
  status: MiningStatus;
  entries: TerminalEntry[];
  execute: () => void;
  reset: () => void;
  clearLog: () => void;
}

export function useMiningEngine(): MiningEngineState {
  const [status, setStatus] = useState<MiningStatus>("idle");
  const [entries, setEntries] = useState<TerminalEntry[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const reset = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStatus("idle");
  }, []);

  const clearLog = useCallback(() => setEntries([]), []);

  const execute = useCallback(() => {
    if (status === "harvesting") return;
    // Clear previous timers
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setEntries([]);
    setStatus("harvesting");

    MINING_SCRIPT.forEach((step) => {
      const t = setTimeout(() => {
        setEntries((prev) => [
          ...prev,
          { id: uid(), level: step.level, message: step.message, ts: ts() },
        ]);
      }, step.delay);
      timers.current.push(t);
    });

    // Final: mark complete then auto-idle
    const lastDelay = MINING_SCRIPT[MINING_SCRIPT.length - 1].delay + 400;
    const completeTimer = setTimeout(() => setStatus("complete"), lastDelay);
    timers.current.push(completeTimer);
  }, [status]);

  return { status, entries, execute, reset, clearLog };
}
