import app from "./app";
import { logger } from "./lib/logger";
import { start as startReddit } from "./workers/reddit.js";
import { start as startTwitter } from "./workers/twitter.js";
import { setWorkerStatus } from "./store/leads.js";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  startReddit();

  try {
    startTwitter();
  } catch (e) {
    setWorkerStatus("twitter", "degraded");
    logger.warn({ err: e }, "Twitter worker disabled — RAPIDAPI_KEY not set");
  }
});
