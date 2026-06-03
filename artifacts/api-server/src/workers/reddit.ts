import axios from "axios";
import { pushLead, setWorkerStatus } from "../store/leads.js";
import { getRedditKeywords } from "../store/keywords.js";
import { qualifyPost } from "../lib/qualify.js";

const config = {
  subreddits: ["webscraping", "dataengineering", "sneakerbots"],
  intervalMs: 5 * 60 * 1000,
  limitPerQuery: 25,
};

const BASE = "https://arctic-shift.photon-reddit.com/api/posts/search";

interface ArcticPost {
  id: string;
  title: string;
  selftext: string;
  subreddit: string;
  permalink: string;
  created_utc: number;
}

interface ArcticResponse {
  data: ArcticPost[];
}

const seen = new Set<string>();

async function fetchForKeyword(
  keyword: string,
  subreddit: string
): Promise<ArcticPost[]> {
  const { data } = await axios.get<ArcticResponse>(BASE, {
    params: {
      query: keyword,
      subreddit,
      limit: config.limitPerQuery,
      sort: "desc",
    },
    timeout: 12_000,
  });
  return data.data ?? [];
}

async function poll() {
  const keywords = getRedditKeywords();
  if (keywords.length === 0) {
    console.log("[reddit] no keywords configured — skipping poll");
    setWorkerStatus("reddit", "active");
    return;
  }

  let anySuccess = false;
  let accepted = 0;
  let rejected = 0;

  for (const sub of config.subreddits) {
    for (const kw of keywords) {
      let posts: ArcticPost[];

      try {
        posts = await fetchForKeyword(kw, sub);
        anySuccess = true;
      } catch (err) {
        const msg = axios.isAxiosError(err)
          ? `${err.response?.status ?? "network"} — ${err.message}`
          : (err as Error).message;
        console.error(`[reddit] r/${sub} keyword="${kw}" failed: ${msg}`);
        continue;
      }

      for (const post of posts) {
        if (seen.has(post.id)) continue;
        seen.add(post.id);

        // Hard qualification gate — reject posts without clear proxy intent
        if (!qualifyPost(post.title, post.selftext ?? "")) {
          rejected++;
          continue;
        }

        accepted++;
        pushLead({
          id: post.id,
          source: "reddit",
          keyword: kw,
          title: post.title,
          url: `https://reddit.com${post.permalink}`,
          timestamp: new Date(post.created_utc * 1000).toISOString(),
        });

        console.log(
          `[reddit] ✓ qualified — r/${post.subreddit} — "${kw}" — ${post.title}`
        );
      }

      await new Promise((r) => setTimeout(r, 300));
    }
  }

  if (accepted + rejected > 0) {
    console.log(
      `[reddit] poll done — ${accepted} accepted, ${rejected} rejected`
    );
  }

  setWorkerStatus("reddit", anySuccess ? "active" : "degraded");
}

export function start(): NodeJS.Timeout {
  const kws = getRedditKeywords();
  console.log(
    `[reddit] arctic-shift — r/${config.subreddits.join(", r/")} — ${kws.length} keywords — every ${config.intervalMs / 1000}s`
  );
  poll();
  return setInterval(poll, config.intervalMs);
}
