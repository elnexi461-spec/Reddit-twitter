/**
 * competitor.ts — Background worker that monitors Reddit and HN for developer
 * frustration posts mentioning Bright Data, Oxylabs, ScraperAPI, Crawlbase,
 * or Webshare.
 *
 * Uses the same infrastructure as the main workers but with competitor-specific
 * keywords and the competitor qualifier.
 */

import axios from "axios";
import { qualifyCompetitorPost } from "../lib/qualify-competitor.js";
import { pushCompetitorLead } from "../store/competitor-leads.js";

const REDDIT_BASE = "https://arctic-shift.photon-reddit.com/api/posts/search";
const HN_SEARCH_BY_DATE = "https://hn.algolia.com/api/v1/search_by_date";
const HN_SEARCH = "https://hn.algolia.com/api/v1/search";

const POLL_INTERVAL_MS = 4 * 60 * 1000; // every 4 minutes

// Subreddits with high developer concentration
const SUBREDDITS = [
  "webscraping",
  "dataengineering",
  "learnpython",
  "Python",
  "automation",
  "webdev",
  "datascience",
  "devops",
  "programming",
  "MachineLearning",
];

// Search terms that catch frustrated competitor mentions
// These are broad enough to catch natural language complaints
const COMPETITOR_KEYWORDS = [
  // Direct competitor mentions with frustration context
  "bright data alternative",
  "bright data not working",
  "brightdata alternative",
  "bright data too expensive",
  "oxylabs alternative",
  "oxylabs not working",
  "scraperapi alternative",
  "scraperapi blocked",
  "scraperapi not working",
  "crawlbase alternative",
  "crawlbase not working",
  "webshare alternative",
  "webshare proxy",
  // Broader complaint terms that will hit qualifier
  "bright data",
  "brightdata",
  "oxylabs",
  "scraperapi",
  "crawlbase",
  "webshare",
];

const seenReddit = new Set<string>();
const seenHN = new Set<string>();

interface ArcticPost {
  id: string;
  title: string;
  selftext: string;
  subreddit: string;
  permalink: string;
  created_utc: number;
}

interface HNHit {
  objectID: string;
  title?: string;
  comment_text?: string;
  story_title?: string;
  created_at: string;
  created_at_i: number;
  _tags: string[];
}

// ─── Reddit polling ───────────────────────────────────────────────────────────

async function pollReddit(): Promise<void> {
  const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 3600 * 1000) / 1000);
  let accepted = 0;

  for (const sub of SUBREDDITS) {
    for (const kw of COMPETITOR_KEYWORDS) {
      let posts: ArcticPost[] = [];

      try {
        const { data } = await axios.get<{ data: ArcticPost[] }>(REDDIT_BASE, {
          params: { query: kw, subreddit: sub, limit: 30, sort: "desc", after: sevenDaysAgo },
          timeout: 12_000,
        });
        posts = data.data ?? [];

        if (posts.length === 0) {
          const { data: allTime } = await axios.get<{ data: ArcticPost[] }>(REDDIT_BASE, {
            params: { query: kw, subreddit: sub, limit: 20, sort: "desc" },
            timeout: 12_000,
          });
          posts = allTime.data ?? [];
        }
      } catch {
        continue;
      }

      for (const post of posts) {
        if (seenReddit.has(post.id)) continue;
        seenReddit.add(post.id);

        const signal = qualifyCompetitorPost(post.title, post.selftext ?? "");
        if (!signal) continue;

        accepted++;
        pushCompetitorLead({
          id: `reddit_${post.id}`,
          source: "reddit",
          keyword: kw,
          title: post.title,
          url: `https://reddit.com${post.permalink}`,
          timestamp: new Date(post.created_utc * 1000).toISOString(),
          competitorMention: signal.competitor,
          frustrationScore: signal.frustrationScore,
          sentimentLabel: signal.sentimentLabel,
          detectedLanguage: signal.detectedLanguage,
          priceComplaint: signal.priceComplaint,
        });
      }

      await new Promise((r) => setTimeout(r, 200));
    }
  }

  if (accepted > 0) {
    console.log(`[competitor-worker] reddit — ${accepted} competitor intercepts qualified`);
  }
}

// ─── HN polling ───────────────────────────────────────────────────────────────

function hnTitle(hit: HNHit): string {
  if (hit.title) return hit.title;
  if (hit.comment_text)
    return hit.comment_text.replace(/(<[^>]+>)/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
  return hit.story_title ?? "(no title)";
}

async function pollHN(): Promise<void> {
  const cutoff = Math.floor((Date.now() - 72 * 3600 * 1000) / 1000);
  let accepted = 0;

  for (const kw of COMPETITOR_KEYWORDS) {
    let hits: HNHit[] = [];

    try {
      const { data: recent } = await axios.get<{ hits: HNHit[] }>(HN_SEARCH_BY_DATE, {
        params: { query: kw, hitsPerPage: 30, numericFilters: `created_at_i>${cutoff}` },
        timeout: 12_000,
      });
      hits = recent.hits ?? [];

      if (hits.length < 5) {
        const { data: allTime } = await axios.get<{ hits: HNHit[] }>(HN_SEARCH, {
          params: { query: kw, hitsPerPage: 20 },
          timeout: 12_000,
        });
        const ids = new Set(hits.map((h) => h.objectID));
        for (const h of allTime.hits ?? []) {
          if (!ids.has(h.objectID)) hits.push(h);
        }
      }
    } catch {
      continue;
    }

    for (const hit of hits) {
      if (seenHN.has(hit.objectID)) continue;
      seenHN.add(hit.objectID);

      const isComment = Array.isArray(hit._tags) && hit._tags.includes("comment");
      const body = isComment
        ? (hit.comment_text ?? "").replace(/(<[^>]+>)/g, " ")
        : "";
      const title = hnTitle(hit);

      const signal = qualifyCompetitorPost(title, body);
      if (!signal) continue;

      accepted++;
      pushCompetitorLead({
        id: `hn_${hit.objectID}`,
        source: "HN",
        keyword: kw,
        title,
        url: `https://news.ycombinator.com/item?id=${hit.objectID}`,
        timestamp: hit.created_at,
        competitorMention: signal.competitor,
        frustrationScore: signal.frustrationScore,
        sentimentLabel: signal.sentimentLabel,
        detectedLanguage: signal.detectedLanguage,
        priceComplaint: signal.priceComplaint,
      });
    }

    await new Promise((r) => setTimeout(r, 150));
  }

  if (accepted > 0) {
    console.log(`[competitor-worker] hn — ${accepted} competitor intercepts qualified`);
  }
}

// ─── Main poll loop ───────────────────────────────────────────────────────────

async function poll(): Promise<void> {
  console.log("[competitor-worker] polling Reddit + HN for competitor frustration…");
  await Promise.allSettled([pollReddit(), pollHN()]);
}

export function startCompetitorWorker(): NodeJS.Timeout {
  console.log(
    `[competitor-worker] started — monitoring ${COMPETITOR_KEYWORDS.length} terms across ${SUBREDDITS.length} subreddits + HN — every ${POLL_INTERVAL_MS / 1000}s`
  );
  poll();
  return setInterval(poll, POLL_INTERVAL_MS);
}
