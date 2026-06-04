---
name: Integrations store pattern
description: How the integrations/webhook config is stored and served
---

Config stored at `artifacts/api-server/data/integrations_config.json`.
Store: `src/store/integrations.ts` — exports loadIntegrations(), getIntegrationConfig(), updateIntegrationConfig(), fireWebhook(), handleIpDrop(), handleIpAbuse().
Routes: `src/routes/integrations.ts` — GET/POST /api/integrations/config, POST /api/integrations/test.
Loaded in `src/index.ts` after loadKeywords().
Frontend hook: `artifacts/dashboard/src/hooks/useIntegrations.ts` — uses root-relative /api/... URLs (same pattern as useLeads.ts).

**Why:** Webhook config needs to be persisted across restarts; JSON file store matches the existing keywords/leads pattern.
