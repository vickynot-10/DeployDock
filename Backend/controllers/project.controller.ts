import { Request, Response } from "express";
import { z } from "zod";
import {
  getDb,
  createTenantDeployLogs,
  createRunTimeDeployLogs,
} from "../libs/mongodb";
import { ObjectId } from "mongodb";
import { broadcast } from "../libs/SSE";
import { Worker } from "worker_threads";

import axios from "axios";
import path from "path";
import { Client } from "ssh2";
import { encrypt, decrypt } from "../helpers/Encryption";
import { APP_CONSTANTS } from "../app.constants";
import {
  RegisterWebHook,
  DeleteGithubWebhook,
} from "../services/github.service";
import { generate_deployment_uid } from "../helpers/GenerateDeployUID";

const ProjectSchema = z
  .object({
    id: z.string().optional(),
    enable_webhook: z.boolean().optional(),
    project_name: z
      .string({ error: "Project name is required" })
      .min(1, "Project name is required"),
    environment: z.enum(["development", "staging", "production"], {
      error: "Environment is required",
    }),
    description: z.string().optional(),
    fk_server_id: z.string().optional(),
    repo_full_name: z.string().optional(),
    is_private: z.boolean().optional(),
    repo_url: z.string().url("Invalid repository URL").optional(),
    branch: z.string().optional(),
    deploy_script: z.string().optional(),
    stop_script: z.string().optional(),

    ssh_host: z.string().optional(),
    ssh_user: z.string().optional(),
    ssh_key: z.string().optional(),
    deploy_type: z.union([z.literal(1), z.literal(2)]).optional(),
    environment_variables: z.string().optional(),
    process_name: z.string().optional(),
    nginx_config: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const require = (field: keyof typeof data, message: string) => {
      if (!data[field]?.toString().trim()) {
        ctx.addIssue({ path: [field], code: z.ZodIssueCode.custom, message });
      }
    };

    require("repo_url", "Repository URL is required");
    require("branch", "Branch is required");

    if (!data.fk_server_id) {
      ctx.addIssue({
        path: ["fk_server_id"],
        code: z.ZodIssueCode.custom,
        message: "Please select a server",
      });
    }

    const is_docker = data.deploy_type === APP_CONSTANTS.DEPLOY_TYPE.DOCKER;

    if (data.fk_server_id === "custom") {
      require("ssh_host", "SSH host is required");
      require("ssh_user", "SSH user is required");
      require("ssh_key", "SSH private key is required");
      require("deploy_script", "Deploy script is required");
    }

    if (is_docker) {
      require("deploy_script", "Deploy script is required");
    }
  });

const mask = (val: string) =>
  "*".repeat(Math.max(0, val.length - 3)) + val.slice(-3);

export async function SaveProjects(req: Request, res: Response) {
  try {
    const result = ProjectSchema.safeParse(req.body);

    if (!result.success) {
      const issue = result.error.issues[0];
      return res
        .status(400)
        .json({ msg: issue.message || "Please fill required fields" });
    }

    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const db = await getDb(tenant_key);
    const { id, ...rest } = result.data;

    const is_custom = rest.fk_server_id === "custom";
    const masked_fields: string[] = [];

    if (!rest.deploy_type) {
      rest.deploy_type = APP_CONSTANTS.DEPLOY_TYPE.SSH as 1;
    }

    if (rest.deploy_script) {
      (rest as any).deploy_script = rest.deploy_script
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    }

    if (rest.environment_variables) {
      const parsed_env = rest.environment_variables
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => {
          const [key, ...valueParts] = line.split("=");

          return {
            key: key.trim(),
            value: encrypt(valueParts.join("=").trim()),
          };
        });

      (rest as any).environment_variables = parsed_env;
    }

    if (
      !is_custom &&
      rest.fk_server_id &&
      ObjectId.isValid(rest.fk_server_id)
    ) {
      (rest as any).fk_server_id = new ObjectId(rest.fk_server_id);
    } else if (is_custom) {
      if (rest.ssh_key && !rest.ssh_key.trim().startsWith("*")) {
        rest.ssh_key = encrypt(rest.ssh_key.trim());
      } else {
        masked_fields.push("ssh_key");
        delete rest.ssh_key;
      }

      if (rest.ssh_host && !rest.ssh_host.startsWith("***")) {
        rest.ssh_host = encrypt(rest.ssh_host.trim());
      } else {
        masked_fields.push("ssh_host");
        delete rest.ssh_host;
      }

      if (rest.ssh_user && !rest.ssh_user.startsWith("**")) {
        rest.ssh_user = encrypt(rest.ssh_user.trim());
      } else {
        masked_fields.push("ssh_user");
        delete rest.ssh_user;
      }
    }

    const created_by = (req as any).user.user_id || null;

    if (!created_by || !ObjectId.isValid(created_by)) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    if (id && ObjectId.isValid(id)) {
      const update_data = await db.collection("projects").updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            ...rest,
            updated_by: new ObjectId(created_by),
            updated_on: new Date(),
          },
        },
      );

      if (!update_data.matchedCount) {
        return res.status(404).json({ msg: "Project not found" });
      }

      return res
        .status(200)
        .json({ msg: "Project Updated Successfully", is_updated: true });
    }

    const insert_data = await db.collection("projects").insertOne({
      ...rest,
      created_by: new ObjectId(created_by),
      status: APP_CONSTANTS.PROJECT_STATUS.NEW,
      created_on: new Date(),
      updated_on: new Date(),
      dels: 0,
    });

    if (!insert_data || !insert_data.acknowledged || !insert_data.insertedId) {
      return res.status(400).json({ msg: "Error occurred, please try again" });
    }

    const user_details = (req as any).user;
    if (
      user_details.provider === "github" &&
      rest.repo_full_name &&
      rest.enable_webhook
    ) {
      const root_db = await getDb();
      const get_user = await root_db
        .collection("users")
        .findOne(
          { _id: new ObjectId(user_details.user_id) },
          { projection: { github_token: 1 } },
        );

      if (get_user && get_user.github_token) {
        const access_token = decrypt(get_user.github_token);
        const hook_id = await RegisterWebHook(
          access_token,
          rest.repo_full_name,
          insert_data.insertedId.toString(),
          (req as any).user.tenant_id,
        );

        if (hook_id) {
          await db
            .collection("projects")
            .updateOne(
              { _id: insert_data.insertedId },
              { $set: { hook_id, enable_webhook: true } },
            );
        }
      }
    }

    return res
      .status(200)
      .json({ msg: "Project Created Successfully", is_created: true });
  } catch (e) {
    throw e;
  }
}

