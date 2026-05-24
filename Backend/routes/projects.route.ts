import express from "express";
import {
  SaveProjects,
  getProjectByID,
  GetProjectsPagination,
  DeleteProject,
  DeployProject,
  fetchGitHubReps,
  fetchGitHubBranches,
  StatusProjectChange,
  RestartProject,
  StopProject,
  ProjectRunTimLogs,
  RollBackProject,
  AutoDetectProject,
} from "../controllers/project.controller";
import { AuthMiddleware } from "../middlewares/auth.middleware";
import { AsyncHandler } from "../helpers/async.handler";

const router = express.Router();
router.post("/", AuthMiddleware,AsyncHandler( SaveProjects));
router.get("/run-time-logs", AuthMiddleware,AsyncHandler( ProjectRunTimLogs));
router.post("/restart", AuthMiddleware,AsyncHandler( RestartProject));
router.post("/rollback", AuthMiddleware,AsyncHandler( RollBackProject));
router.post("/stop", AuthMiddleware,AsyncHandler( StopProject));
router.patch("/", AuthMiddleware,AsyncHandler( StatusProjectChange));
router.get("/", AuthMiddleware,AsyncHandler( GetProjectsPagination));
router.delete("/:id", AuthMiddleware,AsyncHandler( DeleteProject));
router.get("/:id", AuthMiddleware,AsyncHandler( getProjectByID));

router.post("/deploy/:id", AuthMiddleware,AsyncHandler( DeployProject));
router.get("/github/repos", AuthMiddleware,AsyncHandler( fetchGitHubReps));
router.get("/github/branches", AuthMiddleware,AsyncHandler( fetchGitHubBranches));
router.get("/github/project-info", AuthMiddleware,AsyncHandler( AutoDetectProject));

export default router;
