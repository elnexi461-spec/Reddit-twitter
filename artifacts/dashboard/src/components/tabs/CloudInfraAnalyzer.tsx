import { useState } from "react";
import { motion } from "framer-motion";
import { Server, Globe, Wifi, AlertTriangle, Activity, RefreshCw, ExternalLink } from "lucide-react";
import type { LiveInfraEvent } from "@/hooks/useLiveStream";

// ─── Demo data ────────────────────────────────────────────────────────────────
interface InfraCluster {
  id: string;
  provider: "AWS" | "DigitalOcean" | "Hetzner" | "Vultr" | "OVH";
  region: string;
  ipCount: number;
  reverseDnsPattern: string;
  egressGbh: number;
  riskLevel: "critical" | "high" | "medium" | "low";
  signatures: string[];
  asnOwner: string;
  lastSeen: string;
}

const DEMO_CLUSTERS: InfraCluster[] = [
  {
    id: "c1", provider: "AWS",          region: "us-east-1",  ipCount: 847, reverseDnsPattern: "ec2-*.compute-1.amazonaws.com",     egressGbh: 50.2, riskLevel: "critical", signatures: ["No browser UA rotation", "High concurrency bursts", "Missing JS rendering"], asnOwner: "Amazon.com, Inc.", lastSeen: "14s ago",
  },
  {
    id: "c2", provider: "DigitalOcean", region: "NYC3",        ipCount: 234, reverseDnsPattern: "scraper-worker-*.ams3.do.com",       egressGbh: 23.8, riskLevel: "critical", signatures: ["Sequential IP cycling", "No TLS fingerprint randomization"],                asnOwner: "DigitalOcean LLC", lastSeen: "1m ago",
  },
  {
    id: "c3", provider: "Hetzner",      region: "DE-FKS1",    ipCount: 156, reverseDnsPattern: "static.*.your-server.de",            egressGbh: 18.4, riskLevel: "high",     signatures: ["Batch download pattern", "puppeteer/chromium UA detected"],                  asnOwner: "Hetzner Online GmbH", lastSeen: "3m ago",
  },
  {
    id: "c4", provider: "Vultr",        region: "Tokyo, JP",  ipCount:  89, reverseDnsPattern: "103.*.vultrusercontent.com",         egressGbh: 12.1, riskLevel: "high",     signatures: ["playwright/1.x user agent", "High request frequency"],                       asnOwner: "AS-CHOOPA", lastSeen: "8m ago",
  },
  {
    id: "c5", provider: "OVH",          region: "GRA-9 (FR)", ipCount:  62, reverseDnsPattern: "vps-*.hosting.ovh.net",              egressGbh:  7.9, riskLevel: "medium",   signatures: ["Python requests detected", "No JS execution"],                              asnOwner: "OVH SAS", lastSeen: "22m ago",
  },
  {
    id: "c6", provider: "AWS",          region: "ap-southeast-1", ipCount: 198, reverseDnsPattern: "ec2-*.ap-southeast-1.compute.amazonaws.com", egressGbh: 28.6, riskLevel: "high", signatures: ["Scrapy user agent", "Distributed IP pool"], asnOwner: "Amazon.com, Inc.", lastSeen: "5m ago",
  },
];

const RECENT_EVENTS = [
  { time: "14s",  cluster: "AWS us-east-1",  kind: "critical", msg: "847 IPs active — concurrency spike to 4,200 req/min detected" },
  { time: "1m",   cluster: "DO NYC3",        kind: "critical", msg: "Sequential IP cycling pattern — automated proxy pool rotation confirmed" },
  { time: "3m",   cluster: "Hetzner DE",     kind: "warning",  msg: "puppeteer/22.x UA detected across 156-IP subnet — browser automation cluster" },
  { time: "8m",   cluster: "Vultr Tokyo",    kind: "warning",  msg: "playwright/1.49 headers identified — stealth scraping footprint" },
  { time: "15m",  cluster: "AWS ap-se-1",    kind: "warning",  msg: "198-node distributed pool with Scrapy headers — large data extraction op" },
  { time: "22m",  cluster: "OVH GRA-9",      kind: "info",     msg: "Python requests/2.32 without JS execution — lightweight scraper" },
];

const PROVIDER_COLORS: Record<string, { bg: string; color: string }> = {
  AWS:          { bg: "rgba(255,153,0,0.12)",  color: "#f59e0b" },
  DigitalOcean: { bg: "rgba(0,116,255,0.12)",  color: "#60a5fa" },
  Hetzner:      { bg: "rgba(209,36,47,0.12)",  color: "#f87171" },
  Vultr:        { bg: "rgba(0,163,255,0.12)",  color: "#38bdf8" },
  OVH:          { bg: "rgba(49,130,206,0.12)", color: "#63b3ed" },
};