export async function GetProjectsPagination(req: Request, res: Response) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search as string;
    const type = req.query.type as string;

    const type_number = Number(type) || 0;

    const matchStage: any = {
      dels: 0,
      status: type_number,
    };

    if (search && search.trim() !== "") {
      matchStage.project_name = {
        $regex: search,
        $options: "i",
      };
    }

    const skip = (page - 1) * limit;

    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const db = await getDb(tenant_key);

    const get_data = await db
      .collection("projects")
      .aggregate([
        {
          $match: matchStage,
        },
        {
          $lookup: {
            from: "servers",
            localField: "fk_server_id",
            foreignField: "_id",
            pipeline: [
              {
                $project: {
                  server_type: 1,
                },
              },
            ],
            as: "server",
          },
        },
        {
          $unwind: {
            path: "$server",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "deployments",
            localField: "last_deployed_id",
            foreignField: "_id",
            as: "last_deployment_status",
          },
        },
        {
          $unwind: {
            path: "$last_deployment_status",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "successful_deployments",
            localField: "_id",
            foreignField: "fk_project_id",
            pipeline: [
              { $sort: { deployed_at: -1 } },
              { $limit: 1 },
              { $project: { commit_sha: 1, deployed_at: 1, branch: 1 } },
            ],
            as: "last_success",
          },
        },
        {
          $unwind: {
            path: "$last_success",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            project_name: 1,
            last_deployed_at: 1,
            last_success: "$last_success.deployed_at",
            last_deployed_status: "$last_deployment_status.status",
            enable_webhook: 1,
            status: 1,
            environment: 1,
          },
        },
        {
          $sort: { last_deployed_at: -1 },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ])
      .toArray();

    if (!get_data || get_data.length <= 0) {
      return res.status(200).json({
        data: [],
        total: 0,
      });
    }

    const get_total = await db
      .collection("projects")
      .countDocuments(matchStage);

    return res.status(200).json({
      data: get_data,
      total: get_total,
    });
  } catch (e) {
    throw e;
  }
}

export async function DeleteProject(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid Data" });
    }

    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const db = await getDb(tenant_key);

    const project = await db.collection("projects").findOne(
      { _id: new ObjectId(id), dels: 0 },
      {
        projection: {
          hook_id: 1,
          repo_full_name: 1,
          enable_webhook: 1,
          ssh_host: 1,
          ssh_user: 1,
          ssh_key: 1,
          fk_server_id: 1,
          project_name: 1,
          stop_script: 1,
          process_name: 1,
        },
      },
    );

    if (!project) {
      return res.status(400).json({ msg: "Project Not Found" });
    }
    let ssh_host: string, ssh_user: string, ssh_key: string;
    const is_custom = project.fk_server_id === "custom";

    if (is_custom) {
      ssh_host = decrypt(project.ssh_host);
      ssh_user = decrypt(project.ssh_user);
      ssh_key = decrypt(project.ssh_key);
    } else {
      const server = await db
        .collection("servers")
        .findOne({ _id: new ObjectId(project.fk_server_id) });

      if (!server) return res.status(404).json({ msg: "Server not found" });

      ssh_host = decrypt(server.ssh_host);
      ssh_user = decrypt(server.ssh_user);
      ssh_key = decrypt(server.ssh_key);
    }

    if (ssh_host && ssh_user && ssh_key) {
      const stop_cmd = project.stop_script
        ? project.stop_script
        : `pm2 delete "${project.process_name || project.project_name.toLowerCase()}"`;

      const { output, code } = await run_ssh_command(
        ssh_host,
        ssh_user,
        ssh_key,
        stop_cmd,
      );

      if (code !== 0) {
        await db.collection("runtime_logs").insertOne({
          status: APP_CONSTANTS.PROJECT_STATUS.STOPPED,
          timestamp: new Date(),
          fk_project_id: project._id,
          updated_by: new ObjectId((req as any).user.user_id),
          type: "error",
          msg: `${project.project_name} failed to stop before deletion`,
          details: output,
        });
      }
    }

    const delete_project = await db
      .collection("projects")
      .updateOne({ _id: new ObjectId(id) }, { $set: { dels: 1 } });

    if (!delete_project.acknowledged) {
      return res.status(400).json({ msg: "Error occurred, Try Again!" });
    }

    if (delete_project.matchedCount <= 0) {
      return res.status(400).json({ msg: "Project might already be deleted!" });
    }

    if (
      project?.hook_id &&
      project?.repo_full_name &&
      project?.enable_webhook
    ) {
      const user_details = (req as any).user;
      const root_db = await getDb();

      const get_user = await root_db
        .collection("users")
        .findOne(
          { _id: new ObjectId(user_details.user_id) },
          { projection: { github_token: 1 } },
        );

      if (get_user?.github_token) {
        const access_token = decrypt(get_user.github_token);
        await DeleteGithubWebhook(
          access_token,
          project.repo_full_name,
          Number(project.hook_id),
        ).catch(() => null);
      }
    }

    return res.status(200).json({
      msg: "Deleted Successfully!",
      is_deleted: true,
    });
  } catch (e) {
    throw e;
  }
}

