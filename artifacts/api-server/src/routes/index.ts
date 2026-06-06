import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import activityRouter from "./activity.js";
import exportRouter from "./export.js";
import keywordsRouter from "./keywords.js";
import leadsRouter from "./leads.js";
import statsRouter from "./stats.js";
import integrationsRouter from "./integrations.js";
import competitorLeadsRouter from "./competitor-leads.js";
import liveStreamRouter from "./live-stream.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(activityRouter);
router.use("/activity/export", exportRouter);
router.use(keywordsRouter);
router.use(leadsRouter);
router.use(statsRouter);
router.use(integrationsRouter);
router.use(competitorLeadsRouter);
router.use(liveStreamRouter);

export default router;
