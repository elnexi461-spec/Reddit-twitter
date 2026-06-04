import { Router } from "express";
import { getSnapshot } from "../store/leads.js";

const router = Router();

function csvField(value: string | number | boolean | undefined | null): string {
  const str = value === undefined || value === null ? "" : String(value);
  return `"${str.replace(/"/g, '""')}"`;
}

router.get("/csv", (_req, res) => {
  const { leads } = getSnapshot();

  const header = [
    "id", "source", "keyword", "title", "url", "timestamp",
    "score", "tier", "claimed", "claimedAt",
    "pipelineStatus", "notes",
  ].join(",");

  const rows = leads.map((lead) =>
    [
      csvField(lead.id),
      csvField(lead.source),
      csvField(lead.keyword),
      csvField(lead.title),
      csvField(lead.url),
      csvField(lead.timestamp),
      csvField(lead.score),
      csvField(lead.tier),
      csvField(lead.claimed),
      csvField(lead.claimedAt),
      csvField(lead.pipelineStatus),
      csvField(lead.notes?.map((n) => n.text).join(" | ") ?? ""),
    ].join(",")
  );

  const csv = [header, ...rows].join("\r\n");

  res
    .setHeader("Content-Type", "text/csv")
    .setHeader("Content-Disposition", `attachment; filename="proxiesx_leads_${Date.now()}.csv"`)
    .send(csv);
});

export default router;