export async function StatusProjectChange(req: Request, res: Response) {
  try {
    const user_details = (req as any).user;

    if (!user_details || user_details.provider !== "github") {
      return res.status(400).json({
        msg: "To Enable Webhook , You must Logged In as github",
      });
    }

    const { id, status } = req.body;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({
        msg: "Invalid Data",
      });
    }

    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const db = await getDb(tenant_key);

    const project = await db
      .collection("projects")
      .findOne(
        { _id: new ObjectId(id), dels: 0 },
        { projection: { repo_full_name: 1, hook_id: 1, enable_webhook: 1 } },
      );

    if (!project) {
      return res.status(400).json({ msg: "Project Not Found" });
    }

    const root_db = await getDb();
    const get_user = await root_db
      .collection("users")
      .findOne(
        { _id: new ObjectId(user_details.user_id) },
        { projection: { github_token: 1 } },
      );
    if (!get_user?.github_token) {
      return res
        .status(400)
        .json({ msg: "GitHub token not found, try logging in again" });
    }
    const access_token = decrypt(get_user.github_token);

    let update_doc;
    if (status === true && !project.hook_id) {
      const new_hook_id = await RegisterWebHook(
        access_token,
        project.repo_full_name,
        id,
        user_details.tenant_id,
      );
      update_doc = await db.collection("projects").updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            enable_webhook: true,
            hook_id: new_hook_id,
            updated_on: new Date(),
          },
        },
      );
    } else if (project.hook_id && status === true) {
      update_doc = await db.collection("projects").updateOne(
        {
          _id: new ObjectId(id),
        },
        {
          $set: {
            enable_webhook: status,
            updated_on: new Date(),
          },
        },
      );
    } else if (status === false && project.hook_id) {
      [, update_doc] = await Promise.all([
        DeleteGithubWebhook(
          access_token,
          project.repo_full_name,
          Number(project.hook_id),
        ).catch(() => null),
        db.collection("projects").updateOne(
          {
            _id: new ObjectId(id),
          },
          {
            $set: {
              enable_webhook: status,
              updated_on: new Date(),
            },
          },
        ),
      ]);
    }

    if (!update_doc) {
      return res.status(400).json({
        msg: "Failed to Register in Project",
      });
    }

    if (update_doc.matchedCount === 0) {
      return res.status(400).json({
        msg: "Project Not Found",
      });
    }

    if (update_doc.modifiedCount === 0) {
      return res.status(400).json({
        msg: "Failed to Enable , Please Try Again !",
      });
    }

    return res.status(200).json({
      msg: `WebHook Event ${status === true ? "Enabled" : "Disabled"} Successfully !`,
      is_enabled: true,
    });
  } catch (e) {
    throw e;
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
    const get_doc = await db.collection("projects").findOne({
      _id: new ObjectId(id),
      dels: 0,
    });

    if (!get_doc) {
      return res.status(400).json({
        msg: "Projects Not Found !",
      });
    }

    if (get_doc.environment_variables) {
      get_doc.environment_variables = get_doc.environment_variables
        .map((env: any) => {
          return `${env.key}=${decrypt(env.value)}`;
        })
        .join("\n");
    }

    return res.status(200).json({
      data: {
        ...get_doc,
        ssh_key: get_doc.ssh_key ? mask(decrypt(get_doc.ssh_key)) : undefined,
        ssh_host: get_doc.ssh_host
          ? mask(decrypt(get_doc.ssh_host))
          : undefined,
        ssh_user: get_doc.ssh_user
          ? mask(decrypt(get_doc.ssh_user))
          : undefined,
      },
    });
  } catch (e) {
    throw e;
  }
}

export async function fetchGitHubReps(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (
      !user ||
      typeof user === "string" ||
      !user.provider ||
      user.provider !== "github"
    ) {
      return res.status(200).json({
        msg: "Not GH user",
      });
    }

    const db = await getDb();

    const get_user = await db.collection("users").findOne(
      {
        _id: new ObjectId(user.user_id),
      },
      {
        projection: {
          github_token: 1,
        },
      },
    );

    if (!get_user) {
      return res.status(400).json({
        msg: "User not found , Try Logging again!",
      });
    }

    if (!get_user.github_token) {
      return res.status(400).json({
        msg: "GitHub Profile not found , Try Logging in Github",
      });
    }
    const access_token = decrypt(get_user.github_token);
    const githubRes = await axios.get(
      "https://api.github.com/user/repos?sort=updated",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    );

    const repos = githubRes.data;
    const result = [];

    for (let i = 0; i < repos.length; i++) {
      result.push({
        repo_id: repos[i].id,
        name: repos[i].name,
        repo_full_name: repos[i].full_name,
        owner: repos[i].owner.login,
        repo_url: repos[i].clone_url,
        ssh_url: repos[i].ssh_url,
        default_branch: repos[i].default_branch,
        is_private: repos[i].private,
      });
    }

    return res.status(200).json({
      data: result || [],
    });
  } catch (e) {
    throw e;
  }
}

export async function fetchGitHubBranches(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (
      !user ||
      typeof user === "string" ||
      !user.provider ||
      user.provider !== "github"
    ) {
      return res.status(400).json({ msg: "Error Occured" });
    }

    const repo = req.query.repo as string;
    if (!repo) {
      return res.status(400).json({ msg: "Repo is required" });
    }

    const db = await getDb();
    const get_user = await db
      .collection("users")
      .findOne(
        { _id: new ObjectId(user.user_id) },
        { projection: { github_token: 1 } },
      );

    if (!get_user || !get_user.github_token) {
      return res.status(400).json({ msg: "GitHub token not found" });
    }

    const access_token = decrypt(get_user.github_token);
    const githubRes = await axios.get(
      `https://api.github.com/repos/${repo}/branches`,
      { headers: { Authorization: `Bearer ${access_token}` } },
    );

    const branches = githubRes.data;
    const result = [];

    for (let i = 0; i < branches.length; i++) {
      result.push({ name: branches[i].name });
    }

    return res.status(200).json({ data: result });
  } catch (e) {
    throw e;
  }
}

