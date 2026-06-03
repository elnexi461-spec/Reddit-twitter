import axios from "axios";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY ?? "";
const RAPIDAPI_HOST = "twitter154.p.rapidapi.com";

const SEARCH_TERMS = [
  "need proxies",
  "clean residential proxy",
  "scraping blocked",
  "sneaker proxy",
];

const POLL_INTERVAL_MS = 4 * 60 * 1000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Tweet {
  id: string;
  text: string;
  username: string;
  timestamp: string;
}

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

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const processed = new Set<string>();

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

async function searchTweets(query: string): Promise<Tweet[]> {
  const { data } = await axios.get<SearchResponse>(
    "https://twitter154.p.rapidapi.com/search/",
    {
      params: { query, limit: "20", section: "latest" },
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
      },
      timeout: 12_000,
    }
  );

  return (data.results ?? []).map((t) => ({
    id: t.tweet_id,
    text: t.text,
    username: t.user?.username ?? "unknown",
    timestamp: t.creation_date,
  }));
}

function printLead(term: string, tweet: Tweet) {
  console.log(
    [
      `\n🎯 LEAD — "${term}"`,
      `  user : @${tweet.username}`,
      `  time : ${tweet.timestamp}`,
      `  text : ${tweet.text.replace(/\n/g, " ")}`,
      `  url  : https://twitter.com/${tweet.username}/status/${tweet.id}`,
    ].join("\n")
  );
}

async function pollTerm(term: string) {
  let tweets: Tweet[];

  try {
    tweets = await searchTweets(term);
  } catch (err) {
    const msg = axios.isAxiosError(err)
      ? `${err.response?.status ?? "network"} — ${err.message}`
      : (err as Error).message;
    console.error(`[twitter-leads] search failed for "${term}": ${msg}`);
    return;
  }

  let fresh = 0;
  for (const tweet of tweets) {
    if (processed.has(tweet.id)) continue;
    processed.add(tweet.id);
    fresh++;
    printLead(term, tweet);
  }

  if (fresh === 0) {
    console.log(`[twitter-leads] "${term}" — no new leads`);
  }
}

async function poll() {
  console.log(`[twitter-leads] polling ${SEARCH_TERMS.length} terms…`);
  for (const term of SEARCH_TERMS) {
    await pollTerm(term);
  }
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------

if (!RAPIDAPI_KEY) {
  console.error("[twitter-leads] RAPIDAPI_KEY is not set — exiting");
  process.exit(1);
}

console.log(
  `[twitter-leads] started — ${SEARCH_TERMS.length} terms, interval ${POLL_INTERVAL_MS / 1000}s`
);

poll();
setInterval(poll, POLL_INTERVAL_MS);
