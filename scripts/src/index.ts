import { start as startReddit } from "./reddit-monitor.js";
import { start as startTwitter } from "./twitter-leads.js";

const timers: NodeJS.Timeout[] = [];

async function main() {
  console.log("[engine] starting lead pipeline…");

  timers.push(startReddit());

  try {
    timers.push(startTwitter());
  } catch (err) {
    console.warn(`[engine] twitter disabled: ${(err as Error).message}`);
  }

  console.log("[engine] all monitors active");
}

function shutdown(signal: string) {
  console.log(`\n[engine] ${signal} received — shutting down cleanly`);
  for (const t of timers) clearInterval(t);
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

main().catch((err) => {
  console.error("[engine] fatal:", err);
  process.exit(1);
});
