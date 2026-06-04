import { Router } from "express";
import { getStats } from "../store/leads.js";

const router = Router();

router.get("/stats", (_req, res) => {
  res.json(getStats());
});

export default router;
