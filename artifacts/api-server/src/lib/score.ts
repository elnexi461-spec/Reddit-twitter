export type ScoreTier = "hot" | "warm" | "cool";

export interface ScoredLead {
  score: number;
  tier: ScoreTier;
}

const HIGH_INTENT_KEYWORDS = new Set([
  "residential ip",
  "getting blocked",
  "scraping blocked",
  "need proxies",
  "clean residential proxy",
]);

const MED_INTENT_KEYWORDS = new Set([
  "proxies",
  "sneaker proxy",
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
  "getting banned",
  "ip banned",
];

function keywordScore(keyword: string): number {
  const kw = keyword.toLowerCase();
  if (HIGH_INTENT_KEYWORDS.has(kw)) return 40;
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
