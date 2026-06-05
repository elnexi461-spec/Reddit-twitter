import { useState, useEffect, useRef, useCallback } from "react";

// ─── Domain pool ──────────────────────────────────────────────────────────────
const DOMAINS = [
  { name: "amazon.com",     baseLoad: 62 },
  { name: "homedepot.com",  baseLoad: 38 },
  { name: "walmart.com",    baseLoad: 54 },
  { name: "target.com",     baseLoad: 31 },
  { name: "bestbuy.com",    baseLoad: 27 },
  { name: "ebay.com",       baseLoad: 44 },
  { name: "etsy.com",       baseLoad: 19 },
  { name: "shopify.com",    baseLoad: 22 },
];

// ─── Multiplier types (ZenRows real tiers) ────────────────────────────────────
const MULTIPLIER_TYPES = [
  { type: "Standard API",          multiplier: 1,  baseShare: 0.44 },
  { type: "JS Rendering",          multiplier: 5,  baseShare: 0.30 },
  { type: "Stealth Mode",          multiplier: 10, baseShare: 0.16 },
  { type: "Premium Residential",   multiplier: 25, baseShare: 0.10 },
];

// ─── Sentinel log messages ────────────────────────────────────────────────────
const WARNING_MSGS = [
  (d: string, n: number) => `${d}: ${n}/100 concurrent slots — approaching cap`,
  (d: string, n: number) => `Rate-limit pre-scan: ${d} at ${n}% capacity`,
  (d: string, n: number) => `${d}: throttle probe active — ${n}/100 slots used`,
];
const CRITICAL_MSGS = [
  (d: string, n: number) => `[CONCURRENCY COLLISION RISK: INITIATING COOLDOWN WEBHOOK] ${d} hit ${n}/100`,
  (d: string, n: number) => `429 prevention triggered on ${d} — ${n}/100 slots exceeded threshold`,
  (d: string, n: number) => `CIRCUIT OPEN: ${d} concurrency ${n}/100 — auto-throttle armed`,
];
const RECOVERY_MSGS = [
  (d: string) => `${d}: cooldown complete — slots normalized, concurrency safe`,
  (d: string) => `${d}: circuit closed — resuming full-rate requests`,
  (d: string) => `Auto-throttle released on ${d} — headroom restored`,
  (d: string) => `${d}: 429-avoidance payload accepted — session rescheduled`,
];
const INFO_MSGS = [
  (d: string) => `${d}: multiplier routing optimised — JS render batch queued`,
  (d: string) => `${d}: residential proxy pool refreshed — latency nominal`,
  (d: string) => `${d}: session fingerprint rotated — bot score reset`,
  (d: string) => `${d}: credit burst absorbed — cost multiplier within budget`,
];

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DomainRow {
  domain: string;
  active: number;
  cap: number;
  headroom: number;
  risk: "safe" | "warning" | "critical";
  throttled: boolean;
}

export interface MultiplierRow {
  type: string;
  multiplier: number;
  requests: number;
  creditsUsed: number;
}

export interface SentinelEvent {
  id: string;
  time: string;
  domain: string;
  kind: "info" | "warning" | "critical" | "recovery";
  msg: string;
}

