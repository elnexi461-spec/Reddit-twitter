import axios from "axios";
import { pushLead, setWorkerStatus } from "../store/leads.js";
import { getTwitterKeywords } from "../store/keywords.js";

const API = {
  host: "twitter-x.p.rapidapi.com",
  key: "4a8fd7281cmsh86340c50ee4cee6p17bc47jsn3eef453c56e3",
};

const POLL_INTERVAL_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Raw response shape from twitter-x.p.rapidapi.com/search
// ---------------------------------------------------------------------------

interface TweetLegacy {
  full_text: string;
  created_at: string;
}

interface UserLegacy {
  screen_name: string;
}

interface TweetResult {
  rest_id: string;
  legacy: TweetLegacy;
  core: {
    user_results: {
      result: {
        legacy: UserLegacy;
      };
    };
  };
}

interface TimelineEntry {
  entryId: string;
  content?: {
    itemContent?: {
      tweet_results?: {
        result?: TweetResult;
      };
    };
  };
}

interface SearchResponse {
  data?: {
    search_by_raw_query?: {
      search_timeline?: {
        timeline?: {
          instructions?: Array<{
            type?: string;
            entries?: TimelineEntry[];
          }>;
        };
      };
    };
  };
}

// ---------------------------------------------------------------------------

const processed = new Set<string>();

function extractTweets(response: SearchResponse): TweetResult[] {
  const instructions =
    response.data?.search_by_raw_query?.search_timeline?.timeline?.instructions ?? [];

  const results: TweetResult[] = [];

  for (const instruction of instructions) {
    if (instruction.type !== "TimelineAddEntries") continue;
    for (const entry of instruction.entries ?? []) {
      const tweet = entry.content?.itemContent?.tweet_results?.result;
      if (tweet?.rest_id && tweet.legacy?.full_text) {
        results.push(tweet);
      }
    }
  }

  return results;
}

async function searchTerm(term: string): Promise<TweetResult[]> {
  const { data } = await axios.get<SearchResponse>(
    "https://twitter-x.p.rapidapi.com/search",
    {
      params: { query: term, type: "Latest" },
      headers: {
        "x-rapidapi-key": API.key,
        "x-rapidapi-host": API.host,
      },
      timeout: 12_000,
    }
  );
  return extractTweets(data);
}

async function poll() {
  const SEARCH_TERMS = getTwitterKeywords();
  console.log(`[twitter/x] polling ${SEARCH_TERMS.length} terms…`);

  for (const term of SEARCH_TERMS) {
    let tweets: TweetResult[];

    try {
      tweets = await searchTerm(term);
      setWorkerStatus("twitter", "active");
    } catch (err) {
      setWorkerStatus("twitter", "degraded");
      const msg = axios.isAxiosError(err)
        ? `${err.response?.status ?? "network"} — ${err.message}`
        : (err as Error).message;
      console.error(`[twitter/x] search failed for "${term}": ${msg}`);
      continue;
    }

    for (const t of tweets) {
      if (processed.has(t.rest_id)) continue;
      processed.add(t.rest_id);

      const username = t.core.user_results.result.legacy.screen_name;

      pushLead({
        id: t.rest_id,
        source: "X",
        keyword: term,
        title: t.legacy.full_text.replace(/\n/g, " ").slice(0, 200),
        url: `https://x.com/${username}/status/${t.rest_id}`,
        timestamp: new Date(t.legacy.created_at).toISOString(),
      });

      console.log(`[twitter/x] lead — @${username} — "${term}"`);
    }
  }
}

export function startTwitter(): NodeJS.Timeout {
  console.log(
    `[twitter/x] started — ${getTwitterKeywords().length} terms, interval ${POLL_INTERVAL_MS / 1000}s`
  );
  poll();
  return setInterval(poll, POLL_INTERVAL_MS);
}