export async function DeployProject(req: Request, res: Response) {
  try {
    const { id } = req.params as { id: string };
    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({
        msg: "Invalid Data",
      });
    }

    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const user_id = (req as any).user.user_id;
    if (!user_id || !ObjectId.isValid(user_id)) {
      return res.status(401).json({
        msg: "UnAuthorized",
      });
    }

    const mainDB = await getDb();
    const findUser = await mainDB.collection("users").findOne(
      {
        _id: new ObjectId(user_id),
      },
      {
        projection: {
          github_token: 1,
        },
      },
    );

    if (!findUser) {
      return res
        .status(401)
        .json({ msg: "User Not Found , Try Loggin In again !" });
    }

    const db = await getDb(tenant_key);
    const [project] = await db
      .collection("projects")
      .aggregate([
        { $match: { _id: new ObjectId(id), dels: 0 } },

        {
          $lookup: {
            from: "servers",
            let: {
              server_id: {
                $cond: {
                  if: { $eq: [{ $type: "$fk_server_id" }, "objectId"] },
                  then: "$fk_server_id",
                  else: null,
                },
              },
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $ne: ["$$server_id", null] },
                      { $eq: ["$_id", "$$server_id"] },
                    ],
                  },
                },
              },
              {
                $project: {
                  ssh_host: 1,
                  ssh_user: 1,
                  ssh_key: 1,
                  server_type: 1,
                },
              },
            ],
            as: "_server",
          },
        },

        {
          $addFields: {
            _server_doc: { $arrayElemAt: ["$_server", 0] },
            _is_custom: { $eq: ["$fk_server_id", "custom"] },
          },
        },

        {
          $addFields: {
            ssh_host: {
              $cond: ["$_is_custom", "$ssh_host", "$_server_doc.ssh_host"],
            },
            ssh_user: {
              $cond: ["$_is_custom", "$ssh_user", "$_server_doc.ssh_user"],
            },
            ssh_key: {
              $cond: ["$_is_custom", "$ssh_key", "$_server_doc.ssh_key"],
            },
            remote_path: "$remote_path",
          },
        },
        {
          $project: {
            _server: 0,
            _server_doc: 0,
            _is_custom: 0,
            enable_webhook: 0,
            hook_id: 0,
            created_on: 0,
            updated_on: 0,
            description: 0,
          },
        },
      ])
      .toArray();

    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }

    const tenantDb = await createTenantDeployLogs((req as any).user.tenant_id);

    let deployment;
    try {
      deployment = await tenantDb.collection("deployments").insertOne({
        fk_project_id: new ObjectId(id),
        status: APP_CONSTANTS.DEPLOYMENT_STATUS.RUNNING,
        deployed_at: new Date(),
        duration_seconds: 0,
        deployment_id: generate_deployment_uid(),
      });
    } catch (e: any) {
      if (e?.code === 11000) {
        return res.status(409).json({
          msg: "A deployment is already running for this project",
        });
      }
      throw e;
    }

    if (!deployment || !deployment.insertedId) {
      return res.status(400).json({
        msg: "Failed to Deploy",
      });
    }
    const deployment_id = deployment.insertedId.toString();
    if (
      !project.deploy_script ||
      !Array.isArray(project.deploy_script) ||
      project.deploy_script.length <= 0
    ) {
      await Promise.all([
        tenantDb.collection("deploy_logs").insertOne({
          deployed_at: new Date(),
          log_type: APP_CONSTANTS.WORKER_LOGS_TYPES.ERROR,
          fk_deployment_id: new ObjectId(deployment_id),
          fk_project_id: new ObjectId(id),
          message: "Deployment Scripts Cannot be Empty !",
        }),

        tenantDb.collection("deployments").updateOne(
          {
            _id: new ObjectId(deployment_id),
          },
          {
            $set: {
              status: APP_CONSTANTS.DEPLOYMENT_STATUS.FAILED,
              duration_seconds: 0,
            }
          },
        ),
      ]);
    }

    const isDev = process.env.NODE_ENV !== "production";

    const worker_path = isDev
      ? path.join(process.cwd(), "workers/deploy.worker.ts")
      : path.join(process.cwd(), "dist/workers/deploy.worker.js");

    const worker = new Worker(worker_path, {
      execArgv: isDev ? ["--require", "tsx/cjs"] : [],
      workerData: { project, gh_token: findUser.github_token ?? null },
    });

    const timeout = setTimeout(() => worker.terminate(), 10 * 60 * 1000);

    worker.on("message", async (msg) => {
      if (!msg) return;

      const is_completed =
        msg.status === APP_CONSTANTS.WORKER_LOGS_STATUS.COMPLETED;
      const is_success =
        is_completed && msg.type === APP_CONSTANTS.WORKER_LOGS_TYPES.SUCCESS;
      const is_error =
        is_completed && msg.type === APP_CONSTANTS.WORKER_LOGS_TYPES.ERROR;

      if (msg.message) {
        const now = new Date();
        await tenantDb.collection("deploy_logs").insertOne({
          deployed_at: new Date(),
          log_type: msg.type,
          fk_deployment_id: new ObjectId(deployment_id),
          fk_project_id: new ObjectId(id),
          message: msg.message,
        });

        broadcast(user_id, {
      type: "log",
      log_type: msg.type,
      message: msg.message,
      deployment_id,
      deployed_at: now.toISOString(),
    });
      }

      if (is_completed) clearTimeout(timeout);

      if (is_success) {
        await Promise.all([
          tenantDb.collection("deploy_logs").insertOne({
            deployed_at: new Date(),
            log_type: msg.type,
            fk_deployment_id: new ObjectId(deployment_id),
            fk_project_id: new ObjectId(id),
            message: msg.message,
          }),
          tenantDb.collection("deployments").updateOne(
            { _id: new ObjectId(deployment_id) },
            {
              $set: {
                status: APP_CONSTANTS.DEPLOYMENT_STATUS.SUCCESS,
                duration_seconds: Number(msg.duration_seconds ?? 0),
              },
            },
          ),
          db.collection("projects").updateOne(
            { _id: new ObjectId(id) },
            {
              $set: {
                last_deployed_at: new Date(),
                last_deployed_id: new ObjectId(deployment_id),
                status: APP_CONSTANTS.PROJECT_STATUS.RUNNING,
              },
            },
          ),
          tenantDb.collection("successful_deployments").insertOne({
            fk_project_id: new ObjectId(id),
            fk_deployment_id: new ObjectId(deployment_id),
            branch: project.branch,
            commit_sha: msg.commit_sha ?? null,
            deployed_at: new Date(),
          }),
        ]);
    broadcast(user_id, { type: "status", status: "success", deployment_id , 
          message: msg.message, });
      }

      if (is_error) {
        await tenantDb
          .collection("deployments")
          .updateOne(
            { _id: new ObjectId(deployment_id) },
            { $set: { status: APP_CONSTANTS.DEPLOYMENT_STATUS.FAILED } },
          );
       broadcast(user_id, { type: "status", status: "failed", deployment_id,   message: msg.message, });
      }
    });

    worker.on("error", async (e: any) => {
      broadcast(user_id, {
        type: "status",
        status: "failed",
        message: e.message,
        deployment_id
      });

      await Promise.all([
        tenantDb.collection("deploy_logs").insertOne({
          deployed_at: new Date(),
          log_type: APP_CONSTANTS.WORKER_LOGS_TYPES.ERROR,
          fk_deployment_id: new ObjectId(deployment_id),
          fk_project_id: new ObjectId(id),
          message: e.message,
        }),

        tenantDb.collection("deployments").updateOne(
          {
            _id: new ObjectId(deployment_id),
          },
          {
            status: APP_CONSTANTS.DEPLOYMENT_STATUS.FAILED,
            duration_seconds: 0,
          },
        ),
      ]);

      clearTimeout(timeout);
    });

    return res.status(200).json({
      msg: "Project Deployment Started...",
      success: true,
      deployment_id,
    });
  } catch (e) {
    throw e;
  }
}
export async function StopProject(req: Request, res: Response) {
  const tenant_key = (req as any).user.tenant_id;
  const project_id = req.body.id;
  let db: any = null;
  try {
    db = await createRunTimeDeployLogs(tenant_key);

    const project = await db
      .collection("projects")
      .findOne({ _id: new ObjectId(project_id), dels: 0 });

    if (!project) return res.status(404).json({ msg: "Project not found" });

    if (Number(project.status) === APP_CONSTANTS.PROJECT_STATUS.STOPPED) {
      return res.status(200).json({ msg: "Project is Already Stopped" });
    }

    let ssh_host: string, ssh_user: string, ssh_key: string;
    const is_custom = project.fk_server_id === "custom";
    const project_name = project.project_name.replace(/\s+/g, "-");

    if (is_custom) {
      ssh_host = decrypt(project.ssh_host);
      ssh_user = decrypt(project.ssh_user);
      ssh_key = decrypt(project.ssh_key);
    } else {
      const server = await db
        .collection("servers")
        .findOne({ _id: new ObjectId(project.fk_server_id) });
      if (!server) return res.status(404).json({ msg: "Server not found" });
      ssh_host = decrypt(server.ssh_host);
      ssh_user = decrypt(server.ssh_user);
      ssh_key = decrypt(server.ssh_key);
    }

    if (!ssh_host || !ssh_key || !ssh_user) {
      return res.status(400).json({ msg: "Missing Details" });
    }
    const stop_cmd = project.stop_script
      ? project.stop_script
      : `pm2 delete "${project.process_name || project_name.toLowerCase()}"`;
    const { output, code } = await run_ssh_command(
      ssh_host,
      ssh_user,
      ssh_key,
      stop_cmd,
    );

    if (code !== 0) {
      await db.collection("runtime_logs").insertOne({
        status: APP_CONSTANTS.PROJECT_STATUS.STOPPED,
        timestamp: new Date(),
        fk_project_id: project._id,
        updated_by: new ObjectId((req as any).user.user_id),
        type: "error",
        msg: `${project.project_name} failed to stop`,

        details: output,
      });
      return res.status(500).json({ msg: `Command failed: ${output}` });
    }

    await Promise.all([
      db.collection("projects").updateOne(
        { _id: new ObjectId(project_id) },
        {
          $set: {
            status: APP_CONSTANTS.PROJECT_STATUS.STOPPED,
            updated_on: new Date(),
          },
        },
      ),
      db.collection("runtime_logs").insertOne({
        status: APP_CONSTANTS.PROJECT_STATUS.STOPPED,
        timestamp: new Date(),
        fk_project_id: project._id,
        updated_by: new ObjectId((req as any).user.user_id),
        type: "completed",
        msg: `${project.project_name} stopped successfully`,
        details: output,
      }),
    ]);

    return res
      .status(200)
      .json({ msg: "Project stopped successfully", is_stopped: true });
  } catch (e: any) {
    if (db) {
      await db.collection("runtime_logs").insertOne({
        status: APP_CONSTANTS.PROJECT_STATUS.STOPPED,
        timestamp: new Date(),
        fk_project_id: project_id ? new ObjectId(project_id) : null,
        updated_by: new ObjectId((req as any).user.user_id),
        type: "error",
        msg: `Stop failed: ${e.message || "Unknown error"}`,
        details: e.level ?? null,
      });
    }

    throw e;
  }
}

