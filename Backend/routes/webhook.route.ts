import express from "express";
import {
  GetProjectList,
  GetWebhookLogs,
} from "../controllers/webhooks.controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";
const router = express.Router();
import { AsyncHandler } from "../helpers/async.handler";
router.get("/", AuthMiddleware, AsyncHandler(GetWebhookLogs));
router.get("/projects", AuthMiddleware, AsyncHandler(GetProjectList));

export default router;