export interface TelemetryState {
  rps: number;
  rpsTrend: number[];
  activeSlots: number;
  slotCap: number;
  concurrencyHeadroom: number;
  creditsSaved: number;
  creditsProcessed: number;
  costEfficiencyPct: number;
  domains: DomainRow[];
  multiplierBreakdown: MultiplierRow[];
  sentinelLog: SentinelEvent[];
  throttleActive: boolean;
  collisionDomain: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
let eventIdCounter = 0;
function eid() { return `ev-${++eventIdCounter}`; }
function nowHHMMSS() {
  return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }
function drift(v: number, lo: number, hi: number, max: number) {
  return clamp(v + Math.round((Math.random() - 0.48) * max), lo, hi);
}

// ─── Initial state ────────────────────────────────────────────────────────────
function buildInitialDomains(): DomainRow[] {
  return DOMAINS.map((d) => {
    const active = clamp(d.baseLoad + Math.round((Math.random() - 0.5) * 8), 0, 100);
    return {
      domain: d.name,
      active,
      cap: 100,
      headroom: 100 - active,
      risk: active >= 95 ? "critical" : active >= 80 ? "warning" : "safe",
      throttled: false,
    };
  });
}

function buildInitialMultipliers(): MultiplierRow[] {
  return MULTIPLIER_TYPES.map((m) => {
    const requests = Math.round(m.baseShare * 4200 + (Math.random() - 0.5) * 200);
    return { type: m.type, multiplier: m.multiplier, requests, creditsUsed: requests * m.multiplier };
  });
}

const INITIAL_LOG: SentinelEvent[] = [
  { id: eid(), time: "00:00:12", domain: "amazon.com",    kind: "info",     msg: "amazon.com: multiplier routing optimised — JS render batch queued" },
  { id: eid(), time: "00:00:08", domain: "walmart.com",   kind: "warning",  msg: "walmart.com: 82/100 concurrent slots — approaching cap" },
  { id: eid(), time: "00:00:04", domain: "walmart.com",   kind: "recovery", msg: "walmart.com: cooldown complete — slots normalized, concurrency safe" },
];

const INITIAL_STATE: TelemetryState = {
  rps: 127,
  rpsTrend: [98, 112, 119, 127, 134, 128, 121, 130, 127, 127],
  activeSlots: 0,
  slotCap: 100,
  concurrencyHeadroom: 0,
  creditsSaved: 142_880,
  creditsProcessed: 1_284_000,
  costEfficiencyPct: 94.2,
  domains: buildInitialDomains(),
  multiplierBreakdown: buildInitialMultipliers(),
  sentinelLog: INITIAL_LOG,
  throttleActive: false,
  collisionDomain: null,
};

// Recalculate aggregate slots from domain list
function computeAggregates(domains: DomainRow[]) {
  const totalActive = domains.reduce((s, d) => s + (d.throttled ? 0 : d.active), 0);
  const biggestDomain = domains.reduce((a, b) => (b.active > a.active ? b : a), domains[0]);
  return {
    activeSlots: biggestDomain.active,
    concurrencyHeadroom: 100 - biggestDomain.active,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useTelemetry() {
  const [state, setState] = useState<TelemetryState>(() => {
    const s = { ...INITIAL_STATE };
    const agg = computeAggregates(s.domains);
    return { ...s, ...agg };
  });

  const tick = useRef(0);
  const throttleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Manual throttle trigger (button)
  const triggerThrottle = useCallback(() => {
    setState((prev) => {
      // Find the most loaded domain
      const sorted = [...prev.domains].sort((a, b) => b.active - a.active);
      const target = sorted[0];
      const time = nowHHMMSS();
      const newDomains = prev.domains.map((d) =>
        d.domain === target.domain
          ? { ...d, active: 42, headroom: 58, risk: "safe" as const, throttled: true }
          : d
      );
      const agg = computeAggregates(newDomains);
      const savedDelta = Math.round(target.active * 1.8 * 25);
      return {
        ...prev,
        ...agg,
        domains: newDomains,
        throttleActive: true,
        collisionDomain: target.domain,
        creditsSaved: prev.creditsSaved + savedDelta,
        sentinelLog: [
          { id: eid(), time, domain: target.domain, kind: "critical" as const, msg: pick(CRITICAL_MSGS)(target.domain, target.active) },
          { id: eid(), time, domain: target.domain, kind: "recovery" as const, msg: `Auto-throttle engaged — ${target.domain} slots reduced to 42/100` },
          ...prev.sentinelLog,
        ].slice(0, 40),
      };
    });

    // Auto-recover after 4 seconds
    if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);
    throttleTimerRef.current = setTimeout(() => {
      setState((prev) => {
        const time = nowHHMMSS();
        const newDomains = prev.domains.map((d) =>
          d.throttled
            ? { ...d, active: 55, headroom: 45, risk: "safe" as const, throttled: false }
            : d
        );
        const agg = computeAggregates(newDomains);
        const target = prev.domains.find((d) => d.throttled);
        return {
          ...prev,
          ...agg,
          domains: newDomains,
          throttleActive: false,
          collisionDomain: null,
          sentinelLog: [
            { id: eid(), time, domain: target?.domain ?? "system", kind: "recovery" as const, msg: target ? pick(RECOVERY_MSGS)(target.domain) : "All systems recovered" },
            ...prev.sentinelLog,
          ].slice(0, 40),
        };
      });
    }, 4_000);
  }, []);

  // Simulation tick every 1.8s
  useEffect(() => {
    const interval = setInterval(() => {
      tick.current++;
      const t = tick.current;

      setState((prev) => {
        if (prev.throttleActive) return prev; // pause sim during throttle

        // Drift RPS
        const rps = clamp(drift(prev.rps, 60, 280, 18), 60, 280);
        const rpsTrend = [...prev.rpsTrend.slice(1), rps];

        // Drift domain concurrency
        let collisionDomain: string | null = null;
        const newEvents: SentinelEvent[] = [];
        const time = nowHHMMSS();

        const domains = prev.domains.map((d) => {
          if (d.throttled) return d;

          // Gradually drift toward base load + noise
          const base = DOMAINS.find((x) => x.name === d.domain)!.baseLoad;
          const target = clamp(base + Math.round((Math.random() - 0.5) * 20), 10, 99);
          const active = clamp(d.active + Math.round((target - d.active) * 0.1 + (Math.random() - 0.48) * 6), 0, 100);
          const headroom = 100 - active;
          const risk: DomainRow["risk"] = active >= 95 ? "critical" : active >= 80 ? "warning" : "safe";

          if (active >= 95 && d.risk !== "critical") {
            collisionDomain = d.domain;
            newEvents.push({ id: eid(), time, domain: d.domain, kind: "critical", msg: pick(CRITICAL_MSGS)(d.domain, active) });
          } else if (active >= 80 && d.risk === "safe") {
            newEvents.push({ id: eid(), time, domain: d.domain, kind: "warning", msg: pick(WARNING_MSGS)(d.domain, active) });
          } else if (active < 80 && d.risk !== "safe") {
            newEvents.push({ id: eid(), time, domain: d.domain, kind: "recovery", msg: pick(RECOVERY_MSGS)(d.domain) });
          }

          return { ...d, active, headroom, risk };
        });

        // Occasionally add an info event
        if (t % 7 === 0) {
          const rd = pick(domains);
          newEvents.push({ id: eid(), time, domain: rd.domain, kind: "info", msg: pick(INFO_MSGS)(rd.domain) });
        }

        const agg = computeAggregates(domains);

        // Drift multipliers slightly
        const multiplierBreakdown = prev.multiplierBreakdown.map((m) => {
          const requests = clamp(m.requests + Math.round((Math.random() - 0.48) * 15), 50, 5000);
          return { ...m, requests, creditsUsed: requests * m.multiplier };
        });

        // Credits saved grows over time
        const creditsSaved = prev.creditsSaved + Math.round(rps * 0.04 * (Math.random() + 0.5));
        const creditsProcessed = prev.creditsProcessed + Math.round(rps * 1.2);
        const costEfficiencyPct = clamp(
          prev.costEfficiencyPct + (Math.random() - 0.49) * 0.15,
          88, 99.2
        );

        return {
          ...prev,
          rps,
          rpsTrend,
          ...agg,
          creditsSaved,
          creditsProcessed,
          costEfficiencyPct: Math.round(costEfficiencyPct * 10) / 10,
          domains,
          multiplierBreakdown,
          collisionDomain: collisionDomain ?? prev.collisionDomain,
          sentinelLog: [...newEvents, ...prev.sentinelLog].slice(0, 40),
        };
      });
    }, 1_800);

    return () => clearInterval(interval);
  }, []);

  return { state, triggerThrottle };
}
