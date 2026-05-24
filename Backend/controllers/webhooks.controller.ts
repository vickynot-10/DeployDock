import { Request, Response } from "express";
import { getDb, createWebhookLogs } from "../libs/mongodb";
import { ObjectId } from "mongodb";

export async function GetProjectList(req: Request, res: Response) {
  try {
    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const db = await getDb(tenant_key);

    const projects = await db
      .collection("projects")
      .find(
        { dels: 0 },
        {
          projection: {
            _id: 1,
            project_name: 1,
          },
        },
      )
      .toArray();

    return res.status(200).json({
      projects: projects || [],
    });
  } catch (e) {
    throw e
  }
}

export async function GetWebhookLogs(req: Request, res: Response) {
  try {
    const { project_id, start_date, end_date } = req.query as {
      project_id: string;
      start_date: string;
      end_date: string;
    };

    if (!project_id || !ObjectId.isValid(project_id)) {
      return res.status(400).json({
        msg: "Invalid Data",
      });
    }

    if (!start_date || !end_date) {
      return res
        .status(400)
        .json({ msg: "Start Date and End Date are required" });
    }
    if (new Date(start_date) > new Date(end_date)) {
      return res
        .status(400)
        .json({ msg: "Start Date must be before End Date" });
    }

    const tenant_key = (req as any).user.tenant_id;
    const db = await createWebhookLogs(tenant_key);

    const logs = await db
      .collection("webhook_logs")
      .aggregate([
        {
          $match: {
            fk_project_id: new ObjectId(project_id),
            timestamp: {
              $gte: new Date(start_date),
              $lte: new Date(end_date),
            },
          },
        },
        {
          $sort: { timestamp: -1 },
        },
        {
          $group: {
            _id: "$fk_deployment_id",
            logs: {
              $push: {
                _id: "$_id",
                msg: "$msg",
                status: "$status",
                timestamp: "$timestamp",
                branch : "$branch"
              },
            },
          },
        },
        {
          $project: {
            deployment_id: "$_id",
            logs: 1,
            _id: 0,
          },
        },
      ])
      .toArray();

    return res.status(200).json({
      data: logs || [],
    });
  } catch (e) {
    throw e
  }
}
