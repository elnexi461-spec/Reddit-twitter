import { Router } from "express";
import {
  getKeywords,
  addKeyword,
  updateKeyword,
  deleteKeyword,
  type KeywordSource,
} from "../store/keywords.js";

const router = Router();

const VALID_SOURCES: KeywordSource[] = ["reddit", "twitter", "both"];

router.get("/keywords", (_req, res) => {
  res.json(getKeywords());
});

router.post("/keywords", (req, res) => {
  const { term, source } = req.body as { term?: unknown; source?: unknown };

  if (!term || typeof term !== "string" || !term.trim()) {
    res.status(400).json({ error: "term is required and must be a non-empty string" });
    return;
  }

  const src: KeywordSource = VALID_SOURCES.includes(source as KeywordSource)
    ? (source as KeywordSource)
    : "both";

  const kw = addKeyword(term, src);
  res.status(201).json(kw);
});

router.patch("/keywords/:id", (req, res) => {
  const { id } = req.params;
  const { enabled, term, source } = req.body as {
    enabled?: unknown;
    term?: unknown;
    source?: unknown;
  };

  const patch: Parameters<typeof updateKeyword>[1] = {};
  if (enabled !== undefined) patch.enabled = Boolean(enabled);
  if (term !== undefined && typeof term === "string") patch.term = term;
  if (source !== undefined && VALID_SOURCES.includes(source as KeywordSource))
    patch.source = source as KeywordSource;

  const kw = updateKeyword(id, patch);
  if (!kw) {
    res.status(404).json({ error: "keyword not found" });
    return;
  }
  res.json(kw);
});

router.delete("/keywords/:id", (req, res) => {
  const deleted = deleteKeyword(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: "keyword not found" });
    return;
  }
  res.status(204).send();
});

export default router;
