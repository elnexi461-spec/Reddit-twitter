import { Router, type IRouter } from "express";
import healthRouter from "./health";
import activityRouter from "./activity";
import exportRouter from "./export";
import keywordsRouter from "./keywords";
import leadsRouter from "./leads";

const router: IRouter = Router();

router.use(healthRouter);
router.use(activityRouter);
router.use("/activity/export", exportRouter);
router.use(keywordsRouter);
router.use(leadsRouter);

export default router;
