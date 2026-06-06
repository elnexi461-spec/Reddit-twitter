import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, MapPin, DollarSign, ExternalLink, Building2, Clock, Filter } from "lucide-react";
import type { LiveJobEvent } from "@/hooks/useLiveStream";

// ─── Demo data ────────────────────────────────────────────────────────────────
interface JobListing {
  id: string;
  company: string;
  logo: string;
  title: string;
  location: string;
  remote: boolean;
  salary: string;
  platform: "LinkedIn" | "Indeed" | "Glassdoor" | "Lever" | "Greenhouse";
  postedAgo: string;
  skills: string[];
  urgency: "critical" | "high" | "medium";
  url: string;
}

const DEMO_JOBS: JobListing[] = [
  {
    id: "j1", company: "OpenAI",      logo: "OA", title: "Web Crawler Infrastructure Engineer",     location: "San Francisco, CA", remote: true,  salary: "$190K–$240K", platform: "Greenhouse", postedAgo: "2h ago",   skills: ["Python", "Playwright", "Kubernetes", "Anti-bot"], urgency: "critical", url: "#",
  },
  {
    id: "j2", company: "Coinbase",    logo: "CB", title: "Web Scraping Infrastructure Lead",        location: "San Francisco, CA", remote: true,  salary: "$200K–$250K", platform: "Greenhouse", postedAgo: "6h ago",   skills: ["Node.js", "Puppeteer", "AWS", "Proxy rotation"], urgency: "critical", url: "#",
  },
  {
    id: "j3", company: "Netflix",     logo: "NF", title: "Sr. Data Extraction Engineer",            location: "Los Angeles, CA",   remote: false, salary: "$180K–$220K", platform: "Lever",      postedAgo: "1d ago",   skills: ["Python", "Scrapy", "Spark", "DataDome bypass"],  urgency: "high",     url: "#",
  },
  {
    id: "j4", company: "Anthropic",   logo: "AN", title: "Data Collection Engineer",                location: "San Francisco, CA", remote: false, salary: "$180K–$220K", platform: "Greenhouse", postedAgo: "1d ago",   skills: ["Python", "crawlee", "Cloudflare bypass"],        urgency: "high",     url: "#",
  },
  {
    id: "j5", company: "Stripe",      logo: "ST", title: "Data Pipeline Engineer (Scraping Focus)", location: "Dublin, Ireland",   remote: true,  salary: "€130K–€160K", platform: "Lever",      postedAgo: "2d ago",   skills: ["Go", "Playwright", "GCP", "Rate-limit evasion"], urgency: "high",     url: "#",
  },
  {
    id: "j6", company: "Spotify",     logo: "SP", title: "Automation Architect",                    location: "Stockholm, Sweden", remote: true,  salary: "€120K–€150K", platform: "Greenhouse", postedAgo: "3d ago",   skills: ["Python", "Selenium", "Kubernetes", "Proxies"],   urgency: "medium",   url: "#",
  },
  {
    id: "j7", company: "Revolut",     logo: "RV", title: "Web Data Extraction Developer",           location: "London, UK",        remote: true,  salary: "£95K–£130K",  platform: "Greenhouse", postedAgo: "3d ago",   skills: ["Python", "httpx", "Playwright", "Bright Data"], urgency: "medium",   url: "#",
  },
  {
    id: "j8", company: "Databricks",  logo: "DB", title: "Large-Scale Web Scraping Engineer",       location: "Amsterdam, NL",     remote: true,  salary: "€140K–€175K", platform: "LinkedIn",   postedAgo: "4d ago",   skills: ["Python", "Spark", "Scrapy", "Residential IPs"],  urgency: "high",     url: "#",
  },
];

