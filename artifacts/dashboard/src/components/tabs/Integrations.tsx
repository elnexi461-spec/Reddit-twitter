import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Webhook, Key, Globe, Zap, Shield, CheckCircle2, XCircle,
  Eye, EyeOff, Send, RefreshCw, ToggleLeft, ToggleRight, Info,
} from "lucide-react";
import { toast } from "sonner";
import { useIntegrations } from "@/hooks/useIntegrations";

function SectionCard({ icon, title, subtitle, children }: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border dark:bg-zinc-900/50 bg-white dark:border-zinc-800 border-zinc-200 overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
    >
      <div className="px-5 py-4 border-b dark:border-zinc-800 border-zinc-100 flex items-center gap-3">
        <div className="p-2 rounded-xl dark:bg-zinc-800 bg-zinc-100 dark:text-blue-400 text-blue-500">
          {icon}
        </div>
        <div>
          <div className="text-sm font-semibold dark:text-zinc-200 text-zinc-800">{title}</div>
          {subtitle && <div className="text-[11px] dark:text-zinc-500 text-zinc-400 mt-0.5">{subtitle}</div>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
}

function SecretInput({ label, value, onChange, placeholder, description }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  description?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold dark:text-zinc-300 text-zinc-700 uppercase tracking-wide">
        {label}
      </label>
      {description && (
        <p className="text-[11px] dark:text-zinc-500 text-zinc-400">{description}</p>
      )}
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pr-10 pl-3 py-2.5 text-sm rounded-xl
            dark:bg-zinc-800/80 bg-zinc-50
            dark:border dark:border-zinc-700 border border-zinc-200
            dark:text-zinc-200 text-zinc-800
            placeholder:dark:text-zinc-600 placeholder:text-zinc-400
            focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-zinc-500 text-zinc-400 hover:dark:text-zinc-300 hover:text-zinc-600 transition-colors"
        >
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder, description, type = "text" }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  description?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold dark:text-zinc-300 text-zinc-700 uppercase tracking-wide">
        {label}
      </label>
      {description && (
        <p className="text-[11px] dark:text-zinc-500 text-zinc-400">{description}</p>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm rounded-xl
          dark:bg-zinc-800/80 bg-zinc-50
          dark:border dark:border-zinc-700 border border-zinc-200
          dark:text-zinc-200 text-zinc-800
          placeholder:dark:text-zinc-600 placeholder:text-zinc-400
          focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
      />
    </div>
  );
}

function AutoToggle({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b dark:border-zinc-800/60 border-zinc-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium dark:text-zinc-200 text-zinc-800">{label}</div>
        <div className="text-[11px] dark:text-zinc-500 text-zinc-400 mt-0.5 leading-relaxed">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`shrink-0 transition-colors duration-200 ${checked ? "text-blue-500" : "dark:text-zinc-600 text-zinc-400"}`}
      >
        {checked
          ? <ToggleRight className="w-9 h-9" />
          : <ToggleLeft className="w-9 h-9" />
        }
      </button>
    </div>
  );
}

