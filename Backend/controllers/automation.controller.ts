import { Request, Response } from "express";
import { getDb } from "../libs/mongodb";
import { ObjectId } from "mongodb";

export async function GetAutomationPagination(req: Request, res: Response) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const skip = (page - 1) * limit;
    const tenant_key = `tenant_${(req as any).user.tenant_id}`;

    const db = await getDb(tenant_key);

    const get_data = await db
      .collection("projects")
      .find(
        { dels: 0, enable_webhook: true },
        {
          projection: {
            project_name: 1,
            deployed_at: 1,
            deploy_target: 1,
            repo_url: 1,
            branch: 1,
            enable_webhook: 1,
          },
        },
      )
      .sort({
        deployed_at: -1,
      })
      .skip(skip)
      .limit(limit)
      .toArray();

    if (!get_data || get_data.length <= 0) {
      return res.status(200).json({
        data: [],
        total: 0,
      });
    }

    const get_total = await db.collection("projects").countDocuments({
      dels: 0,
      enable_webhook: true,
    });

    return res.status(200).json({
      data: get_data,
      total: get_total,
    });
  } catch (e) {
    throw e
  }
}

export async function SaveAutomation(req: Request, res: Response) {
  try {
    const { nodes, project_id, edges } = req.body;

    if (!ObjectId.isValid(project_id)) {
      return res.status(400).json({
        msg: "Invalid Project",
      });
    }

    const tenant_key = `tenant_${(req as any).user.tenant_id}`;

    const db = await getDb(tenant_key);

    const is_project_enable = await db.collection("projects").findOne(
      {
        _id: new ObjectId(project_id),
        dels: 0,
        enable_webhook: true,
      },
      { projection: { _id: 1 } },
    );

    if (!is_project_enable || !is_project_enable._id) {
      return res.status(400).json({
        msg: "Project Doesnt enable Webhook",
      });
    }

    const update_doc = await db.collection("automation").updateOne(
      {
        fk_project_id: new ObjectId(project_id),
      },
      {
        $set: {
          created_on: new Date(),
          fk_project_id: new ObjectId(project_id),
          nodes,
          edges,
        },
      },
      {
        upsert: true,
      },
    );

    if (update_doc.modifiedCount > 0 || update_doc.upsertedId) {
      return res.status(200).json({
        is_saved: true,
        msg: update_doc.modifiedCount
          ? "Automation Updated Successfully"
          : "Automation Created Successfully",
      });
    } else {
      return res.status(400).json({
        msg: "No changes were made",
      });
    }
  } catch (e) {
    throw e
  }
}

export async function getProjectByID(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({
        msg: "Invalid Data",
      });
    }

    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const db = await getDb(tenant_key);
    const get_doc = await db
      .collection("projects")
      .aggregate([
        {
          $match: { _id: new ObjectId(id) ,    enable_webhook : true , dels : 0 },
        },
        {
          $lookup: {
            from: "automation",
            localField: "_id",
            foreignField: "fk_project_id",
            as: "automation_result",
          },
        },
        {
          $unwind: {
            path: "$automation_result",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            project_name: 1,
            edges: "$automation_result.edges",
            nodes: "$automation_result.nodes",
          },
        },
      ])
      .toArray();

    if (!get_doc || get_doc.length <= 0) {
      return res.status(400).json({
        msg: "No Projects Found !",
      });
    }

    return res.status(200).json({
      data: get_doc && get_doc.length ? get_doc[0] : {},
    });
  } catch (e) {
    throw e
  }
}
