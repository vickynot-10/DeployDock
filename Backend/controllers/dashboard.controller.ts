import { Request, Response } from "express";
import { getDb } from "../libs/mongodb";
import { APP_CONSTANTS } from "../app.constants";

export async function DashBoardPage(req: Request, res: Response) {
  try {
    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const db = await getDb(tenant_key);

    const [
      total_no_projects,
      new_projects,
      running_projects,
      stopped_projects,
      recent_deployments_20_limit,
      recent_webhooks_20_limit,
    ] = await Promise.all([
      db.collection("projects").countDocuments({ dels: 0 }),
      db
        .collection("projects")
        .countDocuments({ dels: 0, status: APP_CONSTANTS.PROJECT_STATUS.NEW }),
      db.collection("projects").countDocuments({
        dels: 0,
        status: APP_CONSTANTS.PROJECT_STATUS.RUNNING,
      }),
      db.collection("projects").countDocuments({
        dels: 0,
        status: APP_CONSTANTS.PROJECT_STATUS.STOPPED,
      }),

      db
        .collection("deployments")
        .aggregate([
          {
            $lookup: {
              from: "projects",
              localField: "fk_project_id",
              foreignField: "_id",
              pipeline: [
                {
                  $match: {
                    dels: 0,
                  },
                },
              ],
              as: "project_result",
            },
          },
          {
            $unwind: {
              path: "$project_result",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              project_name: "$project_result.project_name",
              status: 1,
              deployed_at: 1,
              duration_seconds: 1,
              deployment_id: 1,
            },
          },
          {
            $sort: {
              deployed_at: -1,
            },
          },
          {
            $limit: 20,
          },
        ])
        .toArray(),

      db
        .collection("webhook_logs")
        .aggregate([
          {
            $lookup: {
              from: "projects",
              localField: "fk_project_id",
              foreignField: "_id",
              pipeline: [
                {
                  $match: {
                    dels: 0,
                  },
                },
              ],
              as: "project_result",
            },
          },
          {
            $unwind: {
              path: "$project_result",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              project_name: "$project_result.project_name",
              msg: 1,
              fk_deployment_id: 1,
              timestamp: 1,
              environment: "$project_result.environment",
            },
          },
          {
            $sort: {
              timestamp: -1,
            },
          },
          {
            $limit: 20,
          },
        ])
        .toArray(),
    ]);

    return res.status(200).json({
      total_no_projects,
      new_projects,
      running_projects,
      stopped_projects,
      recent_deployments_20_limit,
      recent_webhooks_20_limit,
    });
  } catch (e) {
    throw e;
  }
}
