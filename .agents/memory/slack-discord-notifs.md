---
name: Slack/Discord notification pattern
description: How hot/warm lead alerts are fired to Slack and Discord
---

Both `notifySlack(lead)` and `notifyDiscord(lead)` are in `artifacts/api-server/src/store/integrations.ts`.
They are called non-blocking (`.catch(()=>{})`) from `pushLead()` in `store/leads.ts` on every hot or warm lead.
Config flags `notifyOnHot` (default true) and `notifyOnWarm` (default false) gate which tiers trigger notifications.
URLs stored as `slackWebhookUrl` / `discordWebhookUrl` in `data/integrations_config.json`.

**Test endpoints:** POST `/api/integrations/test-slack` and `/api/integrations/test-discord` send a test embed.
**Frontend:** `Integrations.tsx` has SecretInput fields + AutoToggles + "Send Test Alert" buttons for each.

**TypeScript quirk:** When spreading `SENTINEL_EVENTS` objects in Notifications.tsx, the `type` field is widened to `string`. Must use `as NotifEvent` or `as const` on the `type` property to satisfy the union `"lead" | "sentinel" | "heal" | "kill" | "warn"`.

**Why:** Real-time Slack/Discord pings on hot leads let sales teams respond immediately without checking the dashboard.
