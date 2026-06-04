import { Router } from "express";
import {
  getIntegrationConfig,
  updateIntegrationConfig,
  fireWebhook,
} from "../store/integrations.js";

const router = Router();

// GET /api/integrations/config
router.get("/integrations/config", (_req, res) => {
  const cfg = getIntegrationConfig();
  // Mask the API key and secret in the response for security
  res.json({
    ...cfg,
    apiKey: cfg.apiKey ? "••••••••" + cfg.apiKey.slice(-4) : "",
    webhookSecret: cfg.webhookSecret ? "••••••••" : "",
    hasApiKey: !!cfg.apiKey,
    hasWebhookSecret: !!cfg.webhookSecret,
  });
});

// POST /api/integrations/config
router.post("/integrations/config", (req, res) => {
  const { nodeManagementEndpoint, apiKey, webhookSecret, autoReplaceOnDrop, autoReplaceOnAbuse } = req.body;

  const patch: Record<string, unknown> = {};

  if (nodeManagementEndpoint !== undefined) {
    patch.nodeManagementEndpoint = String(nodeManagementEndpoint).trim();
  }
  if (apiKey !== undefined && apiKey !== "••••••••" + "") {
    // Only update if not the masked placeholder
    if (!String(apiKey).startsWith("••••••••")) {
      patch.apiKey = String(apiKey).trim();
    }
  }
  if (webhookSecret !== undefined) {
    if (!String(webhookSecret).startsWith("••••••••")) {
      patch.webhookSecret = String(webhookSecret).trim();
    }
  }
  if (autoReplaceOnDrop !== undefined) patch.autoReplaceOnDrop = Boolean(autoReplaceOnDrop);
  if (autoReplaceOnAbuse !== undefined) patch.autoReplaceOnAbuse = Boolean(autoReplaceOnAbuse);

  const updated = updateIntegrationConfig(patch);

  res.json({
    ok: true,
    config: {
      ...updated,
      apiKey: updated.apiKey ? "••••••••" + updated.apiKey.slice(-4) : "",
      webhookSecret: updated.webhookSecret ? "••••••••" : "",
      hasApiKey: !!updated.apiKey,
      hasWebhookSecret: !!updated.webhookSecret,
    },
  });
});

// POST /api/integrations/test
// Fires a test webhook to verify the endpoint is reachable
router.post("/integrations/test", async (_req, res) => {
  const result = await fireWebhook({
    event: "test",
    action: "test",
    reason: "Test connection from Proxies.sx Sentinel Dashboard",
    timestamp: new Date().toISOString(),
    source: "proxies_sx_sentinel",
  });

  res.status(result.ok ? 200 : 502).json(result);
});

export default router;
