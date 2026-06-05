import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const BACKUP_PATH = path.resolve(process.cwd(), "data", "keywords_backup.json");

export type KeywordSource = "reddit" | "twitter" | "both";

export interface Keyword {
  id: string;
  term: string;
  source: KeywordSource;
  enabled: boolean;
  createdAt: string;
}

// ─── ZenRows Semantic Target Keywords ────────────────────────────────────────
// These target the exact developer pain points that ZenRows solves:
// Cloudflare bypasses, anti-bot evasion, headless browser detection,
// CAPTCHA failures, 403/429 blocks, and scraping API frustrations.
const DEFAULTS: Omit<Keyword, "id" | "createdAt">[] = [
  // --- Anti-bot system failures (highest intent) ---
  { term: "cloudflare turnstile",       source: "both",    enabled: true },
  { term: "bypass turnstile",           source: "both",    enabled: true },
  { term: "datadome",                   source: "both",    enabled: true },
  { term: "perimeterx block",           source: "both",    enabled: true },
  { term: "akamai bot detection",       source: "both",    enabled: true },
  { term: "imperva bypass",             source: "both",    enabled: true },

  // --- Headless browser / automation detection ---
  { term: "playwright timeout",         source: "both",    enabled: true },
  { term: "puppeteer captcha",          source: "both",    enabled: true },
  { term: "puppeteer target closed",    source: "both",    enabled: true },
  { term: "headless browser detected",  source: "both",    enabled: true },
  { term: "browser fingerprint detect", source: "both",    enabled: true },

  // --- HTTP error blocks ---
  { term: "403 forbidden scraper",      source: "both",    enabled: true },
  { term: "getting 429",                source: "both",    enabled: true },
  { term: "access denied scraping",     source: "both",    enabled: true },
  { term: "blocked from website",       source: "both",    enabled: true },
  { term: "ip banned scraping",         source: "both",    enabled: true },

  // --- General scraping blocks ---
  { term: "scraping blocked",           source: "reddit",  enabled: true },
  { term: "getting blocked",            source: "reddit",  enabled: true },
  { term: "web scraper blocked",        source: "both",    enabled: true },
  { term: "scraping api failing",       source: "both",    enabled: true },

  // --- Residential / proxy (common symptom pairing) ---
  { term: "residential ip",             source: "reddit",  enabled: true },
  { term: "proxy",                      source: "reddit",  enabled: true },
  { term: "proxies",                    source: "reddit",  enabled: true },
  { term: "clean residential proxy",    source: "twitter", enabled: true },
];

let keywords: Keyword[] = [];

function saveToDisk(): void {
  try {
    fs.mkdirSync(path.dirname(BACKUP_PATH), { recursive: true });
    fs.writeFileSync(BACKUP_PATH, JSON.stringify(keywords), "utf8");
  } catch (err) {
    console.error("[keywords] save failed:", (err as Error).message);
  }
}

function makeDefaults(): Keyword[] {
  const now = new Date().toISOString();
  return DEFAULTS.map((d) => ({ ...d, id: randomUUID(), createdAt: now }));
}

export function loadKeywords(): void {
  if (!fs.existsSync(BACKUP_PATH)) {
    keywords = makeDefaults();
    saveToDisk();
    console.log(`[keywords] initialized ${keywords.length} ZenRows target keywords`);
    return;
  }

  try {
    const raw = fs.readFileSync(BACKUP_PATH, "utf8");
    const parsed: Keyword[] = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      keywords = parsed;
      const existingTerms = new Set(keywords.map((k) => k.term));
      const newDefaults = makeDefaults().filter((d) => !existingTerms.has(d.term));
      if (newDefaults.length > 0) {
        keywords.push(...newDefaults);
        saveToDisk();
        console.log(`[keywords] merged ${newDefaults.length} new ZenRows target keywords`);
      }
      console.log(`[keywords] restored ${keywords.length} keywords from disk`);
      return;
    }
  } catch (err) {
    console.error("[keywords] backup parse failed, using defaults:", (err as Error).message);
  }

  keywords = makeDefaults();
  saveToDisk();
}

export function getKeywords(): Keyword[] {
  return keywords.slice();
}

export function getRedditKeywords(): string[] {
  return keywords
    .filter((k) => k.enabled && (k.source === "reddit" || k.source === "both"))
    .map((k) => k.term);
}

export function getTwitterKeywords(): string[] {
  return keywords
    .filter((k) => k.enabled && (k.source === "twitter" || k.source === "both"))
    .map((k) => k.term);
}

export function addKeyword(term: string, source: KeywordSource): Keyword {
  const kw: Keyword = {
    id: randomUUID(),
    term: term.trim().toLowerCase(),
    source,
    enabled: true,
    createdAt: new Date().toISOString(),
  };
  keywords.push(kw);
  saveToDisk();
  return kw;
}

export function updateKeyword(
  id: string,
  patch: Partial<Pick<Keyword, "enabled" | "term" | "source">>
): Keyword | null {
  const kw = keywords.find((k) => k.id === id);
  if (!kw) return null;
  if (patch.enabled !== undefined) kw.enabled = patch.enabled;
  if (patch.term !== undefined) kw.term = patch.term.trim().toLowerCase();
  if (patch.source !== undefined) kw.source = patch.source;
  saveToDisk();
  return { ...kw };
}

export function deleteKeyword(id: string): boolean {
  const idx = keywords.findIndex((k) => k.id === id);
  if (idx === -1) return false;
  keywords.splice(idx, 1);
  saveToDisk();
  return true;
}