export async function RestartProject(req: Request, res: Response) {
  try {
    const project_id = req.body.id;
    if (!project_id || !ObjectId.isValid(project_id)) {
      return res.status(400).json({ msg: "Invalid Data" });
    }

    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const user_id = (req as any).user.user_id;

    const mainDB = await getDb();
    const findUser = await mainDB
      .collection("users")
      .findOne(
        { _id: new ObjectId(user_id), github_token: { $exists: true } },
        { projection: { github_token: 1 } },
      );
    if (!findUser) return res.status(401).json({ msg: "User Not Found" });

    const db = await getDb(tenant_key);
    const [project] = await db
      .collection("projects")
      .aggregate([
        { $match: { _id: new ObjectId(project_id), dels: 0 } },
        {
          $lookup: {
            from: "servers",
            let: {
              server_id: {
                $cond: {
                  if: { $eq: [{ $type: "$fk_server_id" }, "objectId"] },
                  then: "$fk_server_id",
                  else: null,
                },
              },
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $ne: ["$$server_id", null] },
                      { $eq: ["$_id", "$$server_id"] },
                    ],
                  },
                },
              },
              { $project: { ssh_host: 1, ssh_user: 1, ssh_key: 1 } },
            ],
            as: "_server",
          },
        },
        {
          $addFields: {
            _server_doc: { $arrayElemAt: ["$_server", 0] },
            _is_custom: { $eq: ["$fk_server_id", "custom"] },
          },
        },
        {
          $addFields: {
            ssh_host: {
              $cond: ["$_is_custom", "$ssh_host", "$_server_doc.ssh_host"],
            },
            ssh_user: {
              $cond: ["$_is_custom", "$ssh_user", "$_server_doc.ssh_user"],
            },
            ssh_key: {
              $cond: ["$_is_custom", "$ssh_key", "$_server_doc.ssh_key"],
            },
          },
        },
        { $project: { _server: 0, _server_doc: 0, _is_custom: 0 } },
      ])
      .toArray();

    if (!project) return res.status(404).json({ msg: "Project not found" });

    if (
      !project.deploy_script ||
      !Array.isArray(project.deploy_script) ||
      project.deploy_script.length <= 0
    ) {
      await db.collection("runtime_logs").insertOne({
        timestamp: new Date(),
        fk_project_id: project._id,
        updated_by: new ObjectId(user_id),
        type: "error",
        msg: `${project.project_name} restart failed`,
        details: "Deploy script is empty",
      });
      return res.status(400).json({ msg: "Deploy script is empty" });
    }

    const isDev = process.env.NODE_ENV !== "production";
    const worker_path = isDev
      ? path.join(process.cwd(), "workers/deploy.worker.ts")
      : path.join(process.cwd(), "dist/workers/deploy.worker.js");

    const worker = new Worker(worker_path, {
      execArgv: isDev ? ["--require", "tsx/cjs"] : [],
      workerData: { project, gh_token: findUser.github_token },
    });

    const timeout = setTimeout(() => worker.terminate(), 10 * 60 * 1000);

    worker.on("message", async (msg) => {
      if (!msg) return;

      const is_completed =
        msg.status === APP_CONSTANTS.WORKER_LOGS_STATUS.COMPLETED;
      const is_success =
        is_completed && msg.type === APP_CONSTANTS.WORKER_LOGS_TYPES.SUCCESS;
      const is_error =
        is_completed && msg.type === APP_CONSTANTS.WORKER_LOGS_TYPES.ERROR;

      if (is_completed) clearTimeout(timeout);

      if (is_success) {
        await Promise.all([
          db.collection("projects").updateOne(
            { _id: new ObjectId(project_id) },
            {
              $set: {
                status: APP_CONSTANTS.PROJECT_STATUS.RUNNING,
                updated_on: new Date(),
              },
            },
          ),
          db.collection("runtime_logs").insertOne({
            timestamp: new Date(),
            fk_project_id: project._id,
            updated_by: new ObjectId(user_id),
            type: "completed",
            msg: `${project.project_name} restarted successfully`,
            details: msg.message,
          }),
        ]);
        broadcast(user_id, { type: "status", status: "success" });
      }

      if (is_error) {
        await db.collection("runtime_logs").insertOne({
          timestamp: new Date(),
          fk_project_id: project._id,
          updated_by: new ObjectId(user_id),
          type: "error",
          msg: `${project.project_name} restart failed`,
          details: msg.message,
        });
        broadcast(user_id, {
          type: "status",
          status: "failed",
          message: msg.message,
        });
      }
    });

    worker.on("error", async (e: any) => {
      clearTimeout(timeout);
      await db.collection("runtime_logs").insertOne({
        timestamp: new Date(),
        fk_project_id: project._id,
        updated_by: new ObjectId(user_id),
        type: "error",
        msg: `${project.project_name} restart failed`,
        details: e.message,
      });
    });

    return res
      .status(200)
      .json({ msg: "Project restarted successfully", is_restarted: true });
  } catch (e) {
    throw e;
  }
}

