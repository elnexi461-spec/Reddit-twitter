---
name: Competitor Intercept architecture
description: How the competitor intercept feed is wired — separate store, worker, routes, and frontend from the main lead pipeline.
---

## Key files
- `src/lib/qualify-competitor.ts` — returns `CompetitorSignal` with field `competitor: Competitor`
- `src/store/competitor-leads.ts` — `PushCompetitorLeadArgs` has field `competitorMention: Competitor` (NOT `competitor`)
- `src/workers/competitor.ts` — must map `signal.competitor → competitorMention` explicitly; using `...signal` spread causes a TS error
- `src/routes/competitor-leads.ts` — all CRUD at `/api/competitor-leads/*`
- Dashboard: `useCompetitorLeads.ts`, `CompetitorFeed.tsx`, tab id = "intercept"

## API endpoint
GET `/api/competitor-leads` returns `CompetitorSnapshot` with: leads, totalLeads, velocity (last hour count), competitorTrend, sentimentBreakdown, hotCount

## Scoring
base = frustrationScore (0–100) + COMPETITOR_SCORE_BOOST (Bright Data=35, Oxylabs=30, ScraperAPI=28, Crawlbase=22, Webshare=20) + priceBoost (15 if priceComplaint). Capped at 100.

**Why:** Competitors have different market share and switching friction, so leads mentioning Bright Data are inherently higher-value migration opportunities.

## Settings save/edit
Engine Preferences section uses edit/save pattern with localStorage key `zenrows_intel_engine_prefs`. Prefs are local-only (not synced to API server — server sliders are purely UI preference state).
