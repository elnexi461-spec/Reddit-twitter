import { Router } from "express";
import { getSnapshot } from "../store/leads.js";

const router = Router();

function csvField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

router.get("/csv", (_req, res) => {
  const { leads } = getSnapshot();

  const header = ["id", "source", "keyword", "title", "url", "timestamp"].join(",");

  const rows = leads.map((lead) =>
    [
      csvField(lead.id),
      csvField(lead.source),
      csvField(lead.keyword),
      csvField(lead.title),
      csvField(lead.url),
      csvField(lead.timestamp),
    ].join(",")
  );

  const csv = [header, ...rows].join("\r\n");

  res
    .setHeader("Content-Type", "text/csv")
    .setHeader("Content-Disposition", `attachment; filename="leads_${Date.now()}.csv"`)
    .send(csv);
});

export default router;
