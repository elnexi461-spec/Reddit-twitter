import axios from "axios";
import { pushLead, setWorkerStatus } from "../store/leads.js";
import { getTwitterKeywords } from "../store/keywords.js";
import { qualifyPost } from "../lib/qualify.js";

const HN_SEARCH_BY_DATE = "https://hn.algolia.com/api/v1/search_by_date";
const HN_SEARCH = "https://hn.algolia.com/api/v1/search";
const POLL_INTERVAL_MS = 2 * 60 * 1000; // poll every 2 minutes
const HITS_PER_PAGE = 50;

interface HNHit {
  objectID: string;
  title?: string;
  url?: string;
  comment_text?: string;
  story_title?: string;
  story_url?: string;
  created_at: string;
  created_at_i: number;
  _tags: string[];
}

interface HNResponse {
  hits: HNHit[];
}

const processed = new Set<string>();

function isComment(hit: HNHit): boolean {
  return Array.isArray(hit._tags) && hit._tags.includes("comment");
}

function hitTitle(hit: HNHit): string {
  if (hit.title) return hit.title;
  if (hit.comment_text)
    return hit.comment_text.replace(/(<[^>]+>)/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
  if (hit.story_title) return hit.story_title;
  return "(no title)";
}

function hitUrl(hit: HNHit): string {
  return `https://news.ycombinator.com/item?id=${hit.objectID}`;
}

function shouldAccept(hit: HNHit, term: string): boolean {
  if (isComment(hit)) {
    const commentText = (hit.comment_text ?? "")
      .replace(/(<[^>]+>)/g, " ")
      .replace(/&[a-z#0-9]+;/gi, " ");
    return qualifyPost(hit.story_title ?? term, commentText);
  }
  return qualifyPost(hitTitle(hit), hit.url ?? "");
}

/**
 * Search HN with optional time window.
 * - First pass: last 48 hours (search_by_date endpoint with numericFilters)
 * - Second pass: fall back to relevance-based search (wider timeframe)
 */
async function searchTermRecent(term: string): Promise<HNHit[]> {
  const cutoff = Math.floor((Date.now() - 48 * 3600 * 1000) / 1000);
  try {
    const { data } = await axios.get<HNResponse>(HN_SEARCH_BY_DATE, {
      params: {
        query: term,
        hitsPerPage: HITS_PER_PAGE,
        numericFilters: `created_at_i>${cutoff}`,
      },
      timeout: 12_000,
    });
    return data.hits ?? [];
  } catch {
    return [];
  }
}

async function searchTermAllTime(term: string): Promise<HNHit[]> {
  const { data } = await axios.get<HNResponse>(HN_SEARCH, {
    params: { query: term, hitsPerPage: HITS_PER_PAGE },
    timeout: 12_000,
  });
  return data.hits ?? [];
}

async function poll() {
  const terms = getTwitterKeywords();
  if (terms.length === 0) {
    console.log("[hn] no keywords configured — skipping poll");
    setWorkerStatus("twitter", "active");
    return;
  }

  console.log(`[hn] polling ${terms.length} terms via HN Algolia (recent + fallback)…`);
  let anySuccess = false;
  let accepted = 0;
  let rejected = 0;

  for (const term of terms) {
    let hits: HNHit[];

    try {
      // Pass 1: recent 48h
      hits = await searchTermRecent(term);

      // Pass 2: if fewer than 5 recent hits, also pull relevance-ranked
      if (hits.length < 5) {
        const allTime = await searchTermAllTime(term);
        // Merge, deduplicating by objectID
        const ids = new Set(hits.map((h) => h.objectID));
        for (const h of allTime) {
          if (!ids.has(h.objectID)) hits.push(h);
        }
      }

      anySuccess = true;
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? `${err.response?.status ?? "network"} — ${err.message}`
        : (err as Error).message;
      console.error(`[hn] search failed for "${term}": ${msg}`);
      continue;
    }

    for (const hit of hits) {
      if (processed.has(hit.objectID)) continue;
      processed.add(hit.objectID);

      if (!shouldAccept(hit, term)) {
        rejected++;
        continue;
      }

      accepted++;
      const title = hitTitle(hit);
      pushLead({
        id: hit.objectID,
        source: "HN",
        keyword: term,
        title,
        url: hitUrl(hit),
        timestamp: hit.created_at,
      });

      console.log(`[hn] ✓ qualified — "${term}" — ${title.slice(0, 80)}`);
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`[hn] poll done — ${accepted} accepted, ${rejected} rejected`);
  setWorkerStatus("twitter", anySuccess ? "active" : "degraded");
}

export function startTwitter(): NodeJS.Timeout {
  const terms = getTwitterKeywords();
  console.log(
    `[hn] started — ${terms.length} terms via HN Algolia, interval ${POLL_INTERVAL_MS / 1000}s`
  );
  poll();
  return setInterval(poll, POLL_INTERVAL_MS);
}
