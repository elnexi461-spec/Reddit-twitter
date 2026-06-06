import { Router } from "express";
import { addSSEClient, removeSSEClient, broadcastSSE, getSSEClientCount } from "../store/live-events.js";

const router = Router();

// ─── SSE subscription ─────────────────────────────────────────────────────────
router.get("/live-stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const clientId = addSSEClient(res);

  // Send initial "connected" event
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId, ts: new Date().toISOString() })}\n\n`);

  // Heartbeat every 25s
  const heartbeat = setInterval(() => {
    try {
      res.write(`event: ping\ndata: ${JSON.stringify({ ts: new Date().toISOString() })}\n\n`);
    } catch {
      clearInterval(heartbeat);
    }
  }, 25_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    removeSSEClient(clientId);
  });
});

// ─── Ingest: Lead ─────────────────────────────────────────────────────────────
router.post("/ingest/lead", (req, res) => {
  const body = req.body as Record<string, unknown>;
  const payload = {
    id: `live_lead_${Date.now()}`,
    ts: new Date().toISOString(),
    source: body.source ?? "webhook",
    title: body.title ?? "Untitled lead",
    url: body.url ?? "",
    keyword: body.keyword ?? "",
    score: typeof body.score === "number" ? body.score : 50,
    tier: body.tier ?? "warm",
    ...body,
  };
  broadcastSSE("lead", payload);
  res.json({ ok: true, clients: getSSEClientCount(), payload });
});

// ─── Ingest: Package signal ───────────────────────────────────────────────────
router.post("/ingest/package", (req, res) => {
  const body = req.body as Record<string, unknown>;
  const payload = {
    id: `pkg_${Date.now()}`,
    ts: new Date().toISOString(),
    registry: body.registry ?? "npm",
    packageName: body.packageName ?? "unknown",
    weeklyDownloads: body.weeklyDownloads ?? 0,
    githubStars: body.githubStars ?? 0,
    signal: body.signal ?? "install_spike",
    riskScore: typeof body.riskScore === "number" ? body.riskScore : 50,
    ...body,
  };
  broadcastSSE("package", payload);
  res.json({ ok: true, clients: getSSEClientCount(), payload });
});

// ─── Ingest: Job signal ───────────────────────────────────────────────────────
router.post("/ingest/job", (req, res) => {
  const body = req.body as Record<string, unknown>;
  const payload = {
    id: `job_${Date.now()}`,
    ts: new Date().toISOString(),
    company: body.company ?? "Unknown Corp",
    title: body.title ?? "Web Scraping Engineer",
    location: body.location ?? "Remote",
    salary: body.salary ?? "",
    platform: body.platform ?? "LinkedIn",
    postedAt: body.postedAt ?? new Date().toISOString(),
    ...body,
  };
  broadcastSSE("job", payload);
  res.json({ ok: true, clients: getSSEClientCount(), payload });
});

// ─── Ingest: Infra signal ─────────────────────────────────────────────────────
router.post("/ingest/infra", (req, res) => {
  const body = req.body as Record<string, unknown>;
  const payload = {
    id: `infra_${Date.now()}`,
    ts: new Date().toISOString(),
    provider: body.provider ?? "AWS",
    region: body.region ?? "us-east-1",
    ipCount: typeof body.ipCount === "number" ? body.ipCount : 0,
    reverseDnsPattern: body.reverseDnsPattern ?? "",
    egressGbh: typeof body.egressGbh === "number" ? body.egressGbh : 0,
    riskLevel: body.riskLevel ?? "medium",
    ...body,
  };
  broadcastSSE("infra", payload);
  res.json({ ok: true, clients: getSSEClientCount(), payload });
});

// ─── Status ───────────────────────────────────────────────────────────────────
router.get("/live-stream/status", (_req, res) => {
  res.json({ connectedClients: getSSEClientCount(), ts: new Date().toISOString() });
});

export default router;
