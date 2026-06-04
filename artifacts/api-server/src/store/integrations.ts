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
  updatedAt: string;
}

const DEFAULTS: IntegrationConfig = {
  nodeManagementEndpoint: "",
  apiKey: "",
  webhookSecret: "",
  autoReplaceOnDrop: true,
  autoReplaceOnAbuse: true,
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

// ─── Webhook Firing ──────────────────────────────────────────────────────────

export interface WebhookPayload {
  event: "ip_drop" | "ip_abuse" | "node_offline" | "test";
  ip?: string;
  node?: string;
  reason?: string;
  action: "replace_ip" | "quarantine" | "test";
  timestamp: string;
  source: "proxies_sx_sentinel";
}

/**
 * Fire a JSON webhook to the configured Proxies.sx node management endpoint.
 * Called automatically when the Sentinel detects an IP drop or abuse event.
 */
export async function fireWebhook(payload: WebhookPayload): Promise<{ ok: boolean; status?: number; error?: string }> {
  const cfg = getIntegrationConfig();

  if (!cfg.nodeManagementEndpoint) {
    return { ok: false, error: "No endpoint configured" };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Source": "proxies-sx-sentinel",
  };

  if (cfg.apiKey) {
    headers["Authorization"] = `Bearer ${cfg.apiKey}`;
  }

  if (cfg.webhookSecret) {
    headers["X-Webhook-Secret"] = cfg.webhookSecret;
  }

  try {
    const res = await axios.post(cfg.nodeManagementEndpoint, payload, {
      headers,
      timeout: 8_000,
    });
    console.log(`[integrations] webhook fired — event=${payload.event} status=${res.status}`);
    return { ok: true, status: res.status };
  } catch (err) {
    const msg = axios.isAxiosError(err)
      ? `HTTP ${err.response?.status ?? "network"} — ${err.message}`
      : (err as Error).message;
    console.error(`[integrations] webhook failed — ${msg}`);
    return { ok: false, error: msg };
  }
}

/**
 * Called by the Sentinel when an IP drop is detected.
 * Fires webhook only if autoReplaceOnDrop is enabled.
 */
export async function handleIpDrop(ip: string, reason: string): Promise<void> {
  const cfg = getIntegrationConfig();
  if (!cfg.autoReplaceOnDrop || !cfg.nodeManagementEndpoint) return;

  await fireWebhook({
    event: "ip_drop",
    ip,
    reason,
    action: "replace_ip",
    timestamp: new Date().toISOString(),
    source: "proxies_sx_sentinel",
  });
}

/**
 * Called by the Sentinel when IP abuse is detected.
 * Fires webhook only if autoReplaceOnAbuse is enabled.
 */
export async function handleIpAbuse(ip: string, reason: string): Promise<void> {
  const cfg = getIntegrationConfig();
  if (!cfg.autoReplaceOnAbuse || !cfg.nodeManagementEndpoint) return;

  await fireWebhook({
    event: "ip_abuse",
    ip,
    reason,
    action: "quarantine",
    timestamp: new Date().toISOString(),
    source: "proxies_sx_sentinel",
  });
}
