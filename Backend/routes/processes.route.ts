import express from "express";
import { ProcessTimLogs ,ProjectProcessTimLogs} from "../controllers/processes.controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { AsyncHandler } from "../helpers/async.handler";
const router = express.Router();

router.get("/process-logs", AuthMiddleware,AsyncHandler( ProcessTimLogs));
router.get("/app-process-logs", AuthMiddleware,AsyncHandler( ProjectProcessTimLogs));


export default router;
