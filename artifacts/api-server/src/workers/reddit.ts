import axios from "axios";
import { pushLead, setWorkerStatus } from "../store/leads.js";

const config = {
  subreddits: ["webscraping", "dataengineering", "sneakerbots"],
  keywords: ["proxy", "proxies", "residential ip", "getting blocked"],
  intervalMs: 5 * 60 * 1000,
};

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

interface RedditPost {
  data: {
    id: string;
    title: string;
    selftext: string;
    permalink: string;
    subreddit: string;
    created_utc: number;
  };
}

interface RedditListing {
  data: { children: RedditPost[] };
}

const seen = new Set<string>();

async function fetchNew(subreddit: string): Promise<RedditPost["data"][]> {
  const { data } = await axios.get<RedditListing>(
    `https://www.reddit.com/r/${subreddit}/new.json?limit=25`,
    { headers: { "User-Agent": UA }, timeout: 10_000 }
  );
  return data.data.children.map((c) => c.data);
}

function matchedKeyword(text: string): string | null {
  const lower = text.toLowerCase();
  for (const kw of config.keywords) {
    if (lower.includes(kw)) return kw;
  }
  return null;
}

async function poll() {
  for (const sub of config.subreddits) {
    let posts: RedditPost["data"][];

    try {
      posts = await fetchNew(sub);
      setWorkerStatus("reddit", "active");
    } catch (err) {
      setWorkerStatus("reddit", "degraded");
      console.error(`[reddit] r/${sub} fetch failed:`, (err as Error).message);
      continue;
    }

    for (const post of posts) {
      if (seen.has(post.id)) continue;
      seen.add(post.id);

      const kw = matchedKeyword(post.title) ?? matchedKeyword(post.selftext);
      if (!kw) continue;

      pushLead({
        id: post.id,
        source: "reddit",
        keyword: kw,
        title: post.title,
        url: `https://reddit.com${post.permalink}`,
        timestamp: new Date(post.created_utc * 1000).toISOString(),
      });

      console.log(`[reddit] match — r/${post.subreddit} — "${kw}" — ${post.title}`);
    }
  }
}

export function start(): NodeJS.Timeout {
  console.log(`[reddit] watching r/${config.subreddits.join(", r/")} every ${config.intervalMs / 1000}s`);
  poll();
  return setInterval(poll, config.intervalMs);
}