const RISK_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: "#f87171", bg: "rgba(239,68,68,0.12)",  label: "Critical" },
  high:     { color: "#fbbf24", bg: "rgba(245,158,11,0.12)", label: "High" },
  medium:   { color: "#00ffb3", bg: "rgba(0,255,179,0.08)",  label: "Medium" },
  low:      { color: "#6b7280", bg: "rgba(107,114,128,0.1)", label: "Low" },
};

function RiskPill({ level }: { level: string }) {
  const s = RISK_STYLES[level] ?? RISK_STYLES.low;
  return <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
}

function ProviderBadge({ provider }: { provider: string }) {
  const s = PROVIDER_COLORS[provider] ?? { bg: "rgba(255,255,255,0.06)", color: "#aaa" };
  return <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: s.bg, color: s.color }}>{provider}</span>;
}

function EgressBar({ gbh, max = 55 }: { gbh: number; max?: number }) {
  const pct = Math.min(1, gbh / max);
  const color = pct > 0.7 ? "#f87171" : pct > 0.45 ? "#fbbf24" : "#00ffb3";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct * 100}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold tabular-nums dark:text-zinc-400 text-zinc-500 min-w-[48px]">{gbh.toFixed(1)} GB/h</span>
    </div>
  );
}

function LiveInfraCard({ event }: { event: LiveInfraEvent }) {
  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 p-3 rounded-xl border dark:bg-zinc-900/60 bg-white dark:border-zinc-800 border-zinc-200">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.15)" }}>
        <Server className="w-4 h-4" style={{ color: "#fbbf24" }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <ProviderBadge provider={String(event.provider)} />
          <span className="text-xs font-semibold dark:text-zinc-300 text-zinc-700">{event.region}</span>
          <RiskPill level={String(event.riskLevel)} />
        </div>
        <div className="text-[11px] dark:text-zinc-500 text-zinc-500">{event.ipCount} IPs · {event.egressGbh} GB/h · {event.reverseDnsPattern}</div>
        <p className="text-[10px] dark:text-zinc-700 text-zinc-400 mt-0.5">{new Date(event.ts).toLocaleTimeString()}</p>
      </div>
    </motion.div>
  );
}

