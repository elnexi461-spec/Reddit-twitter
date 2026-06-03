import axios from "axios";
import { pushLead, setWorkerStatus } from "../store/leads.js";
import { getTwitterKeywords } from "../store/keywords.js";
import { qualifyPost } from "../lib/qualify.js";

const HN_SEARCH = "https://hn.algolia.com/api/v1/search_by_date";
const POLL_INTERVAL_MS = 5 * 60 * 1000;

interface HNHit {
  objectID: string;
  title?: string;
  url?: string;
  comment_text?: string;
  story_title?: string;
  story_url?: string;
  created_at: string;
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

/**
 * For HN comments, qualification must pass on the comment text itself —
 * the parent story title alone is not enough because the comment could be
 * an off-topic reply in a tangentially related thread.
 */
function shouldAccept(hit: HNHit, term: string): boolean {
  if (isComment(hit)) {
    const commentText = (hit.comment_text ?? "")
      .replace(/(<[^>]+>)/g, " ")
      .replace(/&[a-z#0-9]+;/gi, " ");
    // For comments, qualify on comment body + story title together
    return qualifyPost(hit.story_title ?? term, commentText);
  }
  // For stories, qualify on title + (url as context)
  return qualifyPost(hitTitle(hit), hit.url ?? "");
}

async function searchTerm(term: string): Promise<HNHit[]> {
  const { data } = await axios.get<HNResponse>(HN_SEARCH, {
    params: { query: term, hitsPerPage: 25 },
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

  console.log(`[hn] polling ${terms.length} terms via HN Algolia…`);
  let anySuccess = false;
  let accepted = 0;
  let rejected = 0;

  for (const term of terms) {
    let hits: HNHit[];

    try {
      hits = await searchTerm(term);
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

      // Hard qualification gate
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