const PLATFORM_STYLES: Record<string, { bg: string; color: string }> = {
  LinkedIn:   { bg: "rgba(10,102,194,0.15)",  color: "#3b82f6" },
  Indeed:     { bg: "rgba(37,121,218,0.12)",   color: "#60a5fa" },
  Glassdoor:  { bg: "rgba(15,157,88,0.12)",    color: "#34d399" },
  Lever:      { bg: "rgba(99,102,241,0.12)",   color: "#818cf8" },
  Greenhouse: { bg: "rgba(16,185,129,0.12)",   color: "#10b981" },
};

const URGENCY_STYLES: Record<string, { color: string; label: string; ring: string }> = {
  critical: { color: "#f87171", label: "Critical Signal", ring: "rgba(239,68,68,0.25)" },
  high:     { color: "#fbbf24", label: "High Signal",     ring: "rgba(245,158,11,0.2)" },
  medium:   { color: "#00ffb3", label: "Medium Signal",   ring: "rgba(0,255,179,0.15)" },
};

function LogoBadge({ abbr, urgency }: { abbr: string; urgency: string }) {
  const u = URGENCY_STYLES[urgency] ?? URGENCY_STYLES.medium;
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-xs font-black"
      style={{ background: `rgba(255,255,255,0.06)`, border: `1px solid ${u.ring}`, color: "#e8e8f0" }}>
      {abbr}
    </div>
  );
}

