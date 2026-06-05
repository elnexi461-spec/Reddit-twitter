import { useState, useEffect, useRef } from "react";

export interface MonitorState {
  ipReputation: {
    checked: number;
    quarantined: number;
    lastBadIp: string;
  };
  latency: {
    ms: number;
    route: string[];
    trend: number[];
  };
  circuitBreaker: {
    armed: boolean;
    lastEvent: string;
    events: { time: string; msg: string }[];
  };
  nodePool: {
    activeNodes: number;
    totalNodes: number;
    lastWebhook: string;
    log: { time: string; msg: string }[];
  };
}

export type SentinelState = MonitorState;

// ZenRows Scraping API Gateway routes
const ROUTES = [
  ["US-East", "Frankfurt", "Amsterdam"],
  ["US-West", "Tokyo", "Singapore"],
  ["US-East", "London", "Stockholm"],
  ["Chicago", "Paris", "Warsaw"],
];

// Anti-bot circuit breaker events — ZenRows context
const CIRCUIT_EVENTS = [
  "Cloudflare Turnstile block intercepted — session rotated",
  "Auto-terminated: 6 consecutive 403 Forbidden responses",
  "DataDome challenge loop detected — gateway switched",
  "PerimeterX fingerprint hit — residential pool rotated",
  "Akamai bot score threshold exceeded — headless session replaced",
];

// Scraping session recovery messages
const RECOVERY_MSGS = [
  "Spun up 2 fresh residential sessions (US-East pool)",
  "Webhook fired: replaced 1 blocked scraping session",
  "Anti-bot success rate restored to 98.4% after rotation",
  "Auto-replaced flagged headless fingerprint",
  "Rotated 3 gateway endpoints — latency normalized",
];

function randomIp() {
  return `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function nowHHMM() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const initialState: MonitorState = {
  ipReputation: {
    checked: 12_947,
    quarantined: 83,
    lastBadIp: "104.28.55.112",
  },
  latency: {
    ms: 42,
    route: ["US-East", "Frankfurt", "Amsterdam"],
    trend: [48, 45, 52, 41, 44, 42, 39, 43, 42, 42],
  },
  circuitBreaker: {
    armed: true,
    lastEvent: "2m ago",
    events: [
      { time: "18:02:14", msg: "Auto-terminated: 6 consecutive 403 Forbidden responses" },
      { time: "17:58:01", msg: "Cloudflare Turnstile block intercepted — session rotated" },
      { time: "17:44:32", msg: "PerimeterX fingerprint hit — residential pool rotated" },
    ],
  },
  nodePool: {
    activeNodes: 124,
    totalNodes: 128,
    lastWebhook: "5m ago",
    log: [
      { time: "18:01:07", msg: "Webhook fired: replaced 1 blocked scraping session" },
      { time: "17:52:41", msg: "Anti-bot success rate restored to 98.4% after rotation" },
      { time: "17:39:18", msg: "Auto-replaced flagged headless fingerprint" },
    ],
  },
};

export function useSentinel(): MonitorState {
  const [state, setState] = useState<MonitorState>(initialState);
  const tick = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      tick.current++;
      setState((prev) => {
        const nextMs = Math.min(180, Math.max(18,
          prev.latency.ms + Math.round((Math.random() - 0.48) * 12)
        ));
        const nextTrend = [...prev.latency.trend.slice(1), nextMs];
        const newQuarantined = prev.ipReputation.quarantined + (Math.random() > 0.82 ? 1 : 0);
        const gotNewBad = newQuarantined > prev.ipReputation.quarantined;

        const nextState: MonitorState = {
          ipReputation: {
            checked: prev.ipReputation.checked + Math.floor(Math.random() * 8) + 1,
            quarantined: newQuarantined,
            lastBadIp: gotNewBad ? randomIp() : prev.ipReputation.lastBadIp,
          },
          latency: {
            ms: nextMs,
            route: tick.current % 15 === 0 ? pick(ROUTES) : prev.latency.route,
            trend: nextTrend,
          },
          circuitBreaker: {
            armed: true,
            lastEvent: prev.circuitBreaker.lastEvent,
            events: prev.circuitBreaker.events,
          },
          nodePool: {
            activeNodes: Math.max(100, Math.min(128, prev.nodePool.activeNodes + (Math.random() > 0.85 ? 1 : Math.random() > 0.9 ? -1 : 0))),
            totalNodes: 128,
            lastWebhook: prev.nodePool.lastWebhook,
            log: prev.nodePool.log,
          },
        };

        if (tick.current % 8 === 0) {
          const msg = pick(CIRCUIT_EVENTS);
          const time = nowHHMM();
          nextState.circuitBreaker = {
            ...nextState.circuitBreaker,
            lastEvent: "just now",
            events: [{ time, msg }, ...prev.circuitBreaker.events].slice(0, 5),
          };
        }

        if (tick.current % 11 === 0) {
          const msg = pick(RECOVERY_MSGS);
          const time = nowHHMM();
          nextState.nodePool = {
            ...nextState.nodePool,
            lastWebhook: "just now",
            log: [{ time, msg }, ...prev.nodePool.log].slice(0, 5),
          };
        }

        return nextState;
      });
    }, 2_000);

    return () => clearInterval(interval);
  }, []);

  return state;
}
