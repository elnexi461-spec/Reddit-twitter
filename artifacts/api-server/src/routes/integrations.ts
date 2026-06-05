import { Router } from "express";
import {
  getIntegrationConfig,
  updateIntegrationConfig,
  fireWebhook,
  notifySlack,
  notifyDiscord,
} from "../store/integrations.js";

const router = Router();

// GET /api/integrations/config
router.get("/integrations/config", (_req, res) => {
  const cfg = getIntegrationConfig();
  res.json({
    ...cfg,
    apiKey: cfg.apiKey ? "••••••••" + cfg.apiKey.slice(-4) : "",
    webhookSecret: cfg.webhookSecret ? "••••••••" : "",
    hasApiKey: !!cfg.apiKey,
    hasWebhookSecret: !!cfg.webhookSecret,
    hasSlack: !!cfg.slackWebhookUrl,
    hasDiscord: !!cfg.discordWebhookUrl,
    // Mask the actual URLs after save
    slackWebhookUrl: cfg.slackWebhookUrl
      ? cfg.slackWebhookUrl.slice(0, 30) + "…"
      : "",
    discordWebhookUrl: cfg.discordWebhookUrl
      ? cfg.discordWebhookUrl.slice(0, 30) + "…"
      : "",
  });
});

// POST /api/integrations/config
router.post("/integrations/config", (req, res) => {
  const {
    nodeManagementEndpoint, apiKey, webhookSecret,
    autoReplaceOnDrop, autoReplaceOnAbuse,
    slackWebhookUrl, discordWebhookUrl,
    notifyOnHot, notifyOnWarm,
  } = req.body;

  const patch: Record<string, unknown> = {};

  if (nodeManagementEndpoint !== undefined) patch.nodeManagementEndpoint = String(nodeManagementEndpoint).trim();
  if (apiKey !== undefined && !String(apiKey).startsWith("••••••••")) patch.apiKey = String(apiKey).trim();
  if (webhookSecret !== undefined && !String(webhookSecret).startsWith("••••••••")) patch.webhookSecret = String(webhookSecret).trim();
  if (autoReplaceOnDrop !== undefined) patch.autoReplaceOnDrop = Boolean(autoReplaceOnDrop);
  if (autoReplaceOnAbuse !== undefined) patch.autoReplaceOnAbuse = Boolean(autoReplaceOnAbuse);
  // Slack/Discord: only update if it's a full URL (not the truncated display value)
  if (slackWebhookUrl !== undefined && !String(slackWebhookUrl).endsWith("…")) {
    patch.slackWebhookUrl = String(slackWebhookUrl).trim();
  }
  if (discordWebhookUrl !== undefined && !String(discordWebhookUrl).endsWith("…")) {
    patch.discordWebhookUrl = String(discordWebhookUrl).trim();
  }
  if (notifyOnHot !== undefined) patch.notifyOnHot = Boolean(notifyOnHot);
  if (notifyOnWarm !== undefined) patch.notifyOnWarm = Boolean(notifyOnWarm);

  const updated = updateIntegrationConfig(patch);

  res.json({
    ok: true,
    config: {
      ...updated,
      apiKey: updated.apiKey ? "••••••••" + updated.apiKey.slice(-4) : "",
      webhookSecret: updated.webhookSecret ? "••••••••" : "",
      hasApiKey: !!updated.apiKey,
      hasWebhookSecret: !!updated.webhookSecret,
      hasSlack: !!updated.slackWebhookUrl,
      hasDiscord: !!updated.discordWebhookUrl,
      slackWebhookUrl: updated.slackWebhookUrl ? updated.slackWebhookUrl.slice(0, 30) + "…" : "",
      discordWebhookUrl: updated.discordWebhookUrl ? updated.discordWebhookUrl.slice(0, 30) + "…" : "",
    },
  });
});

// POST /api/integrations/test — test node management webhook
router.post("/integrations/test", async (_req, res) => {
  const result = await fireWebhook({
    event: "test",
    action: "test",
    reason: "Test connection from ZenRows Intel Engine Dashboard",
    timestamp: new Date().toISOString(),
    source: "zenrows_intel_engine",
  });
  res.status(result.ok ? 200 : 502).json(result);
});

// POST /api/integrations/test-slack — send a test Slack notification
router.post("/integrations/test-slack", async (_req, res) => {
  const cfg = getIntegrationConfig();
  if (!cfg.slackWebhookUrl) {
    res.status(400).json({ ok: false, error: "No Slack webhook URL configured" });
    return;
  }
  try {
    await notifySlack({
      id: "test",
      title: "Test alert from ZenRows Intel Engine — your Slack integration is live!",
      url: "https://zenrows.com",
      source: "reddit",
      keyword: "test",
      score: 99,
      tier: "hot",
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(502).json({ ok: false, error: (err as Error).message });
  }
});

// POST /api/integrations/test-discord — send a test Discord notification
router.post("/integrations/test-discord", async (_req, res) => {
  const cfg = getIntegrationConfig();
  if (!cfg.discordWebhookUrl) {
    res.status(400).json({ ok: false, error: "No Discord webhook URL configured" });
    return;
  }
  try {
    await notifyDiscord({
      id: "test",
      title: "Test alert from ZenRows Intel Engine — your Discord integration is live!",
      url: "https://zenrows.com",
      source: "HN",
      keyword: "test",
      score: 99,
      tier: "hot",
    });
    res.json({ ok: true });
  } catch (err) {
    res.status(502).json({ ok: false, error: (err as Error).message });
  }
});

export default router;