export async function RollBackProject(req: Request, res: Response) {
  try {
    const project_id = req.body.id;
    if (!project_id || !ObjectId.isValid(project_id)) {
      return res.status(400).json({ msg: "Invalid Data" });
    }

    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const user_id = (req as any).user.user_id;
    const db = await getDb(tenant_key);

    const last_success = await db
      .collection("successful_deployments")
      .findOne(
        { fk_project_id: new ObjectId(project_id), commit_sha: { $ne: null } },
        { sort: { deployed_at: -1 } },
      );

    if (!last_success || !last_success.commit_sha) {
      return res
        .status(400)
        .json({ msg: "No successful deployment found to rollback to" });
    }

    const [project] = await db
      .collection("projects")
      .aggregate([
        { $match: { _id: new ObjectId(project_id), dels: 0 } },

        {
          $lookup: {
            from: "servers",
            let: {
              server_id: {
                $cond: {
                  if: { $eq: [{ $type: "$fk_server_id" }, "objectId"] },
                  then: "$fk_server_id",
                  else: null,
                },
              },
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $ne: ["$$server_id", null] },
                      { $eq: ["$_id", "$$server_id"] },
                    ],
                  },
                },
              },
              {
                $project: {
                  ssh_host: 1,
                  ssh_user: 1,
                  ssh_key: 1,
                  server_type: 1,
                },
              },
            ],
            as: "_server",
          },
        },

        {
          $addFields: {
            _server_doc: { $arrayElemAt: ["$_server", 0] },
            _is_custom: { $eq: ["$fk_server_id", "custom"] },
          },
        },

        {
          $addFields: {
            ssh_host: {
              $cond: ["$_is_custom", "$ssh_host", "$_server_doc.ssh_host"],
            },
            ssh_user: {
              $cond: ["$_is_custom", "$ssh_user", "$_server_doc.ssh_user"],
            },
            ssh_key: {
              $cond: ["$_is_custom", "$ssh_key", "$_server_doc.ssh_key"],
            },
            remote_path: "$remote_path",
          },
        },
        {
          $project: {
            _server: 0,
            _server_doc: 0,
            _is_custom: 0,
            enable_webhook: 0,
            hook_id: 0,
            created_on: 0,
            updated_on: 0,
            description: 0,
          },
        },
      ])
      .toArray();

    if (!project) {
      return res.status(404).json({ msg: "Project not found" });
    }

    const mainDB = await getDb();
    const findUser = await mainDB.collection("users").findOne(
      {
        _id: new ObjectId(user_id),
      },
      {
        projection: {
          github_token: 1,
        },
      },
    );

    if (!findUser) {
      return res
        .status(401)
        .json({ msg: "User Not Found , Try Loggin In again !" });
    }

    const isDev = process.env.NODE_ENV !== "production";

    const worker_path = isDev
      ? path.join(process.cwd(), "workers/rollback.worker.ts")
      : path.join(process.cwd(), "dist/workers/rollback.worker.js");

    const worker = new Worker(worker_path, {
      execArgv: isDev ? ["--require", "tsx/cjs"] : [],
      workerData: {
        project,
        commit_sha: last_success.commit_sha,
        gh_token: findUser.github_token ?? null,
        updated_by: user_id,
      },
    });

    const timeout = setTimeout(() => worker.terminate(), 10 * 60 * 1000);

    const log_base = {
      timestamp: new Date(),
      fk_project_id: project._id,
      updated_by: new ObjectId(user_id),
    };

    worker.on("message", async (msg: any) => {
      if (!msg) return;
      const is_completed = msg.status === "completed";
      const is_success = is_completed && msg.type === "success";
      const is_error = is_completed && msg.type === "error";

      let details = [];

      if (msg.details) details.push(msg.details.toString());

      if (is_completed) clearTimeout(timeout);

      if (is_success) {
        await Promise.all([
          db.collection("runtime_logs").insertOne({
            ...log_base,
            type: "success",
            msg: `${project.project_name} Rollback Succeed`,
            details: details,
          }),
          db.collection("projects").updateOne(
            { _id: new ObjectId(project_id) },
            {
              $set: {
                status: APP_CONSTANTS.PROJECT_STATUS.RUNNING,
                updated_on: new Date(),
              },
            },
          ),
        ]);
      }

      if (is_error) {
        await Promise.all([
          db.collection("runtime_logs").insertOne({
            ...log_base,
            type: "error",
            msg: `${project.project_name} Rollback Failed`,
            details: details,
          }),
          db.collection("projects").updateOne(
            { _id: new ObjectId(project_id) },
            {
              $set: {
                status: APP_CONSTANTS.PROJECT_STATUS.STOPPED,
                updated_on: new Date(),
              },
            },
          ),
        ]);
      }
    });

    worker.on("error", async (e: any) => {
      await Promise.all([
        db.collection("runtime_logs").insertOne({
          ...log_base,
          type: "error",
          msg: `${project.project_name} Rollback failed`,
          details: e.message,
        }),
        db.collection("projects").updateOne(
          { _id: new ObjectId(project_id) },
          {
            $set: {
              status: APP_CONSTANTS.PROJECT_STATUS.STOPPED,
              updated_on: new Date(),
            },
          },
        ),
      ]);

      clearTimeout(timeout);
    });

    return res.status(200).json({
      msg: `Rolled back to ${last_success.commit_sha.slice(0, 7)}`,
      is_rolled_back: true,
    });
  } catch (e: any) {
    throw e;
  }
}

