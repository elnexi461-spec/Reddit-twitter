# ZenRows Intel Engine & CRM

An automated B2B lead generation and CRM pipeline that monitors Reddit and Hacker News for frustrated developers hitting anti-bot walls, Cloudflare blocks, Playwright failures, and scraping bans — and surfaces them to ZenRows sales reps in real time.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: File-system rolling JSON (no heavy DB)
- Validation: Zod (`zod/v4`)
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- Theme/colors: `artifacts/dashboard/src/index.css` (ZenRows mint-teal CSS variables)
- Semantic filter: `artifacts/api-server/src/lib/qualify.ts`
- Intent scoring: `artifacts/api-server/src/lib/score.ts`
- Target keywords: `artifacts/api-server/src/store/keywords.ts`
- Integrations/webhooks: `artifacts/api-server/src/store/integrations.ts`
- Sentinel monitor: `artifacts/dashboard/src/components/tabs/SentinelMonitor.tsx`
- Branding/nav: `artifacts/dashboard/src/pages/dashboard.tsx`
- Splash screen: `artifacts/dashboard/src/components/SplashScreen.tsx`

## Architecture decisions

- File-system JSON store chosen over PostgreSQL for zero-dependency deployment and instant rollback via file backup.
- Scraping workers run on independent loops — one failure never blocks the others.
- Semantic qualify gate runs before scoring to hard-reject noise; intent scoring only runs on qualified posts.
- ZenRows brand palette: primary `#00FFB3` (mint-teal) on deep slate `#0F172A` backgrounds.
- Webhook source identifier is `zenrows_intel_engine` across all payloads.

## Product

ZenRows Intel Engine autonomously captures developers publicly expressing frustration with Cloudflare Turnstile, DataDome, PerimeterX, Playwright timeouts, 403 blocks, and similar anti-bot pain — then routes them into a ZenRows CRM pipeline for immediate outreach.

## User preferences

- Brand name: ZenRows Intel Engine
- Primary accent color: mint-teal (#00FFB3 / #00FFB3 family)
- Background: deep slate dark mode (#0F172A / #1E293B)
- Do not alter the login/password-gate security layer

## Gotchas

- Delete `data/keywords_backup.json` to reset keyword list to ZenRows defaults on next server start.
- The `twitter` worker actually polls Hacker News (HN Algolia API) — the filename is a legacy alias.
- Webhook `source` field must stay as `zenrows_intel_engine` for downstream payload parsing.
