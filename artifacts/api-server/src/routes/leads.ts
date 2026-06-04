import { Router } from "express";
import { claimLead, updatePipelineStatus, addNote, type PipelineStatus } from "../store/leads.js";

const router = Router();

const VALID_STATUSES: PipelineStatus[] = ["unclaimed", "contacted", "qualified", "converted"];

router.post("/leads/:id/claim", (req, res) => {
  const lead = claimLead(req.params.id);
  if (!lead) {
    res.status(404).json({ error: "lead not found" });
    return;
  }
  res.json(lead);
});

router.patch("/leads/:id/pipeline", (req, res) => {
  const { status } = req.body as { status?: unknown };
  if (!status || !VALID_STATUSES.includes(status as PipelineStatus)) {
    res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(", ")}` });
    return;
  }
  const lead = updatePipelineStatus(req.params.id, status as PipelineStatus);
  if (!lead) {
    res.status(404).json({ error: "lead not found" });
    return;
  }
  res.json(lead);
});

router.post("/leads/:id/note", (req, res) => {
  const { note } = req.body as { note?: unknown };
  if (!note || typeof note !== "string" || !note.trim()) {
    res.status(400).json({ error: "note must be a non-empty string" });
    return;
  }
  const lead = addNote(req.params.id, note as string);
  if (!lead) {
    res.status(404).json({ error: "lead not found" });
    return;
  }
  res.json(lead);
});

export default router;
