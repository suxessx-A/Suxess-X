import { Router, type IRouter } from "express";
import healthRouter from "./health";
import coachingRouter from "./coaching";
import stripeRouter from "./stripe";
import usersRouter from "./users";
import authRouter from "./auth";
import webhooksRouter from "./webhooks";

const router: IRouter = Router();

router.use("/health", healthRouter);
router.use("/coaching", coachingRouter);
router.use("/stripe", stripeRouter);
router.use("/users", usersRouter);
router.use("/auth", authRouter);
router.use("/webhooks", webhooksRouter);

export default router;
