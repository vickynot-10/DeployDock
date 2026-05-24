import { Request, Response } from "express";
import { getDb } from "../libs/mongodb";
import { isStringEmpty } from "../helpers/checkIfStringEmpty";

import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function ProcessTimLogs(req: Request, res: Response) {
  try {
    let pm2_processes: any[] = [];
    try {
      const { stdout } = await execFileAsync("pm2", ["jlist"]);
      pm2_processes = JSON.parse(stdout.trim()).map((p: any) => ({
        id: p.pm_id,
        name: p.name,
        status: p.pm2_env.status,
        cpu: p.monit.cpu,
        memory: p.monit.memory,
        restarts: p.pm2_env.restart_time,
        uptime: p.pm2_env.pm_uptime,
      }));
    } catch {
      pm2_processes = [];
    }

    return res.status(200).json({ data: pm2_processes });
  } catch(e) {
    throw e
  }
}

export async function ProjectProcessTimLogs(req: Request, res: Response) {
  try {
    const { app_name, lines } = req.query as {
      app_name: string;
      lines: string;
    };

    if (!app_name) {
      return res.status(400).json({ msg: "Invalid Processes" });
    }

    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const db = await getDb(tenant_key);

    const project = await db.collection("projects").findOne(
      {
        dels: 0,
        process_name: {
          $exists: true,
          $regex: app_name,
          $options: "i",
        },
      },
      { projection: { project_name: 1, process_name: 1 } },
    );

    if (!project || !project._id) {
      return res.status(400).json({ msg: "Project Not found" });
    }

    if (!project.process_name || isStringEmpty(project.process_name)) {
      return res.status(400).json({ msg: "Process name is Empty" });
    }

    const lineCount = Math.max(1, parseInt(lines) || 50);

    const { stdout, stderr } = await execFileAsync("pm2", [
      "logs",
      project.process_name,
      "--lines",
      String(lineCount),
      "--nostream",
    ]);

    const raw = stdout + "\n" + stderr;

    const runtime_logs = raw
      .split("\n")
      .map((line) => line.replace(/\x1b\[[0-9;]*m/g, "").trim())
      .filter((line) => line !== "" && !line.includes("[TAILING]"));

    return res
      .status(200)
      .json({ data: project, runtime_logs });
  } catch(e) {
    throw e
  }
}
