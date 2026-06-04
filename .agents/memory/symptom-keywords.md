---
name: Symptom keywords for semantic scraping
description: The qualify.ts and keywords.ts now include proxy-need symptom keywords
---

Both qualify.ts (regex patterns) and keywords.ts (default keyword list) include 14+ symptom keywords that catch proxy-need signals WITHOUT the word "proxy":
- cloudflare turnstile, datadome, playwright timeout, puppeteer captcha
- blocked from website, access denied scraping, bypass turnstile
- 403 forbidden scraper, ip banned scraping, getting 429
- imperva bypass, perimeterx block, akamai bot detection, browser fingerprint detect

score.ts: all symptom keywords score 45 (HIGH_INTENT), same as best proxy-specific keywords.

**Why:** A user posting "cloudflare turnstile is blocking my scraper" IS a proxy buyer even if they don't use the word "proxy". Semantic scraping catches these high-intent signals.
