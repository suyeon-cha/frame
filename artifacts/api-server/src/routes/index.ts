import { Router, type IRouter } from "express";
import healthRouter from "./health";
import pairsRouter from "./pairs";
import devicesRouter from "./devices";
import alarmsRouter from "./alarms";

const router: IRouter = Router();

router.use(healthRouter);
router.use(pairsRouter);
router.use(devicesRouter);
router.use(alarmsRouter);

export default router;