async function run_ssh_command(
  host: string,
  user: string,
  raw_key: string,
  command: string,
): Promise<{ output: string; code: number }> {
  return new Promise((resolve, reject) => {
    const client = new Client();

    const body = raw_key
      .replace(/-----BEGIN OPENSSH PRIVATE KEY-----/g, "")
      .replace(/-----END OPENSSH PRIVATE KEY-----/g, "")
      .trim()
      .replace(/ /g, "\n");

    const formatted_key = `-----BEGIN OPENSSH PRIVATE KEY-----\n${body}\n-----END OPENSSH PRIVATE KEY-----`;

    client.on("ready", () => {
      client.exec(command, (err, stream) => {
        if (err) {
          client.end();
          return reject(err);
        }
        let output = "";
        stream.on("data", (data: Buffer) => (output += data.toString()));
        stream.stderr.on("data", (data: Buffer) => (output += data.toString()));
        stream.on("close", (code: number) => {
          client.end();
          resolve({ output, code });
        });
      });
    });

    client.on("error", reject);
    client.connect({ host, username: user, privateKey: formatted_key });
  });
}

export async function ProjectRunTimLogs(req: Request, res: Response) {
  try {
    const { id, start_date, end_date } = req.query as {
      id: string;
      start_date: string;
      end_date: string;
    };

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({ msg: "Invalid Project" });
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
    const tenant_key = `tenant_${(req as any).user.tenant_id}`;
    const db = await getDb(tenant_key);

    const project = await db
      .collection("projects")
      .aggregate([
        {
          $match: { dels: 0, _id: new ObjectId(id) },
        },
        {
          $lookup: {
            from: "runtime_logs",
            localField: "_id",
            foreignField: "fk_project_id",
            pipeline: [
              {
                $match: {
                  timestamp: {
                    $gte: new Date(start_date),
                    $lte: new Date(end_date),
                  },
                },
              },
              { $sort: { timestamp: -1 } },
              {
                $lookup: {
                  from: "users",
                  localField: "updated_by",
                  foreignField: "_id",
                  pipeline: [{ $project: { name: 1 } }],
                  as: "user_details",
                },
              },
              {
                $unwind: {
                  path: "$user_details",
                  preserveNullAndEmptyArrays: true,
                },
              },
              {
                $addFields: {
                  user_name: "$user_details.name",
                },
              },
              {
                $project: {
                  fk_project_id: 0,
                  updated_by: 0,
                  user_details: 0,
                },
              },
            ],
            as: "runtime_logs",
          },
        },
        {
          $project: {
            project_name: 1,
            runtime_logs: 1,
          },
        },
      ])
      .toArray();

    return res.status(200).json({ data: project || [] });
  } catch (e) {
    console.error(e);
    throw e;
  }
}

