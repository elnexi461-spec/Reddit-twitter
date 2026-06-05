ZENROWS INTEL ENGINE & CRM

An automated, real-time lead generation pipeline that monitors Reddit and Hacker News for frustrated developers hitting anti-bot walls, scraping blocks, and CAPTCHA failures — and funnels them directly into a ZenRows sales CRM.

Built entirely with TypeScript, Express, and React.

KEY FEATURES

Real-Time Developer Signal Monitoring: Independent scraping loops watch public communities for Cloudflare Turnstile blocks, Playwright timeouts, DataDome challenges, 403 Forbidden errors, and other pain points that ZenRows solves directly.

Semantic Intent Scoring: Posts are automatically classified as Hot, Warm, or Cool based on urgency signals — a developer hitting a Puppeteer block right now scores maximum intent.

Smart Deduplication: Normalises text and strips formatting to eliminate cross-platform reposts before they enter the feed.

Strict 2026 Filter: Drops stale archive threads — only active, current-year developer pain enters the pipeline.

CRM Lead Claiming: Reps click "Claim" to lock a lead instantly, preventing double-handling and syncing status to the server in real time.

Pipeline Management: Track leads through Unclaimed → Contacted → Qualified → Converted stages with a visual board view.

1-Click CSV Export: Export a clean spreadsheet of all filtered leads for downstream sales tooling.

ZenRows API Gateway Monitor: Live sentinel dashboard showing Anti-Bot Success Rate, Scraping API Gateway Latency, Anti-Bot Circuit Breaker status, and Residential Pool Rotation health — all updating every 2 seconds.

Slack & Discord Alerts: Instant webhook notifications on every hot lead detected, with full lead metadata in the payload.

PROJECT STRUCTURE

/src/workers/ — Independent background loops (Reddit & Hacker News) targeting ZenRows-relevant developer pain keywords.

/src/store/ — Local state store with text normalisation, deduplication, 2026 gating, and rolling disk persistence.

/src/lib/qualify.ts — Semantic filtering engine: classifies posts by Cloudflare, PerimeterX, Akamai, DataDome, headless browser, and scraping block signals.

/src/lib/score.ts — Intent scoring: Hot/Warm/Cool tiering based on anti-bot system mentions and urgency language.

/src/routes/ — REST API endpoints for lead management, keyword control, integrations config, and CSV export.

/src/components/ — React CRM dashboard with dark-mode ZenRows branding, live feed, pipeline board, analytics, and sentinel monitor.

TECH STACK

Backend: Node.js, TypeScript, Express, Axios

Frontend: React 19, Tailwind CSS 4 (ZenRows mint-teal theme), Framer Motion

Database: Native file system (fs) rolling JSON backup — no heavy DB dependency

HOW IT WORKS

The engine monitors developer communities for exact pain points: a developer complaining that "Playwright keeps timing out on Cloudflare" or "getting 403 on every scraping request" is a live ZenRows buyer. The semantic engine captures them, scores their urgency, and surfaces them to the sales team in real time — before they find a competitor.
