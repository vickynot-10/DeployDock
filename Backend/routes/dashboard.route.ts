import express from "express";
import { DashBoardPage } from "../controllers/dashboard.controller";
import { AsyncHandler } from "../helpers/async.handler";
import { AuthMiddleware } from "../middlewares/auth.middleware";
const router = express.Router();

router.get("/",AuthMiddleware ,AsyncHandler( DashBoardPage))
export default router;
