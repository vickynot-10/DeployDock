import express from "express";
import { UpdateUserProfile  } from "../controllers/settings.controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { AsyncHandler } from "../helpers/async.handler";
const router = express.Router();

router.patch("/",AuthMiddleware ,AsyncHandler( UpdateUserProfile));


export default router;
