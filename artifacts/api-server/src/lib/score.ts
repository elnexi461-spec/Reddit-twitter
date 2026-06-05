export type ScoreTier = "hot" | "warm" | "cool";

export interface ScoredLead {
  score: number;
  tier: ScoreTier;
}

// Highest-intent signals: developer is actively blocked RIGHT NOW — needs ZenRows immediately
const HIGH_INTENT_KEYWORDS = new Set([
  // Anti-bot system failures
  "cloudflare turnstile",
  "bypass turnstile",
  "datadome",
  "perimeterx block",
  "akamai bot detection",
  "imperva bypass",
  // Headless browser failures
  "playwright timeout",
  "puppeteer captcha",
  "puppeteer target closed",
  "headless browser detected",
  "browser fingerprint detect",
  // Access blocks
  "403 forbidden scraper",
  "getting 403",
  "getting 429",
  "blocked from website",
  "access denied scraping",
  // Scraping API pain
  "scraping blocked",
  "getting blocked",
  "ip banned scraping",
  "web scraper blocked",
  "scraping api failing",
]);

const MED_INTENT_KEYWORDS = new Set([
  "proxies",
  "proxy",
  "residential ip",
  "scraping api",
  "web scraping",
  "anti-bot",
  "antibot",
  "clean residential proxy",
]);

const INTENT_WORDS = [
  "need",
  "looking for",
  "looking",
  "want",
  "hire",
  "hiring",
  "buy",
  "help",
  "urgent",
  "asap",
  "recommend",
  "recommendation",
  "best",
  "cheapest",
  "alternative",
  "broken",
  "blocked",
  "can't",
  "cannot",
  "issue",
  "problem",
  "failing",
  "stuck",
  "trying",
  "question",
  "does anyone",
  "anyone know",
  "anyone have",
  "where can",
  "how do",
  "bypass",
  "evade",
  "getting 403",
  "getting 429",
  "getting banned",
  "ip banned",
  // ZenRows pain-point signals
  "turnstile",
  "datadome",
  "playwright",
  "puppeteer",
  "headless",
  "fingerprint",
  "access denied",
  "timeout",
  "captcha",
  "anti-bot",
  "cloudflare",
  "perimeterx",
  "akamai",
  "imperva",
  "forbidden",
  "rate limit",
];

function keywordScore(keyword: string): number {
  const kw = keyword.toLowerCase();
  if (HIGH_INTENT_KEYWORDS.has(kw)) return 45;
  if (MED_INTENT_KEYWORDS.has(kw)) return 25;
  return 10;
}

function sourceScore(source: string): number {
  if (source === "reddit") return 20;
  if (source === "HN") return 15;
  return 10;
}

function titleScore(title: string): number {
  const lower = title.toLowerCase();
  let pts = 0;
  for (const word of INTENT_WORDS) {
    if (lower.includes(word)) {
      pts += 5;
      if (pts >= 25) break;
    }
  }
  return pts;
}

export function scoreLead(
  keyword: string,
  source: string,
  title: string
): ScoredLead {
  const raw = Math.min(
    100,
    keywordScore(keyword) + sourceScore(source) + titleScore(title)
  );

  const tier: ScoreTier =
    raw >= 65 ? "hot" : raw >= 35 ? "warm" : "cool";

  return { score: raw, tier };
}
