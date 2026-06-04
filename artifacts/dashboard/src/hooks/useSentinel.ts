import { useState, useEffect, useRef } from "react";

export interface SentinelState {
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
  killSwitch: {
    armed: boolean;
    lastEvent: string;
    events: { time: string; msg: string }[];
  };
  selfHealing: {
    activeNodes: number;
    totalNodes: number;
    lastWebhook: string;
    log: { time: string; msg: string }[];
  };
}

const ROUTES = [
  ["US-East", "Frankfurt", "Amsterdam"],
  ["US-West", "Tokyo", "Singapore"],
  ["US-East", "London", "Stockholm"],
  ["Chicago", "Paris", "Warsaw"],
];

const KILL_EVENTS = [
  "Throttled abusive key — 12 Mbps exceeded",
  "Auto-terminated: 6 consecutive 403s",
  "Bandwidth cap triggered on shared pool",
  "IP cycling: datacenter range flagged",
  "Emergency kill: DataDome challenge loop",
];

const HEAL_MSGS = [
  "Spun up 2 fresh residential IPs (US-East)",
  "Webhook fired: replaced 1 quarantined node",
  "Pool replenished: +5 clean IPs added",
  "Auto-replaced flagged datacenter IP",
  "Rotated 3 endpoints — latency normalized",
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

const initialState: SentinelState = {
  ipReputation: {
    checked: 4_812,
    quarantined: 37,
    lastBadIp: "104.28.55.112",
  },
  latency: {
    ms: 42,
    route: ["US-East", "Frankfurt", "Amsterdam"],
    trend: [48, 45, 52, 41, 44, 42, 39, 43, 42, 42],
  },
  killSwitch: {
    armed: true,
    lastEvent: "2m ago",
    events: [
      { time: "18:02:14", msg: "Auto-terminated: 6 consecutive 403s" },
      { time: "17:58:01", msg: "Throttled abusive key — 12 Mbps exceeded" },
      { time: "17:44:32", msg: "IP cycling: datacenter range flagged" },
    ],
  },
  selfHealing: {
    activeNodes: 124,
    totalNodes: 128,
    lastWebhook: "5m ago",
    log: [
      { time: "18:01:07", msg: "Webhook fired: replaced 1 quarantined node" },
      { time: "17:52:41", msg: "Pool replenished: +5 clean IPs added" },
      { time: "17:39:18", msg: "Auto-replaced flagged datacenter IP" },
    ],
  },
};

export function useSentinel(): SentinelState {
  const [state, setState] = useState<SentinelState>(initialState);
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

        const nextState: SentinelState = {
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
          killSwitch: {
            armed: true,
            lastEvent: prev.killSwitch.lastEvent,
            events: prev.killSwitch.events,
          },
          selfHealing: {
            activeNodes: Math.max(100, Math.min(128, prev.selfHealing.activeNodes + (Math.random() > 0.85 ? 1 : Math.random() > 0.9 ? -1 : 0))),
            totalNodes: 128,
            lastWebhook: prev.selfHealing.lastWebhook,
            log: prev.selfHealing.log,
          },
        };

        // Occasionally fire a kill event
        if (tick.current % 8 === 0) {
          const msg = pick(KILL_EVENTS);
          const time = nowHHMM();
          nextState.killSwitch = {
            ...nextState.killSwitch,
            lastEvent: "just now",
            events: [{ time, msg }, ...prev.killSwitch.events].slice(0, 5),
          };
        }

        // Occasionally fire a heal webhook
        if (tick.current % 11 === 0) {
          const msg = pick(HEAL_MSGS);
          const time = nowHHMM();
          nextState.selfHealing = {
            ...nextState.selfHealing,
            lastWebhook: "just now",
            log: [{ time, msg }, ...prev.selfHealing.log].slice(0, 5),
          };
        }

        return nextState;
      });
    }, 2_000);

    return () => clearInterval(interval);
  }, []);

  return state;
}
