import { Router } from "express";
import {
  CreateServer,
  GetServerById,
  GetServersPagination,
  DeleteServer,
  StatusServerChange,ServersList,
  BulkDeleteServers,
} from "../controllers/servers.controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { AsyncHandler } from "../helpers/async.handler";

const router = Router();

router.use(AuthMiddleware);
router.get("/servers-list",AsyncHandler(ServersList))
router.patch("/",AsyncHandler( StatusServerChange));
router.post("/",AsyncHandler( CreateServer));
router.get("/",AsyncHandler( GetServersPagination));
router.get("/:id",AsyncHandler( GetServerById));
router.delete("/:id",AsyncHandler( DeleteServer));
router.post("/bulk-delete",AsyncHandler( BulkDeleteServers));


export default router;
