import { motion } from "framer-motion";
import { Sun, Moon, Server, Wifi, Shield, Database, Sliders } from "lucide-react";
import { useState } from "react";
import { useLeads } from "@/hooks/useLeads";

interface SettingsProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm dark:text-zinc-300 text-zinc-700">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 focus:outline-none ${checked ? "bg-blue-500" : "dark:bg-zinc-700 bg-zinc-300"}`}
        style={{ height: "22px" }}
        aria-checked={checked}
        role="switch"
      >
        <motion.div
          layout
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
        />
      </button>
    </div>
  );
}

function Slider({ label, value, onChange, min = 0, max = 100, unit = "%" }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; unit?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm dark:text-zinc-300 text-zinc-700">{label}</span>
        <span className="text-xs font-mono font-bold dark:text-zinc-400 text-zinc-500">{value}{unit}</span>
      </div>
      <div className="relative h-1.5 rounded-full dark:bg-zinc-800 bg-zinc-200">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-blue-500 transition-all duration-150"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range" min={min} max={max} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
        />
      </div>
    </div>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`relative flex h-2 w-2 ${ok ? "" : ""}`}>
        {ok && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${ok ? "bg-emerald-500" : "bg-red-500"}`} />
      </span>
      <span className={`text-xs font-medium ${ok ? "text-emerald-500" : "text-red-500"}`}>
        {ok ? "Connected" : "Offline"}
      </span>
    </span>
  );
}

export default function Settings({ theme, onToggleTheme }: SettingsProps) {
  const { data } = useLeads();
  const [notifications, setNotifications] = useState(true);
  const [autoExport, setAutoExport] = useState(false);
  const [filterNoise, setFilterNoise] = useState(true);
  const [pollInterval, setPollInterval] = useState(10);
  const [maxLeads, setMaxLeads] = useState(100);
  const [scoreThreshold, setScoreThreshold] = useState(30);

  const apiOk = !!data;
  const redditOk = data?.workers.reddit === "active";
  const hnOk = data?.workers.twitter === "active";

  return (
    <div className="space-y-5 max-w-xl">

      {/* Appearance */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="rounded-xl border dark:bg-zinc-900/50 bg-white dark:border-zinc-800 border-zinc-200 overflow-hidden"
      >
        <div className="px-4 py-3 border-b dark:border-zinc-800 border-zinc-100 flex items-center gap-2">
          <Sun className="w-3.5 h-3.5 dark:text-zinc-500 text-zinc-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-500 text-zinc-400">Appearance</span>
        </div>
        <div className="p-4 space-y-4">
          {/* Theme toggle card */}
          <div className="flex items-center justify-between p-3 rounded-lg dark:bg-zinc-800/40 bg-zinc-50 border dark:border-zinc-700/50 border-zinc-200">
            <div className="flex items-center gap-3">
              {theme === "dark"
                ? <Moon className="w-4 h-4 text-blue-400" />
                : <Sun className="w-4 h-4 text-amber-400" />
              }
              <div>
                <div className="text-sm font-medium dark:text-zinc-200 text-zinc-800">
                  {theme === "dark" ? "Dark Mode" : "Light Mode"}
                </div>
                <div className="text-[11px] dark:text-zinc-500 text-zinc-400">
                  {theme === "dark" ? "Midnight-onyx interface" : "Pristine white interface"}
                </div>
              </div>
            </div>
            <button
              onClick={onToggleTheme}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                dark:bg-zinc-700 bg-zinc-200 dark:text-zinc-200 text-zinc-700
                hover:dark:bg-zinc-600 hover:bg-zinc-300 active:scale-95"
            >
              Switch to {theme === "dark" ? "Light" : "Dark"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* API Connection Status */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.05 }}
        className="rounded-xl border dark:bg-zinc-900/50 bg-white dark:border-zinc-800 border-zinc-200 overflow-hidden"
      >
        <div className="px-4 py-3 border-b dark:border-zinc-800 border-zinc-100 flex items-center gap-2">
          <Server className="w-3.5 h-3.5 dark:text-zinc-500 text-zinc-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-500 text-zinc-400">Connection Status</span>
        </div>
        <div className="p-4 space-y-3">
          {[
            { icon: <Database className="w-3.5 h-3.5 dark:text-zinc-500 text-zinc-400" />, label: "Intel API Server", ok: apiOk },
            { icon: <Wifi className="w-3.5 h-3.5 text-orange-400" />, label: "Reddit · Arctic-Shift Worker", ok: redditOk },
            { icon: <Wifi className="w-3.5 h-3.5 text-amber-400" />, label: "HN · Algolia Worker", ok: hnOk },
            { icon: <Shield className="w-3.5 h-3.5 text-blue-400" />, label: "Sentinel Monitor", ok: true },
          ].map(({ icon, label, ok }) => (
            <div key={label} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                {icon}
                <span className="text-sm dark:text-zinc-300 text-zinc-700">{label}</span>
              </div>
              <StatusDot ok={ok} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Engine Preferences */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.1 }}
        className="rounded-xl border dark:bg-zinc-900/50 bg-white dark:border-zinc-800 border-zinc-200 overflow-hidden"
      >
        <div className="px-4 py-3 border-b dark:border-zinc-800 border-zinc-100 flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 dark:text-zinc-500 text-zinc-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-500 text-zinc-400">Engine Preferences</span>
        </div>
        <div className="p-4 space-y-4">
          <Toggle checked={notifications} onChange={setNotifications} label="Live notifications" />
          <Toggle checked={filterNoise} onChange={setFilterNoise} label="Noise filter (2026-only, proxy-intent)" />
          <Toggle checked={autoExport} onChange={setAutoExport} label="Auto-export claimed leads to CSV" />
          <div className="pt-1 border-t dark:border-zinc-800 border-zinc-100 space-y-4">
            <Slider label="Poll interval" value={pollInterval} onChange={setPollInterval} min={5} max={60} unit="s" />
            <Slider label="Max leads in feed" value={maxLeads} onChange={setMaxLeads} min={25} max={200} unit="" />
            <Slider label="Minimum score threshold" value={scoreThreshold} onChange={setScoreThreshold} min={0} max={90} unit="pts" />
          </div>
        </div>
      </motion.div>

      {/* Export */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.15 }}
      >
        <a
          href="/api/activity/export/csv"
          download
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold
            dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-200 text-zinc-700
            dark:border dark:border-zinc-700 border border-zinc-200
            hover:dark:bg-zinc-700 hover:bg-zinc-200 transition-colors active:scale-[0.99]"
        >
          Export All Leads as CSV
        </a>
      </motion.div>
    </div>
  );
}
