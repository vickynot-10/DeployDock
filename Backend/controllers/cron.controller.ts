import { Request, Response } from "express";
import { getDb } from "../libs/mongodb";
import { LogError } from "../helpers/LogErrors";
import fs from "fs";
import path from "path";

// project logs wil be deleted and project itself would eb deleted if it have dels : 1 status
export async function DeleteLogsOffDeletedProjects(
  req: Request,
  res: Response,
) {
  try {
    const main_db = await getDb();

    if (!main_db) {
      return res
        .status(500)
        .json({ message: "Failed to connect Main Database" });
    }

    const get_tenant_keys = await main_db
      .collection("users")
      .find({}, { projection: { tenant_id: 1 } })
      .toArray();

    if (!get_tenant_keys || get_tenant_keys.length <= 0) {
      return res.status(200).json({ message: "No tenants found, skipping" });
    }

    for (const tenant of get_tenant_keys) {
      if (!tenant?._id || !tenant?.tenant_id) continue;

      const tenant_key = `tenant_${tenant.tenant_id}`;
      const tenant_db = await getDb(tenant_key);

      if (!tenant_db) continue;

      const active_projects = await tenant_db
        .collection("projects")
        .find({ dels: 0 }, { projection: { _id: 1 } })
        .toArray();

      const active_project_ids = active_projects.map((p) => p._id);

      await Promise.all([
        tenant_db.collection("runtime_logs").deleteMany({
          fk_project_id: { $nin: active_project_ids },
        }),
        tenant_db.collection("deploy_logs").deleteMany({
          fk_project_id: { $nin: active_project_ids },
        }),
        tenant_db.collection("webhook_logs").deleteMany({
          fk_project_id: { $nin: active_project_ids },
        }),
        tenant_db.collection("automation").deleteMany({
          fk_project_id: { $nin: active_project_ids },
        }),
        tenant_db.collection("deployments").deleteMany({
          fk_project_id: { $nin: active_project_ids },
        }),
        tenant_db.collection("successful_deployments").deleteMany({
          fk_project_id: { $nin: active_project_ids },
        }),
      ]);

      await tenant_db
        .collection("projects")
        .deleteMany({ _id: { $nin: active_project_ids } });
    }

    return res
      .status(200)
      .json({ message: "Delete Project Logs Cron Executed" });
  } catch (e) {
    LogError(`Delete Project Logs Cron Error ${e}`);
    return res.status(500).json({ message: "Project Logs Cleanup failed" });
  }
}

// all the error log files will removed from server for example , if cron hits on 23-05-2026 then files before that days will be removed
export async function DeleteErrorLogsFiles(req: Request, res: Response) {
  try {
    const logDir = path.join(process.cwd(), "error_logs");

    if (!fs.existsSync(logDir)) {
      return res.status(200).json({ message: "Error Folder not found" });
    }
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const d = String(yesterday.getDate()).padStart(2, "0");
    const m = String(yesterday.getMonth() + 1).padStart(2, "0");
    const y = String(yesterday.getFullYear()).slice(-2);

    const filePath = path.join(logDir, `error_${d}-${m}-${y}.txt`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return res
      .status(200)
      .json({ message: "Removing Error Logs Cron Executed" });
  } catch (e) {
    LogError(`Removing Error Logs Cron ${e}`);
    return res.status(500).json({ message: "Removing Error Logs Cron failed" });
  }
}
