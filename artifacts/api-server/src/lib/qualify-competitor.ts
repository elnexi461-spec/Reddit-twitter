/**
 * qualify-competitor.ts — Competitor intercept qualifier for ZenRows Intel Engine.
 *
 * A post qualifies as a competitor intercept only when it BOTH:
 *   1. Mentions one of the five target competitors
 *   2. Shows negative sentiment / technical frustration / switching intent
 *
 * This prevents capturing happy customers or neutral blog mentions.
 */

// ─── Target competitors ───────────────────────────────────────────────────────

export type Competitor =
  | "Bright Data"
  | "Oxylabs"
  | "ScraperAPI"
  | "Crawlbase"
  | "Webshare";

interface CompetitorMatch {
  competitor: Competitor;
  patterns: RegExp[];
}

const COMPETITOR_PATTERNS: CompetitorMatch[] = [
  {
    competitor: "Bright Data",
    patterns: [
      /bright[\s\-]?data/i,
      /brightdata/i,
      /luminati[\s\-]?networks?/i, // legacy brand name
    ],
  },
  {
    competitor: "Oxylabs",
    patterns: [/oxylabs/i, /oxy[\s\-]?labs/i],
  },
  {
    competitor: "ScraperAPI",
    patterns: [/scraper[\s\-]?api/i, /scraperapi\.com/i],
  },
  {
    competitor: "Crawlbase",
    patterns: [/crawlbase/i, /proxycrawl/i], // ProxyCrawl rebranded to Crawlbase
  },
  {
    competitor: "Webshare",
    patterns: [/webshare/i, /webshare\.io/i],
  },
];

// ─── Negative sentiment / frustration / switching signals ─────────────────────
// The post must contain at least one of these to qualify — prevents capturing
// neutral or positive competitor mentions.

