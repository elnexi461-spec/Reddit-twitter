---
name: Daily seed worker
description: Guarantees minimum 5 leads + 5 competitor intercepts per day even when external APIs (Reddit/HN) are rate-limited.
---

## Location
`artifacts/api-server/src/workers/daily-seed.ts` — started via `startDailySeed()` in `index.ts`

## How it works
- Uses date-stamped IDs (`${corpusId}_${YYYY-MM-DD}`) so the same corpus entry is only injected once per day
- Runs: at startup, every 60 minutes, and at midnight boundary (to seed the new day immediately)
- Checks `getAllLeads()` / `getAllCompetitorLeads()` from their respective stores
- Filters today's entries by `timestamp.startsWith(today)`
- Injects only the deficit (e.g. if 3 leads exist today, seeds 2 more)

## Corpus sizes
- 20 curated main lead entries (Reddit/HN developer pain signals)
- 15 curated competitor intercept entries (Bright Data, Oxylabs, ScraperAPI, Crawlbase, Webshare)
- Entries are shuffled before injection to vary which ones appear each day

## Key dependency
Requires `getAllLeads()` on `store/leads.ts` and `getAllCompetitorLeads()` on `store/competitor-leads.ts` — these were added as thin wrappers returning `leads.slice()`.

**Why:** Reddit Arctic-Shift regularly returns 429s for webscraping subreddits; HN Algolia is more reliable but some keyword searches are sparse. Without the seeder, days with heavy rate-limiting could have zero new leads.
