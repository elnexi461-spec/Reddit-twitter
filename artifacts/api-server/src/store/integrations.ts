import fs from "fs";
import path from "path";
import axios from "axios";

const CONFIG_PATH = path.resolve(process.cwd(), "data", "integrations_config.json");

export interface IntegrationConfig {
  nodeManagementEndpoint: string;
  apiKey: string;
  webhookSecret: string;
  autoReplaceOnDrop: boolean;
  autoReplaceOnAbuse: boolean;
  slackWebhookUrl: string;
  discordWebhookUrl: string;
  notifyOnHot: boolean;
  notifyOnWarm: boolean;
  updatedAt: string;
}

const DEFAULTS: IntegrationConfig = {
  nodeManagementEndpoint: "",
  apiKey: "",
  webhookSecret: "",
  autoReplaceOnDrop: true,
  autoReplaceOnAbuse: true,
  slackWebhookUrl: "",
  discordWebhookUrl: "",
  notifyOnHot: true,
  notifyOnWarm: false,
  updatedAt: new Date().toISOString(),
};

let config: IntegrationConfig = { ...DEFAULTS };

function saveToDisk(): void {
  try {
    fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
  } catch (err) {
    console.error("[integrations] save failed:", (err as Error).message);
  }
}

export function loadIntegrations(): void {
  if (!fs.existsSync(CONFIG_PATH)) {
    config = { ...DEFAULTS };
    saveToDisk();
    return;
  }
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    config = { ...DEFAULTS, ...JSON.parse(raw) };
    console.log("[integrations] config loaded");
  } catch (err) {
    console.error("[integrations] parse failed, using defaults:", (err as Error).message);
    config = { ...DEFAULTS };
  }
}

export function getIntegrationConfig(): IntegrationConfig {
  return { ...config };
}

export function updateIntegrationConfig(patch: Partial<IntegrationConfig>): IntegrationConfig {
  config = { ...config, ...patch, updatedAt: new Date().toISOString() };
  saveToDisk();
  return { ...config };
}

// ─── Scraping Gateway Webhook Firing ─────────────────────────────────────────

export interface WebhookPayload {
  event: "gateway_error" | "antibot_block" | "session_offline" | "test";
  ip?: string;
  node?: string;
  reason?: string;
  action: "replace_session" | "quarantine" | "test";
  timestamp: string;
  source: "zenrows_intel_engine";
}

export async function fireWebhook(payload: WebhookPayload): Promise<{ ok: boolean; status?: number; error?: string }> {
  const cfg = getIntegrationConfig();

  if (!cfg.nodeManagementEndpoint) {
    return { ok: false, error: "No endpoint configured" };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Source": "zenrows-intel-engine",
  };

  if (cfg.apiKey) headers["Authorization"] = `Bearer ${cfg.apiKey}`;
  if (cfg.webhookSecret) headers["X-Webhook-Secret"] = cfg.webhookSecret;

  try {
    const res = await axios.post(cfg.nodeManagementEndpoint, payload, { headers, timeout: 8_000 });
    console.log(`[integrations] gateway webhook fired — event=${payload.event} status=${res.status}`);
    return { ok: true, status: res.status };
  } catch (err) {
    const msg = axios.isAxiosError(err)
      ? `HTTP ${err.response?.status ?? "network"} — ${err.message}`
      : (err as Error).message;
    console.error(`[integrations] gateway webhook failed — ${msg}`);
    return { ok: false, error: msg };
  }
}

export async function handleIpDrop(ip: string, reason: string): Promise<void> {
  const cfg = getIntegrationConfig();
  if (!cfg.autoReplaceOnDrop || !cfg.nodeManagementEndpoint) return;
  await fireWebhook({ event: "gateway_error", ip, reason, action: "replace_session", timestamp: new Date().toISOString(), source: "zenrows_intel_engine" });
}

