import { Router } from "express";
import { claimLead } from "../store/leads.js";

const router = Router();

router.post("/leads/:id/claim", (req, res) => {
  const lead = claimLead(req.params.id);
  if (!lead) {
    res.status(404).json({ error: "lead not found" });
    return;
  }
  res.json(lead);
});

export default router;