const FRUSTRATION_SIGNALS: RegExp[] = [
  // Direct failure complaints
  /\b(broken|doesn'?t work|not working|stopped working|fails?|failing|failed)\b/i,
  /\b(broken|useless|garbage|trash|junk|terrible|horrible|awful)\b/i,
  /\b(waste of money|overpriced|too expensive|ripoff|rip.?off|not worth)\b/i,

  // Technical frustration
  /\b(block(ed|ing)|detected?|banned?|captcha|403|429|timeout|latency|slow)\b/i,
  /\b(not bypass(ing)?|can'?t bypass|bypass (fail|not work))/i,
  /\b(fingerprint(ed|ing)?|detected? as bot|flagged as bot)/i,
  /\b(residential (ip|proxy) not working|rotating (fail|broken|issue))\b/i,
  /\b(playwright (fail|block|detect|timeout)|puppeteer (block|detect|fail))\b/i,

  // Switching / churning intent
  /\b(switching (from|away)|leaving|moving away|cancell?ing|cancel(led)?|ditching)\b/i,
  /\b(looking for (alternative|replacement|better option|something else))\b/i,
  /\b(alternative to|replace[sd]? (by|with)|switch to|moved (to|from))\b/i,
  /\b(anyone (else|know|tried)|should i switch|worth switching|migrat(e|ing|ion))\b/i,
  /\b(recommend(ation)?|suggest|better (option|service|api|tool)|what do you use)\b/i,

  // Pricing frustration
  /\b(too expensive|pricing (bad|terrible|outrageous|crazy|insane)|can'?t afford)\b/i,
  /\b(cost(s|ing)? (too much|a lot|fortune)|budget|cheap(er)?|affordable)\b/i,
  /\b(seat[\s\-]based pricing|per[\s\-]seat|monthly (minimum|commitment|fee))\b/i,
  /\b(bandwidth (cap|limit|throttl)|quota|credit(s)? (ran out|depleted|empty))\b/i,

  // Customer support frustration
  /\b(support (sucks?|terrible|unresponsive|slow|useless|no response))\b/i,
  /\b(no response|ticket (ignored|open for|sitting|pending))\b/i,

  // Reliability complaints
  /\b(downtime|unreliable|inconsistent|flaky|unstable)\b/i,
  /\b(success rate (low|dropping|terrible|0%|bad))\b/i,
  /\b(ip(s)? (keep|getting) (ban(ned)?|block(ed)?))\b/i,

  // General negative framing
  /\b(frustrated|fed up|sick of|annoyed|disappointed|regret(ting)?)\b/i,
  /\b(worst|never again|don'?t (use|recommend)|avoid|scam)\b/i,
  /\b(issue|problem|bug|error|complaint|rant)\b/i,
];

// ─── Frustration intensity scoring ────────────────────────────────────────────
// Each matched signal adds points; score drives the sentiment label

const EXTREME_SIGNALS: RegExp[] = [
  /\b(cancel(led|ing)|switching (from|away)|looking for alternative|leaving)\b/i,
  /\b(terrible|horrible|garbage|trash|worst|scam|ripoff|never again)\b/i,
  /\b(doesn'?t work|completely broken|totally useless|0% success)\b/i,
  /\b(frustrated|fed up|sick of|done with)\b/i,
];

export type SentimentLabel = "extreme_churn_risk" | "high_priority_migration" | "migration_potential";

// ─── Language detection ───────────────────────────────────────────────────────

const LANG_PATTERNS: { lang: string; re: RegExp }[] = [
  { lang: "Python",     re: /\b(python|scrapy|requests|beautifulsoup|httpx|aiohttp|bs4|selenium)\b/i },
  { lang: "Node.js",    re: /\b(node(\.js)?|puppeteer|playwright|axios|cheerio|typescript|javascript)\b/i },
  { lang: "Go",         re: /\b(golang?|colly|chromedp|go[\s\-]?http)\b/i },
  { lang: "PHP",        re: /\b(php|guzzle|laravel|curl)\b/i },
  { lang: "Ruby",       re: /\b(ruby|nokogiri|mechanize|watir)\b/i },
  { lang: "Java",       re: /\b(java|spring|jsoup|htmlunit)\b/i },
  { lang: "C#",         re: /\b(c#|\.net|dotnet|htmlagilitypack)\b/i },
];

export function detectLanguage(text: string): string | undefined {
  for (const { lang, re } of LANG_PATTERNS) {
    if (re.test(text)) return lang;
  }
  return undefined;
}

// ─── Price complaint detection ────────────────────────────────────────────────

const PRICE_SIGNALS: RegExp[] = [
  /\b(too expensive|pricing (bad|terrible|outrageous|crazy|insane|high)|can'?t afford)\b/i,
  /\b(cost(s|ing)? (too much|a lot|fortune)|overpriced|ripoff|rip.?off)\b/i,
  /\b(budget|cheap(er)?|affordable|pay.per.gb|seat.based|per.seat)\b/i,
  /\b(bandwidth (cap|limit|throttl)|quota|credit(s)? (ran out|depleted|empty))\b/i,
];

export function hasPriceComplaint(text: string): boolean {
  return PRICE_SIGNALS.some((re) => re.test(text));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface CompetitorSignal {
  competitor: Competitor;
  frustrationScore: number;
  sentimentLabel: SentimentLabel;
  detectedLanguage?: string;
  priceComplaint: boolean;
}

/**
 * Returns a CompetitorSignal if the post mentions a target competitor with
 * negative sentiment, or null if it doesn't qualify.
 */
export function qualifyCompetitorPost(
  title: string,
  body: string
): CompetitorSignal | null {
  const combined = `${title} ${body}`;

  // Step 1: find competitor mention
  let foundCompetitor: Competitor | null = null;
  for (const { competitor, patterns } of COMPETITOR_PATTERNS) {
    if (patterns.some((re) => re.test(combined))) {
      foundCompetitor = competitor;
      break;
    }
  }
  if (!foundCompetitor) return null;

  // Step 2: check frustration signals
  const matchedSignals = FRUSTRATION_SIGNALS.filter((re) => re.test(combined));
  if (matchedSignals.length === 0) return null;

  // Step 3: score frustration intensity
  const extremeMatches = EXTREME_SIGNALS.filter((re) => re.test(combined)).length;
  const baseScore = Math.min(100, matchedSignals.length * 12 + extremeMatches * 20);

  const sentimentLabel: SentimentLabel =
    baseScore >= 70 ? "extreme_churn_risk"
    : baseScore >= 40 ? "high_priority_migration"
    : "migration_potential";

  return {
    competitor: foundCompetitor,
    frustrationScore: baseScore,
    sentimentLabel,
    detectedLanguage: detectLanguage(combined),
    priceComplaint: hasPriceComplaint(combined),
  };
}
