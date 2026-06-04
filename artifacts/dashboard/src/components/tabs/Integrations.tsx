import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Webhook, Key, Globe, Zap, Shield, CheckCircle2, XCircle,
  Eye, EyeOff, Send, RefreshCw, ToggleLeft, ToggleRight, Info,
  Slack, MessageSquare,
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
      {description && <p className="text-[11px] dark:text-zinc-500 text-zinc-400">{description}</p>}
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
      {description && <p className="text-[11px] dark:text-zinc-500 text-zinc-400">{description}</p>}
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
        {checked ? <ToggleRight className="w-9 h-9" /> : <ToggleLeft className="w-9 h-9" />}
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
  const [slackUrl, setSlackUrl] = useState("");
  const [discordUrl, setDiscordUrl] = useState("");
  const [notifyOnHot, setNotifyOnHot] = useState(true);
  const [notifyOnWarm, setNotifyOnWarm] = useState(false);
  const [testingSlack, setTestingSlack] = useState(false);
  const [testingDiscord, setTestingDiscord] = useState(false);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  useEffect(() => {
    if (config) {
      setEndpoint(config.nodeManagementEndpoint ?? "");
      setApiKey("");
      setSecret("");
      setAutoReplaceDrop(config.autoReplaceOnDrop);
      setAutoReplaceAbuse(config.autoReplaceOnAbuse);
      setSlackUrl("");
      setDiscordUrl("");
      setNotifyOnHot(config.notifyOnHot ?? true);
      setNotifyOnWarm(config.notifyOnWarm ?? false);
    }
  }, [config]);

  const handleSave = async () => {
    const patch: Record<string, unknown> = {
      nodeManagementEndpoint: endpoint,
      autoReplaceOnDrop: autoReplaceDrop,
      autoReplaceOnAbuse: autoReplaceAbuse,
      notifyOnHot,
      notifyOnWarm,
    };
    if (apiKey) patch.apiKey = apiKey;
    if (secret) patch.webhookSecret = secret;
    if (slackUrl) patch.slackWebhookUrl = slackUrl;
    if (discordUrl) patch.discordWebhookUrl = discordUrl;

    const ok = await saveConfig(patch);
    if (ok) {
      toast.success("Config saved", { description: "All integration settings updated." });
      setApiKey(""); setSecret(""); setSlackUrl(""); setDiscordUrl("");
      fetchConfig();
    } else {
      toast.error("Failed to save config");
    }
  };

  const handleTestNode = async () => {
    if (!endpoint) { toast.error("Set a Node Management Endpoint first"); return; }
    await testWebhook();
  };

  const handleTestSlack = async () => {
    setTestingSlack(true);
    try {
      const res = await fetch("/api/integrations/test-slack", { method: "POST" });
      const data = await res.json();
      if (data.ok) toast.success("Slack test sent!", { description: "Check your Slack channel for the test alert." });
      else toast.error("Slack test failed", { description: data.error });
    } catch {
      toast.error("Slack test failed — network error");
    } finally { setTestingSlack(false); }
  };

  const handleTestDiscord = async () => {
    setTestingDiscord(true);
    try {
      const res = await fetch("/api/integrations/test-discord", { method: "POST" });
      const data = await res.json();
      if (data.ok) toast.success("Discord test sent!", { description: "Check your Discord channel for the test alert." });
      else toast.error("Discord test failed", { description: data.error });
    } catch {
      toast.error("Discord test failed — network error");
    } finally { setTestingDiscord(false); }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
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
          <span className="font-semibold">Plug-and-Play Integration.</span>{" "}
          When the Alpha Monitor detects an IP drop or abuse event, it automatically fires a JSON webhook
          to your Node Management endpoint — replacing the IP with{" "}
          <span className="font-semibold">zero human interaction</span>.
          Slack and Discord alerts fire instantly on every new hot lead.
        </div>
      </motion.div>

      {/* ── Node Management Endpoint ─────────────────────────────────────── */}
      <SectionCard
        icon={<Globe className="w-4 h-4" />}
        title="Node Management Endpoint"
        subtitle="Receives automated IP replacement commands from the Alpha Monitor"
      >
        <div className="space-y-4">
          <TextInput
            label="Endpoint URL"
            value={endpoint}
            onChange={setEndpoint}
            placeholder="https://api.proxies.sx/nodes/manage"
            description="Full HTTPS URL — the Alpha Monitor will POST webhook payloads here."
            type="url"
          />

          <div className="p-3 rounded-xl dark:bg-zinc-800/40 bg-zinc-50 border dark:border-zinc-700/40 border-zinc-200">
            <div className="text-[10px] uppercase tracking-wider dark:text-zinc-500 text-zinc-400 mb-2 font-semibold">Sample Payload</div>
            <pre className="text-[11px] dark:text-zinc-400 text-zinc-600 font-mono leading-relaxed overflow-x-auto">{`{
  "event": "ip_drop",
  "ip": "192.168.1.42",
  "reason": "Quarantined by alpha-monitor",
  "action": "replace_ip",
  "timestamp": "2026-06-04T12:00:00Z",
  "source": "proxies_sx_alpha_monitor"
}`}</pre>
          </div>
        </div>
      </SectionCard>

      {/* ── API Credentials ──────────────────────────────────────────────── */}
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
              API key saved (ending in {config.apiKey.slice(-4)})
            </div>
          )}
          {config?.hasWebhookSecret && (
            <div className="flex items-center gap-2 text-[11px] text-emerald-500">
              <CheckCircle2 className="w-3.5 h-3.5" /> Webhook secret saved
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── Automation Rules ─────────────────────────────────────────────── */}
      <SectionCard
        icon={<Zap className="w-4 h-4" />}
        title="Automation Rules"
        subtitle="Control when the Alpha Monitor fires webhook commands automatically"
      >
        <div>
          <AutoToggle
            label="Auto-Replace on IP Drop"
            description="When a node goes offline, instantly POST a replace_ip command to your endpoint."
            checked={autoReplaceDrop}
            onChange={setAutoReplaceDrop}
          />
          <AutoToggle
            label="Auto-Replace on IP Abuse"
            description="When the monitor quarantines an IP, POST a quarantine command to lock it at the server level."
            checked={autoReplaceAbuse}
            onChange={setAutoReplaceAbuse}
          />
        </div>
      </SectionCard>

      {/* ── Slack Notifications ──────────────────────────────────────────── */}
      <SectionCard
        icon={<Slack className="w-4 h-4" />}
        title="Slack Alerts"
        subtitle="Ping your team instantly when a hot lead is detected"
      >
        <div className="space-y-4">
          <SecretInput
            label="Slack Incoming Webhook URL"
            value={slackUrl}
            onChange={setSlackUrl}
            placeholder={config?.hasSlack ? "Configured — paste new URL to update" : "https://hooks.slack.com/services/…"}
            description="Create an Incoming Webhook at api.slack.com/apps → Your App → Incoming Webhooks."
          />
          {config?.hasSlack && (
            <div className="flex items-center gap-2 text-[11px] text-emerald-500">
              <CheckCircle2 className="w-3.5 h-3.5" /> Slack webhook configured
            </div>
          )}
          <AutoToggle
            label="Alert on Hot leads"
            description="Fire a Slack message every time a 🔥 Hot lead is detected."
            checked={notifyOnHot}
            onChange={setNotifyOnHot}
          />
          <AutoToggle
            label="Alert on Warm leads"
            description="Fire a Slack message for 🌡️ Warm leads too (higher volume)."
            checked={notifyOnWarm}
            onChange={setNotifyOnWarm}
          />
          {config?.hasSlack && (
            <button
              onClick={handleTestSlack}
              disabled={testingSlack}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all
                dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-300 text-zinc-600
                dark:border dark:border-zinc-700 border border-zinc-200
                hover:dark:bg-zinc-700 hover:bg-zinc-200 disabled:opacity-40 active:scale-95"
            >
              {testingSlack ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {testingSlack ? "Sending…" : "Send Test Alert to Slack"}
            </button>
          )}
        </div>
      </SectionCard>

      {/* ── Discord Notifications ────────────────────────────────────────── */}
      <SectionCard
        icon={<MessageSquare className="w-4 h-4" />}
        title="Discord Alerts"
        subtitle="Post rich embeds to a Discord channel on every hot lead"
      >
        <div className="space-y-4">
          <SecretInput
            label="Discord Webhook URL"
            value={discordUrl}
            onChange={setDiscordUrl}
            placeholder={config?.hasDiscord ? "Configured — paste new URL to update" : "https://discord.com/api/webhooks/…"}
            description="In Discord: Channel Settings → Integrations → Create Webhook → Copy Webhook URL."
          />
          {config?.hasDiscord && (
            <div className="flex items-center gap-2 text-[11px] text-emerald-500">
              <CheckCircle2 className="w-3.5 h-3.5" /> Discord webhook configured
            </div>
          )}
          {config?.hasDiscord && (
            <button
              onClick={handleTestDiscord}
              disabled={testingDiscord}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all
                dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-300 text-zinc-600
                dark:border dark:border-zinc-700 border border-zinc-200
                hover:dark:bg-zinc-700 hover:bg-zinc-200 disabled:opacity-40 active:scale-95"
            >
              {testingDiscord ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {testingDiscord ? "Sending…" : "Send Test Alert to Discord"}
            </button>
          )}
        </div>
      </SectionCard>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-xs text-red-400 dark:bg-red-950/30 bg-red-50 border dark:border-red-900/40 border-red-200">
          <XCircle className="w-3.5 h-3.5 shrink-0" /> {error}
        </div>
      )}

      {/* Test result (node webhook) */}
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
            {testResult.ok ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
            <span><span className="font-semibold">Node webhook test {testResult.ok ? "passed" : "failed"}:</span> {testResult.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleTestNode}
          disabled={testing || !endpoint}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
            dark:bg-zinc-800 bg-zinc-100 dark:text-zinc-300 text-zinc-600
            dark:border dark:border-zinc-700 border border-zinc-200
            hover:dark:bg-zinc-700 hover:bg-zinc-200 disabled:opacity-40 active:scale-95"
        >
          {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {testing ? "Testing…" : "Test Node Webhook"}
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
            bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40 active:scale-[0.99]"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
          {saving ? "Saving…" : "Save All Settings"}
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
