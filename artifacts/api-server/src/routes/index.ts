import { Router, type IRouter } from "express";
import healthRouter from "./health";
import coachingRouter from "./coaching";

const router: IRouter = Router();

router.use("/health", healthRouter);
router.use("/coaching", coachingRouter);

export default router;
