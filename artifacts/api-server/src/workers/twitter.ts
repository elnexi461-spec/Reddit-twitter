import axios from "axios";
import { pushLead, setWorkerStatus } from "../store/leads.js";

const RAPIDAPI_KEY = process.env["RAPIDAPI_KEY"] ?? "";
const RAPIDAPI_HOST = "twitter154.p.rapidapi.com";

const SEARCH_TERMS = [
  "need proxies",
  "clean residential proxy",
  "scraping blocked",
  "sneaker proxy",
];

const POLL_INTERVAL_MS = 4 * 60 * 1000;

interface RawTweetUser {
  username: string;
}

interface RawTweet {
  tweet_id: string;
  text: string;
  user: RawTweetUser;
  creation_date: string;
}

interface SearchResponse {
  results: RawTweet[];
  next_cursor?: string;
}

const processed = new Set<string>();

async function searchTweets(query: string): Promise<RawTweet[]> {
  const { data } = await axios.get<SearchResponse>(
    "https://twitter154.p.rapidapi.com/search/",
    {
      params: { query, limit: "20", section: "latest" },
      headers: { "x-rapidapi-key": RAPIDAPI_KEY, "x-rapidapi-host": RAPIDAPI_HOST },
      timeout: 12_000,
    }
  );
  return data.results ?? [];
}

async function pollTerm(term: string) {
  let tweets: RawTweet[];

  try {
    tweets = await searchTweets(term);
    setWorkerStatus("twitter", "active");
  } catch (err) {
    setWorkerStatus("twitter", "degraded");
    const msg = axios.isAxiosError(err)
      ? `${err.response?.status ?? "network"} — ${err.message}`
      : (err as Error).message;
    console.error(`[twitter] search failed for "${term}": ${msg}`);
    return;
  }

  for (const t of tweets) {
    if (processed.has(t.tweet_id)) continue;
    processed.add(t.tweet_id);

    pushLead({
      id: t.tweet_id,
      source: "twitter",
      keyword: term,
      title: t.text.replace(/\n/g, " ").slice(0, 200),
      url: `https://twitter.com/${t.user?.username ?? "i"}/status/${t.tweet_id}`,
      timestamp: new Date(t.creation_date).toISOString(),
    });

    console.log(`[twitter] lead — @${t.user?.username} — "${term}"`);
  }
}

async function poll() {
  console.log(`[twitter] polling ${SEARCH_TERMS.length} terms…`);
  for (const term of SEARCH_TERMS) {
    await pollTerm(term);
  }
}

export function start(): NodeJS.Timeout {
  if (!RAPIDAPI_KEY) throw new Error("RAPIDAPI_KEY is not set");
  console.log(`[twitter] started — ${SEARCH_TERMS.length} terms, interval ${POLL_INTERVAL_MS / 1000}s`);
  poll();
  return setInterval(poll, POLL_INTERVAL_MS);
}
