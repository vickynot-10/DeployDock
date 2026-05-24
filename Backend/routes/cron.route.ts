import { CronAuthMiddleware } from "../middlewares/cron.middleware";
import express from "express";
import { AsyncHandler } from '../helpers/async.handler';
import { DeleteLogsOffDeletedProjects , DeleteErrorLogsFiles} from '../controllers/cron.controller';
const router = express.Router();

router.post('/cleanup-logs', CronAuthMiddleware, AsyncHandler(DeleteLogsOffDeletedProjects));
router.post('/cleanup-error-logs', CronAuthMiddleware, AsyncHandler(DeleteErrorLogsFiles));

export default router