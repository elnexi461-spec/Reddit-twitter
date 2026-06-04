import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Server, Wifi, Shield, Database, Sliders, Tags, Plus, Trash2, Volume2, VolumeX, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useLeads } from "@/hooks/useLeads";
import { useKeywords, type KeywordSource } from "@/hooks/useKeywords";

interface SettingsProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

function Toggle({ checked, onChange, label, description }: {
  checked: boolean; onChange: (v: boolean) => void;
  label: string; description?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-sm dark:text-zinc-300 text-zinc-700">{label}</div>
        {description && <div className="text-[11px] dark:text-zinc-500 text-zinc-400 mt-0.5">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-10 rounded-full transition-colors duration-200 focus:outline-none
          ${checked ? "bg-blue-500" : "dark:bg-zinc-700 bg-zinc-300"}`}
        style={{ height: "22px" }}
        role="switch" aria-checked={checked}
      >
        <motion.div
          layout
          animate={{ x: checked ? 20 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm"
        />
      </button>
    </div>
  );
}

function Slider({ label, value, onChange, min = 0, max = 100, unit = "%", description }: {
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; unit?: string; description?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm dark:text-zinc-300 text-zinc-700">{label}</div>
          {description && <div className="text-[11px] dark:text-zinc-500 text-zinc-400">{description}</div>}
        </div>
        <span className="text-xs font-mono font-bold dark:text-zinc-400 text-zinc-500">{value}{unit}</span>
      </div>
      <div className="relative h-1.5 rounded-full dark:bg-zinc-800 bg-zinc-200">
        <div className="absolute inset-y-0 left-0 rounded-full bg-blue-500 transition-all duration-150" style={{ width: `${pct}%` }} />
        <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
      </div>
    </div>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="relative flex h-2 w-2">
        {ok && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${ok ? "bg-emerald-500" : "bg-red-500"}`} />
      </span>
      <span className={`text-xs font-medium ${ok ? "text-emerald-500" : "text-red-500"}`}>
        {ok ? "Connected" : "Offline"}
      </span>
    </span>
  );
}

function SectionShell({ icon, label, children }: {
  icon: React.ReactNode; label: string; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border dark:bg-zinc-900/50 bg-white dark:border-zinc-800 border-zinc-200 overflow-hidden"
    >
      <div className="px-4 py-3 border-b dark:border-zinc-800 border-zinc-100 flex items-center gap-2">
        <span className="dark:text-zinc-500 text-zinc-400">{icon}</span>
        <span className="text-[11px] font-semibold uppercase tracking-wider dark:text-zinc-500 text-zinc-400">{label}</span>
      </div>
      <div className="p-4">{children}</div>
    </motion.div>
  );
}

// ─── Keyword Manager ──────────────────────────────────────────────────────────