export default function CloudInfraAnalyzer({ mode, liveInfra }: { mode: "demo" | "live"; liveInfra: LiveInfraEvent[] }) {
  const [lastRefresh] = useState(new Date().toLocaleTimeString());

  if (mode === "live") {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Live Clusters", value: liveInfra.length, color: "#fbbf24" },
            { label: "Total IPs",     value: liveInfra.reduce((s, e) => s + e.ipCount, 0), color: "#fbbf24" },
            { label: "Agg. Egress",  value: `${liveInfra.reduce((s, e) => s + e.egressGbh, 0).toFixed(1)} GB/h`, color: "#fbbf24" },
          ].map((m) => (
            <div key={m.label} className="rounded-xl p-3 text-center dark:bg-zinc-900/60 bg-white border dark:border-zinc-800 border-zinc-200">
              <div className="text-base font-black tabular-nums" style={{ color: m.color }}>{m.value}</div>
              <div className="text-[10px] dark:text-zinc-600 text-zinc-500 mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>

        {liveInfra.length > 0 ? (
          <div className="flex flex-col gap-2">
            {liveInfra.map((e) => <LiveInfraCard key={e.id} event={e} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 py-16 text-center">
            <div className="relative w-20 h-20 flex items-center justify-center">
              {[0, 1, 2].map((i) => (
                <motion.div key={i} className="absolute rounded-full"
                  style={{ border: "1px solid rgba(251,191,36,0.2)", width: 34 + i * 20, height: 34 + i * 20 }}
                  animate={{ opacity: [0.8, 0, 0.8], scale: [1, 1.1, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }} />
              ))}
              <Server className="w-5 h-5 z-10" style={{ color: "#fbbf24" }} />
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <motion.span className="w-1.5 h-1.5 rounded-full" style={{ background: "#fbbf24" }}
                  animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: "#fbbf24" }}>Listening for Infra Footprint Ingress…</span>
              </div>
              <p className="text-xs dark:text-zinc-600 text-zinc-500 max-w-[260px] leading-relaxed">
                Cloud infrastructure signals will populate here the moment reverse-DNS footprint data hits the ingest pipeline.
              </p>
            </div>
            <div className="flex flex-col gap-1.5 w-full max-w-xs">
              {[0.88, 0.62, 0.73].map((w, i) => (
                <motion.div key={i} className="h-1.5 rounded-full" style={{ width: `${w * 100}%` }}
                  animate={{ opacity: [0.06, 0.16, 0.06] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}>
                  <div className="w-full h-full rounded-full" style={{ background: "rgba(251,191,36,0.5)" }} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Demo mode ──
  const totalIPs = DEMO_CLUSTERS.reduce((s, c) => s + c.ipCount, 0);
  const totalEgress = DEMO_CLUSTERS.reduce((s, c) => s + c.egressGbh, 0);
  const critCount = DEMO_CLUSTERS.filter((c) => c.riskLevel === "critical").length;

  return (
    <div className="flex flex-col gap-5">
      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Clusters", value: DEMO_CLUSTERS.length, color: "#fbbf24" },
          { label: "Total IPs",     value: totalIPs.toLocaleString(), color: "#818cf8" },
          { label: "Agg. Egress",  value: `${totalEgress.toFixed(0)} GB/h`, color: "#f87171" },
          { label: "Critical",     value: critCount, color: "#f87171" },
        ].map((m) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="rounded-xl p-3 dark:bg-zinc-900/60 bg-white border dark:border-zinc-800 border-zinc-200">
            <div className="text-lg font-black tabular-nums mb-1" style={{ color: m.color }}>{m.value}</div>
            <div className="text-[10px] dark:text-zinc-600 text-zinc-500">{m.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Cluster table */}
      <div className="rounded-2xl border dark:bg-zinc-900/40 bg-white dark:border-zinc-800 border-zinc-200 overflow-hidden">
        <div className="px-4 py-3 border-b dark:border-zinc-800 border-zinc-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 dark:text-zinc-500 text-zinc-400" />
            <span className="text-xs font-bold dark:text-zinc-300 text-zinc-700">Cloud Infrastructure Footprint Analyzer</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] dark:text-zinc-600 text-zinc-400">
            <RefreshCw className="w-3 h-3" />
            <span>Last scan: {lastRefresh}</span>
          </div>
        </div>

        <div className="divide-y dark:divide-zinc-800/60 divide-zinc-100">
          {DEMO_CLUSTERS.map((cluster, idx) => (
            <motion.div key={cluster.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }}
              className="px-4 py-3 hover:dark:bg-zinc-800/30 hover:bg-zinc-50 transition-colors">
              <div className="flex items-start gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: PROVIDER_COLORS[cluster.provider]?.bg ?? "rgba(255,255,255,0.06)" }}>
                  <Server className="w-4 h-4" style={{ color: PROVIDER_COLORS[cluster.provider]?.color ?? "#aaa" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <ProviderBadge provider={cluster.provider} />
                    <span className="text-xs font-semibold dark:text-zinc-300 text-zinc-700">{cluster.region}</span>
                    <RiskPill level={cluster.riskLevel} />
                    <span className="ml-auto text-[10px] dark:text-zinc-600 text-zinc-400">Last seen {cluster.lastSeen}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-2">
                    <div className="flex items-center gap-1 text-[11px] dark:text-zinc-500 text-zinc-500">
                      <Wifi className="w-3 h-3" />
                      <span>{cluster.ipCount.toLocaleString()} IPs · {cluster.asnOwner}</span>
                    </div>
                    <div className="font-mono text-[10px] dark:text-zinc-500 text-zinc-500 truncate">{cluster.reverseDnsPattern}</div>
                  </div>

                  <EgressBar gbh={cluster.egressGbh} />

                  <div className="mt-2 flex flex-wrap gap-1">
                    {cluster.signatures.map((sig) => (
                      <span key={sig} className="text-[9px] px-1.5 py-0.5 rounded dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-500 text-zinc-500">{sig}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Event log */}
      <div className="rounded-2xl border dark:bg-zinc-900/40 bg-white dark:border-zinc-800 border-zinc-200 overflow-hidden">
        <div className="px-4 py-3 border-b dark:border-zinc-800 border-zinc-200 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 dark:text-zinc-500 text-zinc-400" />
          <span className="text-xs font-bold dark:text-zinc-300 text-zinc-700">Infrastructure Event Log</span>
        </div>
        <div className="divide-y dark:divide-zinc-800/50 divide-zinc-100">
          {RECENT_EVENTS.map((ev, i) => {
            const styles = { critical: { color: "#f87171", bg: "rgba(239,68,68,0.1)" }, warning: { color: "#fbbf24", bg: "rgba(245,158,11,0.1)" }, info: { color: "#00ffb3", bg: "rgba(0,255,179,0.07)" } };
            const s = styles[ev.kind as keyof typeof styles] ?? styles.info;
            return (
              <div key={i} className="px-4 py-2.5 flex items-start gap-3">
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 mt-0.5" style={{ background: s.bg, color: s.color }}>
                  {ev.kind}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium dark:text-zinc-400 text-zinc-600 mb-0.5">{ev.cluster}</div>
                  <div className="text-[11px] dark:text-zinc-500 text-zinc-500 leading-snug">{ev.msg}</div>
                </div>
                <span className="text-[10px] dark:text-zinc-700 text-zinc-400 shrink-0 font-mono">{ev.time} ago</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
