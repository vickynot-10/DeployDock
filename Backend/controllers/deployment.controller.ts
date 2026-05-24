import { Request, Response } from "express";
import { getDb } from "../libs/mongodb";
import { ObjectId } from "mongodb";

export async function GetDeployMentsPagination(req: Request, res: Response) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const db = await getDb(tenant_key);

    const pipeline: any[] = [
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
            {
              $project: {
                project_name: 1,
              },
            },
          ],
          as: "result",
        },
      },
      {
        $unwind: {
          path: "$result",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    if (search && search.trim() !== "") {
      pipeline.push({
        $match: {
          "result.project_name": {
            $regex: search,
            $options: "i",
          },
        },
      });
    }

    pipeline.push(
      {
        $project: {
          project_name: "$result.project_name",
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
        $skip: skip,
      },
      {
        $limit: limit,
      },
    );

    const get_data = await db
      .collection("deployments")
      .aggregate(pipeline)
      .toArray();

    if (!get_data || get_data.length <= 0) {
      return res.status(200).json({
        data: [],
        total: 0,
      });
    }

    const totalPipeline: any[] = [
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
            {
              $project: {
                project_name: 1,
              },
            },
          ],
          as: "result",
        },
      },
      {
        $unwind: {
          path: "$result",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    if (search && search.trim() !== "") {
      totalPipeline.push({
        $match: {
          "result.project_name": {
            $regex: search,
            $options: "i",
          },
        },
      });
    }

    totalPipeline.push({
      $count: "total",
    });

    const totalResult = await db
      .collection("deployments")
      .aggregate(totalPipeline)
      .toArray();

    const total = totalResult[0]?.total || 0;

    return res.status(200).json({
      data: get_data,
      total,
    });
  } catch (e) {
    throw e
  }
}
export async function getDeployMentLogs(req: Request, res: Response) {
  try {
    const { deployment_id } = req.params as { deployment_id: string };

    if (!deployment_id || !ObjectId.isValid(deployment_id)) {
      return res.status(400).json({ msg: "Invalid Data" });
    }

    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const db = await getDb(tenant_key);
    const deployment_id_obj_id = new ObjectId(deployment_id);

    const [logs, deployment] = await Promise.all([
      db
        .collection("deploy_logs")
        .find(
          {
            fk_deployment_id: deployment_id_obj_id,
          },
          {
            projection: {
              _id: 0,
              message: 1,
              deployed_at: 1,
              log_type: 1,
            },
          },
        )
        .sort({ deployed_at: -1 })
        .toArray(),
      db
        .collection("deployments")
        .aggregate([
          {
            $match: {
              _id: deployment_id_obj_id,
            },
          },
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
        ])
        .toArray(),
    ]);

    return res.status(200).json({
      logs: logs  || [],
      deployment: deployment.length > 0 ? deployment[0] : null ,
    });
  } catch (e) {
    throw e
  }
}
export async function DeleteDeployments(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({
        msg: "Invalid Deployment",
      });
    }

    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const db = await getDb(tenant_key);

    const delete_doc = await db.collection("deployments").deleteOne({
      _id: new ObjectId(id),
    });

    if (delete_doc.deletedCount <= 0) {
      return res.status(400).json({
        msg: "No Deployment Found",
      });
    }

    if (!delete_doc.acknowledged) {
      return res.status(400).json({
        msg: "Failed to Delete",
      });
    }

    return res.status(200).json({
      msg: "Deleted Successfully",
    });
  } catch (e) {
    throw e
  }
}

export async function BulkDeleteDeployments(req: Request, res: Response) {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        msg: "Invalid Deployments",
      });
    }

    if (ids.some((id: string) => !ObjectId.isValid(id))) {
      return res.status(400).json({ msg: "Invalid ID in list" });
    }

    const objectIds = ids
      .filter((id: string) => ObjectId.isValid(id))
      .map((id: string) => new ObjectId(id));

    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const db = await getDb(tenant_key);

    const result = await db
      .collection("deployments")
      .deleteMany({ _id: { $in: objectIds } });

    if (result.deletedCount <= 0) {
      return res.status(400).json({
        msg: "No deployments found",
      });
    }
    if (!result.acknowledged) {
      return res.status(400).json({
        msg: "Failed to Delete",
      });
    }

    return res.status(200).json({
      msg: `${result.deletedCount} Deployments Deleted Successfully`,
    });
  } catch (e) {
    throw e
  }
}
