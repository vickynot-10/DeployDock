import express from "express";
import { GetAutomationPagination ,getProjectByID , SaveAutomation } from "../controllers/automation.controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { AsyncHandler } from "../helpers/async.handler";
const router = express.Router();
router.get("/", AuthMiddleware,AsyncHandler( GetAutomationPagination));
router.post("/", AuthMiddleware,AsyncHandler( SaveAutomation));
router.get("/project/:id", AuthMiddleware,AsyncHandler( getProjectByID));
export default router;