function KeywordManager() {
  const { keywords, isLoading, error, addKeyword, toggleKeyword, deleteKeyword } = useKeywords();
  const [newTerm, setNewTerm] = useState("");
  const [newSource, setNewSource] = useState<KeywordSource>("both");
  const [adding, setAdding] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim()) return;
    setAdding(true);
    const kw = await addKeyword(newTerm.trim(), newSource);
    setAdding(false);
    if (kw) {
      setNewTerm("");
      toast.success(`Keyword added: "${kw.term}"`);
    } else {
      toast.error("Failed to add keyword");
    }
  };

  const handleDelete = async (id: string, term: string) => {
    await deleteKeyword(id);
    toast.success(`Removed: "${term}"`);
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    await toggleKeyword(id, enabled);
    toast.success(enabled ? "Keyword enabled" : "Keyword paused");
  };

  const SOURCE_LABELS: Record<KeywordSource, string> = {
    both: "Both",
    reddit: "Reddit",
    twitter: "HN",
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg dark:bg-red-950/30 bg-red-50 border dark:border-red-900/40 border-red-200 text-red-500 text-xs">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          placeholder='New keyword (e.g. "proxy rotation")'
          value={newTerm}
          onChange={(e) => setNewTerm(e.target.value)}
          className="flex-1 text-sm px-3 py-2 rounded-lg dark:bg-zinc-800 bg-zinc-50
            dark:border dark:border-zinc-700 border border-zinc-200
            dark:text-zinc-200 text-zinc-800 placeholder:dark:text-zinc-600 placeholder:text-zinc-400
            focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
        <select
          value={newSource}
          onChange={(e) => setNewSource(e.target.value as KeywordSource)}
          className="text-xs dark:bg-zinc-800 bg-zinc-50 dark:text-zinc-300 text-zinc-600
            dark:border dark:border-zinc-700 border border-zinc-200 rounded-lg px-2 py-2
            focus:outline-none cursor-pointer"
        >
          <option value="both">Both</option>
          <option value="reddit">Reddit</option>
          <option value="twitter">HN</option>
        </select>
        <button
          type="submit"
          disabled={!newTerm.trim() || adding}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold
            bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 transition-colors active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" /> {adding ? "Adding…" : "Add"}
        </button>
      </form>

      {/* Keyword list */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg dark:bg-zinc-800 bg-zinc-100 animate-pulse" />
          ))
        ) : keywords.length === 0 ? (
          <div className="text-center py-6 text-sm dark:text-zinc-600 text-zinc-400">
            No keywords configured yet
          </div>
        ) : (
          <AnimatePresence>
            {keywords.map((kw) => (
              <motion.div
                key={kw.id}
                layout
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8, height: 0 }}
                transition={{ duration: 0.15 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all
                  ${kw.enabled
                    ? "dark:bg-zinc-800/50 bg-zinc-50 dark:border-zinc-700/50 border-zinc-200"
                    : "dark:bg-zinc-900/30 bg-zinc-50/50 dark:border-zinc-800 border-zinc-200 opacity-50"
                  }`}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium dark:text-zinc-200 text-zinc-700 font-mono">{kw.term}</span>
                </div>
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border
                  ${kw.source === "both" ? "dark:bg-zinc-700/50 dark:text-zinc-400 text-zinc-500 border-zinc-300 dark:border-zinc-600"
                    : kw.source === "reddit" ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}
                >
                  {SOURCE_LABELS[kw.source]}
                </span>
                <button
                  onClick={() => handleToggle(kw.id, !kw.enabled)}
                  className={`relative shrink-0 w-8 rounded-full transition-colors focus:outline-none
                    ${kw.enabled ? "bg-blue-500" : "dark:bg-zinc-700 bg-zinc-300"}`}
                  style={{ height: "18px" }}
                >
                  <motion.div
                    animate={{ x: kw.enabled ? 14 : 2 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="absolute top-[2px] w-3.5 h-3.5 rounded-full bg-white shadow-sm"
                  />
                </button>
                <button
                  onClick={() => handleDelete(kw.id, kw.term)}
                  className="p-1.5 rounded-lg dark:text-zinc-600 text-zinc-400 hover:text-red-400 hover:dark:bg-red-950/30 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      <p className="text-[10px] dark:text-zinc-600 text-zinc-400">
        Workers re-scan automatically using the active keyword set every 5 minutes.
        Changes take effect on the next poll cycle.
      </p>
    </div>
  );
}

// ─── Main Settings ────────────────────────────────────────────────────────────
export default function Settings({ theme, onToggleTheme, soundEnabled, onToggleSound }: SettingsProps) {
  const { data } = useLeads();
  const [notifications, setNotifications] = useState(true);
  const [autoExport, setAutoExport] = useState(false);
  const [filterNoise, setFilterNoise] = useState(true);
  const [pollInterval, setPollInterval] = useState(10);
  const [maxLeads, setMaxLeads] = useState(200);
  const [scoreThreshold, setScoreThreshold] = useState(30);

  const apiOk = !!data;
  const redditOk = data?.workers.reddit === "active";
  const hnOk = data?.workers.twitter === "active";

  return (
    <div className="space-y-5 max-w-xl">

      {/* Appearance */}
      <SectionShell icon={<Sun className="w-3.5 h-3.5" />} label="Appearance">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg dark:bg-zinc-800/40 bg-zinc-50 border dark:border-zinc-700/50 border-zinc-200">
            <div className="flex items-center gap-3">
              {theme === "dark" ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-400" />}
              <div>
                <div className="text-sm font-medium dark:text-zinc-200 text-zinc-800">
                  {theme === "dark" ? "Dark Mode" : "Light Mode"}
                </div>
                <div className="text-[11px] dark:text-zinc-500 text-zinc-400">
                  {theme === "dark" ? "Midnight-onyx interface" : "High-contrast white interface"}
                </div>
              </div>
            </div>
            <button
              onClick={onToggleTheme}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                dark:bg-zinc-700 bg-zinc-200 dark:text-zinc-200 text-zinc-700
                hover:dark:bg-zinc-600 hover:bg-zinc-300 active:scale-95"
            >
              Switch to {theme === "dark" ? "Light" : "Dark"}
            </button>
          </div>
          <Toggle
            checked={soundEnabled}
            onChange={onToggleSound}
            label={soundEnabled ? "🔊 Hot Alert Sound On" : "🔇 Hot Alert Sound Off"}
            description="Play a chime when a new high-intent (Hot) lead is detected"
          />
        </div>
      </SectionShell>

      {/* Connection Status */}
      <SectionShell icon={<Server className="w-3.5 h-3.5" />} label="Connection Status">
        <div className="space-y-3">
          {[
            { icon: <Database className="w-3.5 h-3.5 dark:text-zinc-500 text-zinc-400" />, label: "Intel API Server", ok: apiOk },
            { icon: <Wifi className="w-3.5 h-3.5 text-orange-400" />, label: "Reddit · Arctic-Shift Worker", ok: redditOk },
            { icon: <Wifi className="w-3.5 h-3.5 text-amber-400" />, label: "HN · Algolia Worker", ok: hnOk },
            { icon: <Shield className="w-3.5 h-3.5 text-blue-400" />, label: "Alpha Monitor", ok: true },
          ].map(({ icon, label, ok }) => (
            <div key={label} className="flex items-center justify-between py-0.5">
              <div className="flex items-center gap-2">{icon}<span className="text-sm dark:text-zinc-300 text-zinc-700">{label}</span></div>
              <StatusDot ok={ok} />
            </div>
          ))}
        </div>
      </SectionShell>

      {/* Keyword Manager */}
      <SectionShell icon={<Tags className="w-3.5 h-3.5" />} label="Keyword Manager">
        <KeywordManager />
      </SectionShell>

      {/* Engine Preferences */}
      <SectionShell icon={<Sliders className="w-3.5 h-3.5" />} label="Engine Preferences">
        <div className="space-y-4">
          <Toggle checked={notifications} onChange={setNotifications} label="Live notifications" />
          <Toggle checked={filterNoise} onChange={setFilterNoise}
            label="Noise filter active"
            description="2026-only, proxy-intent regex gate on all incoming posts"
          />
          <Toggle checked={autoExport} onChange={setAutoExport}
            label="Auto-export claimed leads"
            description="Downloads a CSV snapshot when a lead is claimed"
          />
          <div className="pt-2 border-t dark:border-zinc-800 border-zinc-100 space-y-4">
            <Slider label="Poll interval" value={pollInterval} onChange={setPollInterval} min={5} max={60} unit="s" description="How often to refresh the lead feed" />
            <Slider label="Max leads in store" value={maxLeads} onChange={setMaxLeads} min={50} max={500} unit="" description="Older leads are dropped when limit is reached" />
            <Slider label="Minimum score threshold" value={scoreThreshold} onChange={setScoreThreshold} min={0} max={90} unit="pts" description="Leads below this score won't appear in the feed" />
          </div>
        </div>
      </SectionShell>

      {/* Export */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <a
          href="/api/activity/export/csv"
          download
          onClick={() => toast.success("Exporting all leads as CSV…")}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold
            dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-200 text-zinc-700
            dark:border dark:border-zinc-700 border border-zinc-200
            hover:dark:bg-zinc-700 hover:bg-zinc-200 transition-colors active:scale-[0.99]"
        >
          Export All Leads as CSV ↓
        </a>
      </motion.div>
    </div>
  );
}
