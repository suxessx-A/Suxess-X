import { Router, type IRouter } from "express";
import healthRouter from "./health";
import coachingRouter from "./coaching";
import stripeRouter from "./stripe";
import usersRouter from "./users";

const router: IRouter = Router();

router.use("/health", healthRouter);
router.use("/coaching", coachingRouter);
router.use("/stripe", stripeRouter);
router.use("/users", usersRouter);

export default router;
