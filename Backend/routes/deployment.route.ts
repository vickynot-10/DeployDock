import express from "express";
import { GetDeployMentsPagination ,BulkDeleteDeployments, getDeployMentLogs , DeleteDeployments} from "../controllers/deployment.controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { AsyncHandler } from "../helpers/async.handler";
const router = express.Router();

router.get("/",AuthMiddleware ,AsyncHandler(GetDeployMentsPagination));
router.get("/logs/:deployment_id",AuthMiddleware ,AsyncHandler(getDeployMentLogs));
router.delete("/:id",AuthMiddleware ,AsyncHandler(DeleteDeployments));
router.post("/bulk-delete",AuthMiddleware ,AsyncHandler(BulkDeleteDeployments));

export default router;