export default function Integrations() {
  const { config, loading, saving, testing, error, testResult, fetchConfig, saveConfig, testWebhook } = useIntegrations();

  const [endpoint, setEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [secret, setSecret] = useState("");
  const [autoReplaceDrop, setAutoReplaceDrop] = useState(true);
  const [autoReplaceAbuse, setAutoReplaceAbuse] = useState(true);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    if (config) {
      setEndpoint(config.nodeManagementEndpoint ?? "");
      setApiKey("");
      setSecret("");
      setAutoReplaceDrop(config.autoReplaceOnDrop);
      setAutoReplaceAbuse(config.autoReplaceOnAbuse);
    }
  }, [config]);

  const handleSave = async () => {
    const patch: Record<string, unknown> = {
      nodeManagementEndpoint: endpoint,
      autoReplaceOnDrop: autoReplaceDrop,
      autoReplaceOnAbuse: autoReplaceAbuse,
    };
    if (apiKey) patch.apiKey = apiKey;
    if (secret) patch.webhookSecret = secret;

    const ok = await saveConfig(patch);
    if (ok) {
      toast.success("Integration config saved", { description: "Webhook settings updated successfully." });
      setApiKey("");
      setSecret("");
      fetchConfig();
    } else {
      toast.error("Failed to save config");
    }
  };

  const handleTest = async () => {
    if (!endpoint) {
      toast.error("Set a Node Management Endpoint first");
      return;
    }
    await testWebhook();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-2xl dark:bg-zinc-900/50 bg-zinc-100 animate-pulse border dark:border-zinc-800 border-zinc-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-xl">

      {/* Info banner */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 px-4 py-3 rounded-xl
          dark:bg-blue-950/20 bg-blue-50/80
          border dark:border-blue-900/30 border-blue-200/80"
      >
        <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
        <div className="text-xs dark:text-blue-300/80 text-blue-700 leading-relaxed">
          <span className="font-semibold">Plug-and-Play Integration.</span> When the Sentinel detects an IP drop or abuse event,
          it automatically fires a JSON webhook to your Node Management endpoint — replacing the IP with <span className="font-semibold">zero human interaction</span>.
        </div>
      </motion.div>

      {/* Node Management Endpoint */}
      <SectionCard
        icon={<Globe className="w-4 h-4" />}
        title="Node Management Endpoint"
        subtitle="Your Proxies.sx server that receives automated IP replacement commands"
      >
        <div className="space-y-4">
          <TextInput
            label="Endpoint URL"
            value={endpoint}
            onChange={setEndpoint}
            placeholder="https://api.proxies.sx/nodes/manage"
            description="The full HTTPS URL where the Sentinel will POST webhook payloads."
            type="url"
          />

          <div className="p-3 rounded-xl dark:bg-zinc-800/40 bg-zinc-50 border dark:border-zinc-700/40 border-zinc-200">
            <div className="text-[10px] uppercase tracking-wider dark:text-zinc-500 text-zinc-400 mb-2 font-semibold">Sample Payload</div>
            <pre className="text-[11px] dark:text-zinc-400 text-zinc-600 font-mono leading-relaxed overflow-x-auto">{`{
  "event": "ip_drop",
  "ip": "192.168.1.42",
  "reason": "Quarantined by Sentinel",
  "action": "replace_ip",
  "timestamp": "2026-06-04T12:00:00Z",
  "source": "proxies_sx_sentinel"
}`}</pre>
          </div>
        </div>
      </SectionCard>

      {/* API Credentials */}
      <SectionCard
        icon={<Key className="w-4 h-4" />}
        title="API Credentials"
        subtitle="Securely stored — masked in the UI after saving"
      >
        <div className="space-y-4">
          <SecretInput
            label="API Key"
            value={apiKey}
            onChange={setApiKey}
            placeholder={config?.hasApiKey ? "Leave blank to keep existing key" : "Paste your Proxies.sx API key"}
            description="Sent as Bearer token in the Authorization header."
          />
          <SecretInput
            label="Webhook Secret"
            value={secret}
            onChange={setSecret}
            placeholder={config?.hasWebhookSecret ? "Leave blank to keep existing secret" : "Optional signing secret"}
            description="Sent as X-Webhook-Secret header for request verification."
          />

          {config?.hasApiKey && (
            <div className="flex items-center gap-2 text-[11px] text-emerald-500">
              <CheckCircle2 className="w-3.5 h-3.5" />
              API key is saved (ending in {config.apiKey.slice(-4)})
            </div>
          )}
          {config?.hasWebhookSecret && (
            <div className="flex items-center gap-2 text-[11px] text-emerald-500">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Webhook secret is saved
            </div>
          )}
        </div>
      </SectionCard>

      {/* Automation Rules */}
      <SectionCard
        icon={<Zap className="w-4 h-4" />}
        title="Automation Rules"
        subtitle="Control when the Sentinel fires webhook commands automatically"
      >
        <div>
          <AutoToggle
            label="Auto-Replace on IP Drop"
            description="When a node goes offline or drops out of the pool, instantly fire a replace_ip command to your endpoint."
            checked={autoReplaceDrop}
            onChange={setAutoReplaceDrop}
          />
          <AutoToggle
            label="Auto-Replace on IP Abuse"
            description="When the Sentinel quarantines an IP for abuse detection, fire a quarantine command to lock it out at the server level."
            checked={autoReplaceAbuse}
            onChange={setAutoReplaceAbuse}
          />
        </div>
      </SectionCard>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-xs text-red-400 dark:bg-red-950/30 bg-red-50 border dark:border-red-900/40 border-red-200">
          <XCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}

      {/* Test result */}
      <AnimatePresence>
        {testResult && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={`flex items-center gap-2 p-3 rounded-xl text-xs border
              ${testResult.ok
                ? "text-emerald-500 dark:bg-emerald-950/30 bg-emerald-50 dark:border-emerald-900/40 border-emerald-200"
                : "text-red-400 dark:bg-red-950/30 bg-red-50 dark:border-red-900/40 border-red-200"
              }`}
          >
            {testResult.ok
              ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              : <XCircle className="w-3.5 h-3.5 shrink-0" />
            }
            <span><span className="font-semibold">Test {testResult.ok ? "passed" : "failed"}:</span> {testResult.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleTest}
          disabled={testing || !endpoint}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
            dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-300 text-zinc-600
            dark:border dark:border-zinc-700 border border-zinc-200
            hover:dark:bg-zinc-700 hover:bg-zinc-200 disabled:opacity-40 active:scale-95"
        >
          {testing
            ? <RefreshCw className="w-4 h-4 animate-spin" />
            : <Send className="w-4 h-4" />
          }
          {testing ? "Testing…" : "Test Connection"}
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
            bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 active:scale-[0.99]"
        >
          {saving
            ? <RefreshCw className="w-4 h-4 animate-spin" />
            : <Shield className="w-4 h-4" />
          }
          {saving ? "Saving…" : "Save Integration"}
        </button>
      </div>

      {config?.updatedAt && (
        <p className="text-[10px] dark:text-zinc-600 text-zinc-400 text-center">
          Last updated: {new Date(config.updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
