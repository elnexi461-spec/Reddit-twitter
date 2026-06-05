import { Router } from "express";
import {
  getCompetitorSnapshot,
  claimCompetitorLead,
  unclaimCompetitorLead,
  updateCompetitorPipeline,
  addCompetitorNote,
  type PipelineStatus,
} from "../store/competitor-leads.js";

const router = Router();

// GET /api/competitor-leads
router.get("/competitor-leads", (_req, res) => {
  const snapshot = getCompetitorSnapshot();
  res.json(snapshot);
});

// POST /api/competitor-leads/:id/claim
router.post("/competitor-leads/:id/claim", (req, res) => {
  const lead = claimCompetitorLead(req.params.id);
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.json(lead);
});

// POST /api/competitor-leads/:id/unclaim
router.post("/competitor-leads/:id/unclaim", (req, res) => {
  const lead = unclaimCompetitorLead(req.params.id);
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.json(lead);
});

// PATCH /api/competitor-leads/:id/pipeline
router.patch("/competitor-leads/:id/pipeline", (req, res) => {
  const { status } = req.body as { status: PipelineStatus };
  const valid: PipelineStatus[] = ["unclaimed", "contacted", "qualified", "converted"];
  if (!valid.includes(status)) {
    res.status(400).json({ error: "Invalid pipeline status" });
    return;
  }
  const lead = updateCompetitorPipeline(req.params.id, status);
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.json(lead);
});

// POST /api/competitor-leads/:id/note
router.post("/competitor-leads/:id/note", (req, res) => {
  const { note } = req.body as { note: string };
  if (!note?.trim()) {
    res.status(400).json({ error: "Note text is required" });
    return;
  }
  const lead = addCompetitorNote(req.params.id, note);
  if (!lead) {
    res.status(404).json({ error: "Lead not found" });
    return;
  }
  res.json(lead);
});

export default router;
