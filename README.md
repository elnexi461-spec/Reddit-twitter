Proxies.sx Intel Engine & CRM
A lightweight, automated pipeline that scrapes high-intent proxy sales leads from Reddit and Hacker News in real time, scores them by urgency, and manages them through a simple built-in CRM dashboard.

Built completely with TypeScript, Express, and React.

Key Features

Real-Time Monitoring: Scrapes public streams on independent loops. If one loop slows down or hits an error, the rest of the app stays completely healthy.

Smart Deduplication: Cleans up text and strips formatting to catch identical cross-platform spam and reposts before they touch the feed.

Strict 2026 Filter: Automatically drops old archive threads so you only focus on active, current-year buyers.

Intent-Based Scoring: Processes titles and posts, automatically sorting them into Hot, Warm, or Cool categories so reps can target high-urgency issues immediately.

CRM Lead Claiming: Reps can click "Claim" to lock a lead. This prevents double-claiming and syncs with the server instantly.

1-Click CSV Export: A simple button in the header lets you grab a clean spreadsheet of all filtered leads for your sales pipeline.

Project Structure

/src/workers/ — Independent background scraping loops (Reddit & HN).

/src/store/ — Local state store handling text normalization, deduplication, 2026 gating, and rolling disk persistence.

/src/routes/ — Simple API endpoints for managing live state, claims, and streaming CSV downloads.

/src/components/ — Sleek, scannable React frontend dashboard matching a clean dark-mode aesthetic.

Tech Stack
Backend: Node.js, TypeScript, Express, Axios

Frontend: React, Tailwind CSS

Database: Native file system (fs) rolling JSON backup (No heavy DB dependencies required)
