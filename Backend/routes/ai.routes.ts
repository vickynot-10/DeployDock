import express from "express";
import { AskAIController } from "../controllers/ai.controller";
import { AsyncHandler } from "../helpers/async.handler";
import { AuthMiddleware } from "../middlewares/auth.middleware";
const router = express.Router();

router.post("/", AuthMiddleware, AsyncHandler(AskAIController))
export default router;
