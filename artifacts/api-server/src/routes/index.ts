import { Router, type IRouter } from "express";
import healthRouter from "./health";
import anthropicRouter from "./anthropic/index";
import aiRouter from "./ai/index";

const router: IRouter = Router();

router.use(healthRouter);
router.use(anthropicRouter);
router.use(aiRouter);

export default router;
