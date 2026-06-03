import { Router, type IRouter } from "express";
import healthRouter from "./health";
import activityRouter from "./activity";
import exportRouter from "./export";

const router: IRouter = Router();

router.use(healthRouter);
router.use(activityRouter);
router.use("/activity/export", exportRouter);

export default router;