export async function handleIpAbuse(ip: string, reason: string): Promise<void> {
  const cfg = getIntegrationConfig();
  if (!cfg.autoReplaceOnAbuse || !cfg.nodeManagementEndpoint) return;
  await fireWebhook({ event: "antibot_block", ip, reason, action: "quarantine", timestamp: new Date().toISOString(), source: "zenrows_intel_engine" });
}

// ─── Slack Notifications ─────────────────────────────────────────────────────

export interface LeadAlert {
  id: string;
  title: string;
  url: string;
  source: string;
  keyword: string;
  score: number;
  tier: "hot" | "warm" | "cool";
}

export async function notifySlack(lead: LeadAlert): Promise<void> {
  const cfg = getIntegrationConfig();
  if (!cfg.slackWebhookUrl) return;
  if (lead.tier === "hot" && !cfg.notifyOnHot) return;
  if (lead.tier === "warm" && !cfg.notifyOnWarm) return;

  const tierEmoji = lead.tier === "hot" ? "🔥" : "🌡️";
  const sourceLabel = lead.source === "reddit" ? "Reddit" : "Hacker News";

  const payload = {
    text: `${tierEmoji} *New ${lead.tier.toUpperCase()} developer lead detected — ZenRows Intel Engine*`,
    attachments: [
      {
        color: lead.tier === "hot" ? "#00ffb3" : "#f59e0b",
        title: lead.title.length > 100 ? lead.title.slice(0, 97) + "…" : lead.title,
        title_link: lead.url,
        fields: [
          { title: "Source",  value: sourceLabel,   short: true },
          { title: "Score",   value: `${lead.score}pts`, short: true },
          { title: "Keyword", value: `\`${lead.keyword}\``, short: true },
          { title: "Tier",    value: lead.tier.toUpperCase(), short: true },
        ],
        footer: "ZenRows Intel Engine",
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  try {
    await axios.post(cfg.slackWebhookUrl, payload, { timeout: 6_000 });
    console.log(`[integrations] slack notif sent — ${lead.tier} lead "${lead.title.slice(0, 40)}"`);
  } catch (err) {
    const msg = axios.isAxiosError(err) ? err.message : (err as Error).message;
    console.error(`[integrations] slack notif failed — ${msg}`);
  }
}

// ─── Discord Notifications ────────────────────────────────────────────────────

export async function notifyDiscord(lead: LeadAlert): Promise<void> {
  const cfg = getIntegrationConfig();
  if (!cfg.discordWebhookUrl) return;
  if (lead.tier === "hot" && !cfg.notifyOnHot) return;
  if (lead.tier === "warm" && !cfg.notifyOnWarm) return;

  const tierEmoji = lead.tier === "hot" ? "🔥" : "🌡️";
  const color = lead.tier === "hot" ? 0x00ffb3 : 0xf59e0b;
  const sourceLabel = lead.source === "reddit" ? "Reddit" : "Hacker News";

  const payload = {
    username: "ZenRows Intel Engine",
    avatar_url: "https://zenrows.com/favicon.ico",
    embeds: [
      {
        title: `${tierEmoji} New ${lead.tier.toUpperCase()} Developer Lead`,
        description: lead.title.length > 200 ? lead.title.slice(0, 197) + "…" : lead.title,
        url: lead.url,
        color,
        fields: [
          { name: "Source",  value: sourceLabel,         inline: true },
          { name: "Score",   value: `${lead.score}pts`,  inline: true },
          { name: "Keyword", value: `\`${lead.keyword}\``, inline: true },
        ],
        footer: { text: "ZenRows Intel Engine • zenrows.com" },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  try {
    await axios.post(cfg.discordWebhookUrl, payload, { timeout: 6_000 });
    console.log(`[integrations] discord notif sent — ${lead.tier} lead "${lead.title.slice(0, 40)}"`);
  } catch (err) {
    const msg = axios.isAxiosError(err) ? err.message : (err as Error).message;
    console.error(`[integrations] discord notif failed — ${msg}`);
  }
}
