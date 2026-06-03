import { Router } from "express";
import { getSnapshot } from "../store/leads.js";

const router = Router();

router.get("/activity", (_req, res) => {
  res.json(getSnapshot());
});

export default router;