export async function AutoDetectProject(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    if (
      !user ||
      typeof user === "string" ||
      !user.provider ||
      user.provider !== "github"
    ) {
      return res.status(400).json({ msg: "Error Occured" });
    }

    const repo = req.query.repo as string;
    const branch = req.query.branch as string;

    if (!repo || !branch) {
      return res.status(400).json({ msg: "Repo and Branch is required" });
    }

    const db = await getDb();
    const get_user = await db
      .collection("users")
      .findOne(
        { _id: new ObjectId(user.user_id) },
        { projection: { github_token: 1 } },
      );

    if (!get_user || !get_user.github_token) {
      return res.status(400).json({ msg: "GitHub token not found" });
    }

    const access_token = decrypt(get_user.github_token);
    const githubRes = await axios.get(
      `https://api.github.com/repos/${repo}/contents?ref=${branch}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      },
    );
    const files: any[] = githubRes.data;
    if (!files || files.length <= 0) {
      return res.status(400).json({
        msg: "No Files Found",
      });
    }

    const has_dockerfile = files.some(
      (f) =>
        f.name === "Dockerfile" ||
        f.name === "dockerfile" ||
        f.name === "docker-compose.yml",
    );

    if (has_dockerfile) {
      const is_compose = files.some((f) => f.name === "docker-compose.yml");
      return res.status(200).json({
        project: APP_CONSTANTS.PROJECT_FRONTEND_FRAMEWORKS.DOCKER,
        ...(is_compose
          ? {
            pm2_cmd: null,
            docker_cmd: `docker compose down && docker compose up -d --build`,
          }
          : {
            pm2_cmd: null,
            docker_cmd: `docker build -t app . && docker stop app 2>/dev/null; docker rm app 2>/dev/null; docker run -d --name app -p 3000:3000 app`,
          }),
      });
    }

    const has_package_json = files.some((f) => f.name === "package.json");

    if (has_package_json) {
      const packageRes = await axios.get(
        `https://api.github.com/repos/${repo}/contents/package.json?ref=${branch}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      const decoded_package_json = Buffer.from(
        packageRes.data.content,
        "base64",
      ).toString("utf-8");

      const package_json = JSON.parse(decoded_package_json);
      let deps = Object.assign(
        {},
        package_json.dependencies || {},
        package_json.devDependencies || {},
      );

      const scripts = Object.assign({}, package_json.scripts);
      if (deps["@angular/core"]) {
        return res.status(200).json({
          project: APP_CONSTANTS.PROJECT_FRONTEND_FRAMEWORKS.ANGULAR,
          scripts,
          serve_cmd: "npx serve dist/",
        });
      } else if (deps["react-scripts"]) {
        return res.status(200).json({
          project: APP_CONSTANTS.PROJECT_FRONTEND_FRAMEWORKS.REACT,
          scripts,
          serve_cmd: "npx serve build/",
        });
      } else if (deps["vite"] && deps["react"]) {
        return res.status(200).json({
          project: APP_CONSTANTS.PROJECT_FRONTEND_FRAMEWORKS.VITE_REACT,
          scripts,
          serve_cmd: "npx serve dist/",
        });
      } else if (deps["vue"] && deps["vite"]) {
        return res.status(200).json({
          project: APP_CONSTANTS.PROJECT_FRONTEND_FRAMEWORKS.VITE_VUE,
          scripts,
          serve_cmd: "npx serve dist/",
        });
      } else if (deps["vite"]) {
        return res.status(200).json({
          project: APP_CONSTANTS.PROJECT_FRONTEND_FRAMEWORKS.VITE,
          scripts,
          serve_cmd: "npx serve dist/",
        });
      } else if (deps["next"]) {
        return res.status(200).json({
          project: APP_CONSTANTS.PROJECT_FRONTEND_FRAMEWORKS.NEXT,
          scripts,
          pm2_cmd: `pm2 restart app 2>/dev/null || pm2 start npm --name "app" -- run start`,
        });
      } else if (deps["nuxt"]) {
        return res.status(200).json({
          project: APP_CONSTANTS.PROJECT_FRONTEND_FRAMEWORKS.NUXT,
          scripts,
          pm2_cmd: `pm2 restart app 2>/dev/null || pm2 start npm --name "app" -- run start`,
        });
      } else {
        return res.status(200).json({
          project: APP_CONSTANTS.PROJECT_FRONTEND_FRAMEWORKS.NODE,
          scripts,
          pm2_cmd: `pm2 restart app 2>/dev/null || pm2 start npm --name "app" -- run start`,
        });
      }
    }

    const has_requirements_txt = files.some(
      (f) => f.name === "requirements.txt",
    );

    const has_pyproject_toml = files.some((f) => f.name === "pyproject.toml");

    if (has_requirements_txt || has_pyproject_toml) {
      const requirementsRes = await axios.get(
        `https://api.github.com/repos/${repo}/contents/requirements.txt?ref=${branch}`,
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        },
      );

      const requirements = Buffer.from(
        requirementsRes.data.content,
        "base64",
      ).toString("utf-8");

      if (requirements.includes("django")) {
        return res.status(200).json({
          project: "django",
          start_command: "python manage.py runserver",
        });
      }

      if (requirements.includes("fastapi")) {
        return res.status(200).json({
          project: "fastapi",
          start_command: "uvicorn main:app --host 0.0.0.0 --port 8000",
        });
      }

      if (requirements.includes("flask")) {
        return res.status(200).json({
          project: "flask",
          start_command: "python app.py",
        });
      }
    }

    const has_manage_py = files.some((f) => f.name === "manage.py");

    const has_app_py = files.some((f) => f.name === "app.py");

    if (has_manage_py) {
      return res.status(200).json({
        project: "django",
        start_command: "python manage.py runserver",
      });
    }

    if (has_app_py) {
      return res.status(200).json({
        project: "flask",
        start_command: "python app.py",
      });
    }

    return res.status(200).json({ files });
  } catch (e) {
    console.error(e);
    throw e;
  }
}

function buildEnvFile(envVars: any[], decrypt: Function) {
  if (!Array.isArray(envVars)) return "";

  return envVars
    .map((v) => {
      const key = v.key;
      const value = decrypt(v.value);
      return `${key}=${value}`;
    })
    .join("\n");
}