function LiveJobCard({ event }: { event: LiveJobEvent }) {
  return (
    <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 p-3 rounded-xl border dark:bg-zinc-900/60 bg-white dark:border-zinc-800 border-zinc-200">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
        <Briefcase className="w-4 h-4" style={{ color: "#818cf8" }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-bold dark:text-zinc-200 text-zinc-800">{event.title}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] dark:text-zinc-500 text-zinc-500">
          <span>{event.company}</span>
          <span>{event.location}</span>
          {event.salary && <span className="text-emerald-400 font-semibold">{event.salary}</span>}
        </div>
        <p className="text-[10px] dark:text-zinc-700 text-zinc-400 mt-0.5">{event.platform} · {new Date(event.ts).toLocaleTimeString()}</p>
      </div>
    </motion.div>
  );
}

type UrgencyFilter = "all" | "critical" | "high" | "medium";

export default function JobBoardAggregator({ mode, liveJobs }: { mode: "demo" | "live"; liveJobs: LiveJobEvent[] }) {
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>("all");

  if (mode === "live") {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Live Postings", value: liveJobs.length, color: "#818cf8" },
            { label: "Companies",     value: new Set(liveJobs.map((j) => j.company)).size, color: "#818cf8" },
            { label: "Platforms",     value: new Set(liveJobs.map((j) => j.platform)).size, color: "#818cf8" },
          ].map((m) => (
            <div key={m.label} className="rounded-xl p-3 text-center dark:bg-zinc-900/60 bg-white border dark:border-zinc-800 border-zinc-200">
              <div className="text-base font-black tabular-nums" style={{ color: m.color }}>{m.value}</div>
              <div className="text-[10px] dark:text-zinc-600 text-zinc-500 mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>

        {liveJobs.length > 0 ? (
          <div className="flex flex-col gap-2">
            {liveJobs.map((e) => <LiveJobCard key={e.id} event={e} />)}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5 py-16 text-center">
            <div className="relative w-20 h-20 flex items-center justify-center">
              {[0, 1, 2].map((i) => (
                <motion.div key={i} className="absolute rounded-full"
                  style={{ border: "1px solid rgba(129,140,248,0.2)", width: 34 + i * 20, height: 34 + i * 20 }}
                  animate={{ opacity: [0.8, 0, 0.8], scale: [1, 1.1, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.5, ease: "easeInOut" }} />
              ))}
              <Briefcase className="w-5 h-5 z-10" style={{ color: "#818cf8" }} />
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-1">
                <motion.span className="w-1.5 h-1.5 rounded-full" style={{ background: "#818cf8" }}
                  animate={{ opacity: [1, 0.2, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
                <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: "#818cf8" }}>Listening for Job Board Ingress…</span>
              </div>
              <p className="text-xs dark:text-zinc-600 text-zinc-500 max-w-[260px] leading-relaxed">
                Corporate job postings will stream here the moment the job board aggregator webhook fires.
              </p>
            </div>
            <div className="flex flex-col gap-1.5 w-full max-w-xs">
              {[0.85, 0.65, 0.7].map((w, i) => (
                <motion.div key={i} className="h-1.5 rounded-full" style={{ width: `${w * 100}%` }}
                  animate={{ opacity: [0.06, 0.16, 0.06] }}
                  transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}>
                  <div className="w-full h-full rounded-full" style={{ background: "rgba(129,140,248,0.5)" }} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Demo mode ──
  const filtered = urgencyFilter === "all" ? DEMO_JOBS : DEMO_JOBS.filter((j) => j.urgency === urgencyFilter);
  const criticalCount = DEMO_JOBS.filter((j) => j.urgency === "critical").length;

  return (
    <div className="flex flex-col gap-5">
      {/* Metrics */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active Postings", value: DEMO_JOBS.length, color: "#818cf8" },
          { label: "Critical Signals", value: criticalCount, color: "#f87171" },
          { label: "Avg. Comp.",      value: "$195K", color: "#34d399" },
        ].map((m) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="rounded-xl p-3 dark:bg-zinc-900/60 bg-white border dark:border-zinc-800 border-zinc-200">
            <div className="text-xl font-black tabular-nums mb-1" style={{ color: m.color }}>{m.value}</div>
            <div className="text-[10px] dark:text-zinc-600 text-zinc-500">{m.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 dark:text-zinc-600 text-zinc-400" />
        {(["all", "critical", "high", "medium"] as UrgencyFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setUrgencyFilter(f)}
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
            style={urgencyFilter === f
              ? { background: "rgba(0,255,179,0.1)", border: "1px solid rgba(0,255,179,0.25)", color: "#00ffb3" }
              : { background: "transparent", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.3)" }}
          >
            {f === "all" ? "All" : URGENCY_STYLES[f].label}
          </button>
        ))}
        <span className="ml-auto text-[10px] dark:text-zinc-600 text-zinc-400">{filtered.length} listings</span>
      </div>

      {/* Job cards */}
      <div className="flex flex-col gap-3">
        {filtered.map((job, idx) => {
          const u = URGENCY_STYLES[job.urgency];
          const p = PLATFORM_STYLES[job.platform] ?? { bg: "rgba(255,255,255,0.06)", color: "#aaa" };
          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              className="rounded-2xl border dark:bg-zinc-900/50 bg-white dark:border-zinc-800 border-zinc-200 p-4"
              style={{ borderLeft: `3px solid ${u.ring}` }}
            >
              <div className="flex items-start gap-3">
                <LogoBadge abbr={job.logo} urgency={job.urgency} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <div className="text-xs font-bold dark:text-zinc-200 text-zinc-800">{job.title}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3 h-3 dark:text-zinc-600 text-zinc-400" />
                        <span className="text-[11px] dark:text-zinc-400 text-zinc-500 font-medium">{job.company}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0" style={{ background: p.bg, color: p.color }}>
                      {job.platform}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-2.5 flex-wrap">
                    <span className="flex items-center gap-1 text-[11px] dark:text-zinc-500 text-zinc-500">
                      <MapPin className="w-3 h-3" />{job.location}
                      {job.remote && <span className="ml-1 text-[9px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400">Remote OK</span>}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                      <DollarSign className="w-3 h-3" />{job.salary}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] dark:text-zinc-600 text-zinc-400">
                      <Clock className="w-3 h-3" />{job.postedAgo}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {job.skills.map((sk) => (
                      <span key={sk} className="text-[9px] px-1.5 py-0.5 rounded dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-400 text-zinc-500 font-mono">{sk}</span>
                    ))}
                    <span className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: u.color, background: `${u.ring}` }}>
                      {u.label}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
