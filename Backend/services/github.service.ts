import axios from "axios";
import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import { APP_CONSTANTS } from "../app.constants";
import { createWebhookLogs, getDb } from "../libs/mongodb";
import { decrypt } from "../helpers/Encryption";
import { isStringEmpty } from "../helpers/checkIfStringEmpty";
import path from "path";

import { Worker } from "worker_threads";
import {
  SendSMTPMail,
  SendMETAWhatsapp,
  SendZeptoMail,
  SendTwilioWhatsapp,
} from "./automation.service";
import { generate_deployment_uid } from "../helpers/GenerateDeployUID";
export async function RegisterWebHook(
  access_token: string,
  repo_url: string,
  project_id: string,
  tenant_id: string,
) {
  if (!access_token || !repo_url || !project_id || !tenant_id) return false;
  const webhookUrl = `${process.env.GITHUB_TESTIN_HTTPS}/webhook/github/${tenant_id}/${project_id}`;

  try {
    const res = await axios.post(
      `https://api.github.com/repos/${repo_url}/hooks`,
      {
        name: "web",
        active: true,
        events: ["push"],
        config: {
          url: webhookUrl,
          content_type: "json",
          secret: process.env.GITHUB_WEBHOOK_SECRET,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: "application/vnd.github+json",
        },
      },
    );
    return res.data.id as number;
  } catch (error: any) {
    const msg = error?.response?.data?.errors?.[0]?.message ?? error.message;
    throw new Error(`Failed to register webhook: ${msg}`);
  }
}

export async function DeleteGithubWebhook(
  access_token: string,
  repo_name: string,
  hook_id: number,
) {
  await axios.delete(
    `https://api.github.com/repos/${repo_name}/hooks/${hook_id}`,
    { headers: { Authorization: `Bearer ${access_token}` } },
  );
}

export async function HandleGithubWebhook(req: Request, res: Response) {
  try {
    const sig = req.headers["x-hub-signature-256"] as string;

    const expected =
      "sha256=" +
      crypto
        .createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET!)
        .update(JSON.stringify(req.body))
        .digest("hex");

    if (sig !== expected) {
      res.status(401).json({ message: "Invalid signature" });
      return;
    }
    const { project_id, tenant_id } = req.params as {
      project_id: string;
      tenant_id: string;
    };

    const branch = req.body.ref?.replace("refs/heads/", "");

    if (!project_id || !ObjectId.isValid(project_id) || !tenant_id) {
      res.status(400).json({ message: "Invalid Data" });
      return;
    }

    const tenant_key = `tenant_${tenant_id}`;
    const db = await getDb(tenant_key);

    if (!db) {
      return res.status(400).json({
        msg: "Internal Server Error",
      });
    }

    const [get_data] = await db
      .collection("projects")
      .aggregate([
        {
          $match: {
            _id: new ObjectId(project_id),
            dels: 0,

            enable_webhook: true,
            hook_id: {
              $exists: true,
            },
            created_by: {
              $exists: true,
            },
          },
        },

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
            deploy_target: {
              $cond: [
                "$_is_custom",
                "custom_ssh",
                { $ifNull: ["$_server_doc.server_type", "custom_ssh"] },
              ],
            },
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

    if (!get_data) {
      return res.status(400).json({
        msg: "Project Not Found",
      });
    }

    const user_id = get_data.created_by;

    if (!user_id || !ObjectId.isValid(user_id)) {
      return res.status(400).json({
        msg: "Invalid User",
      });
    }

    const main_db = await getDb();

    const hook_db = await createWebhookLogs(tenant_id);
    const find_user = await main_db.collection("users").findOne({
      _id: new ObjectId(user_id),
    });

    if (!find_user) {
      await hook_db.collection("webhook_logs").insertOne({
        timestamp: new Date(),
        status: APP_CONSTANTS.WEBHOOK_LOGS_STATUS.ERROR,
        msg: "Project Created user is not find",
        fk_project_id: new ObjectId(project_id),
        branch: branch,
      });
      return;
    }

    let deployment;
    try {
      deployment = await db.collection("deployments").insertOne({
        fk_project_id: new ObjectId(project_id),
        status: APP_CONSTANTS.DEPLOYMENT_STATUS.RUNNING,
        deployed_at: new Date(),
        duration_seconds: 0,
        deployment_id: generate_deployment_uid(),
      });
    } catch (e: any) {
      if (e?.code === 11000) {
        await hook_db.collection("webhook_logs").insertOne({
          timestamp: new Date(),
          status: APP_CONSTANTS.WEBHOOK_LOGS_STATUS.ERROR,
          msg: "A deployment is already running for this project So Webhook is Failed",
          fk_project_id: new ObjectId(project_id),
          branch: branch,
        });
      }
      return;
    }

    if (!deployment || !deployment.insertedId || !deployment.acknowledged) {
      await hook_db.collection("webhook_logs").insertOne({
        timestamp: new Date(),
        status: APP_CONSTANTS.WEBHOOK_LOGS_STATUS.ERROR,
        msg: "Failed to Deploy",
        fk_project_id: new ObjectId(project_id),
        branch: branch,
      });
      return;
    }

    const deployment_id = deployment.insertedId.toString();

    const isDev = process.env.NODE_ENV !== "production";

    const worker_path = isDev
      ? path.join(process.cwd(), "workers/deploy.worker.ts")
      : path.join(process.cwd(), "dist/workers/deploy.worker.js");
    const worker = new Worker(worker_path, {
      execArgv: isDev ? ["--require", "tsx/cjs"] : [],
      workerData: {
        project: get_data,
        gh_token: find_user.github_token ?? null,
      },
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
        await db.collection("deploy_logs").insertOne({
          deployed_at: new Date(),
          log_type: msg.type,
          fk_deployment_id: new ObjectId(deployment_id),
          fk_project_id: new ObjectId(project_id),
          message: msg.message,
        });
      }

      if (is_completed) clearTimeout(timeout);

      if (is_success) {
        await Promise.all([
          db.collection("deployments").updateOne(
            { _id: new ObjectId(deployment_id) },
            {
              $set: {
                status: APP_CONSTANTS.DEPLOYMENT_STATUS.SUCCESS,
                duration_seconds: Number(msg.duration_seconds ?? 0),
              },
            },
          ),
          db.collection("projects").updateOne(
            { _id: new ObjectId(project_id) },
            {
              $set: {
                last_deployed_at: new Date(),
                last_deployed_id: new ObjectId(deployment_id),
                status: APP_CONSTANTS.PROJECT_STATUS.RUNNING,
              },
            },
          ),
          db.collection("successful_deployments").insertOne({
            fk_project_id: new ObjectId(project_id),
            fk_deployment_id: new ObjectId(deployment_id),
            branch: get_data.branch ?? branch,
            commit_sha: msg.commit_sha ?? null,
            deployed_at: new Date(),
          }),
          hook_db.collection("webhook_logs").insertOne({
            timestamp: new Date(),
            status: APP_CONSTANTS.WEBHOOK_LOGS_STATUS.SUCCESS,
            msg: "Deployement is Successfull",
            fk_project_id: new ObjectId(project_id),
            fk_deployment_id: new ObjectId(deployment_id),
            branch: branch,
          }),
        ]);
      }

      if (is_error) {
        await db
          .collection("deployments")
          .updateOne(
            { _id: new ObjectId(deployment_id) },
            { $set: { status: APP_CONSTANTS.DEPLOYMENT_STATUS.FAILED } },
          );
      }
    });

    worker.on("error", (e: any) => {
      clearTimeout(timeout);
    });

    const find_automations = await db.collection("automation").findOne(
      {
        fk_project_id: new ObjectId(project_id),
      },
      {
        projection: {
          created_on: 0,
        },
      },
    );

    if (!find_automations || !find_automations.nodes) {
      await hook_db.collection("webhook_logs").insertOne({
        timestamp: new Date(),
        status: APP_CONSTANTS.WEBHOOK_LOGS_STATUS.ERROR,
        msg: `Automation is Not sets up`,
        fk_project_id: new ObjectId(project_id),
        branch: branch,
        fk_deployment_id: new ObjectId(deployment_id),
      });
      return;
    }

    const results = buildExecutionOrder(
      find_automations.nodes,
      find_automations.edges,
    );

    const get_integration_details = await db
      .collection("integrations")
      .find()
      .toArray();

    const mail_el = get_integration_details.find(
      (item) => item.type === "mail",
    );
    const whatsapp_el = get_integration_details.find(
      (item) => item.type === "whatsapp",
    );

    const logs_to_insert: any[] = [];
    const deployment_link = `${process.env.UI_APP}/deployments/logs/${deployment_id}`;

    for (let i = 0; i < results.length; i++) {
      const item = results[i];
      if (!item) continue;

      if (item.type === "email") {
        if (!mail_el) {
          logs_to_insert.push({
            timestamp: new Date(),
            status: APP_CONSTANTS.WEBHOOK_LOGS_STATUS.ERROR,
            msg: "Mail integration is not configured",
            fk_project_id: new ObjectId(project_id),
            fk_deployment_id: new ObjectId(deployment_id),
            branch: branch,
          });
          continue;
        }

        let mail_details: any | null = null;

        if (
          Number(mail_el.automation_provider) ===
          APP_CONSTANTS.INTEGRATIONS_EMAIL.SMTP
        ) {
          const { smtp_host, smtp_port, smtp_user, smtp_password, smtp_from } =
            mail_el;

          if (
            !smtp_host ||
            !smtp_port ||
            !smtp_user ||
            !smtp_password ||
            !smtp_from
          ) {
            logs_to_insert.push({
              timestamp: new Date(),
              status: APP_CONSTANTS.WEBHOOK_LOGS_STATUS.ERROR,
              msg: "SMTP — Field is missing, failed to send",
              fk_project_id: new ObjectId(project_id),
              fk_deployment_id: new ObjectId(deployment_id),
              branch: branch,
            });
            continue;
          }
          mail_details = {
            smtp_host,
            smtp_port,
            smtp_user,
            cc: item.config.cc,
            smtp_pass: decrypt(smtp_password),
            smtp_from_mail: smtp_from,
            to: item.config.to,
            subject: item.config.subject,
            body: item.config.body,
            project_name: get_data.project_name,
            deployment_link,
          };
        }

        if (
          Number(mail_el.automation_provider) ===
          APP_CONSTANTS.INTEGRATIONS_EMAIL.ZEPTO_MAIL
        ) {
          const { zepto_api_key, zepto_url, zepto_from } = mail_el;
          if (!zepto_api_key || !zepto_url || !zepto_from) {
            logs_to_insert.push({
              timestamp: new Date(),
              status: APP_CONSTANTS.WEBHOOK_LOGS_STATUS.ERROR,
              msg: "ZeptoMail — Field is missing, failed to send",
              fk_project_id: new ObjectId(project_id),
              fk_deployment_id: new ObjectId(deployment_id),
              branch: branch,
            });
            continue;
          }
          mail_details = {
            zepto_token: zepto_api_key,
            zepto_url,
            zepto_from_mail: zepto_from,
            to: item.config.to,
            subject: item.config.subject,
            body: item.config.body,
            project_name: get_data.project_name,
            deployment_link,
          };
        }

        if (!mail_details) {
          logs_to_insert.push({
            timestamp: new Date(),
            status: APP_CONSTANTS.WEBHOOK_LOGS_STATUS.ERROR,
            msg: "Unknown mail provider configured",
            fk_project_id: new ObjectId(project_id),
            fk_deployment_id: new ObjectId(deployment_id),
            branch: branch,
          });
          continue;
        }

        try {
          if (
            Number(mail_el.automation_provider) ===
            APP_CONSTANTS.INTEGRATIONS_EMAIL.SMTP
          )
            await SendSMTPMail(mail_details);
          else await SendZeptoMail(mail_details);

          logs_to_insert.push({
            timestamp: new Date(),
            status: APP_CONSTANTS.WEBHOOK_LOGS_STATUS.SUCCESS,
            msg: "Email sent successfully",
            fk_project_id: new ObjectId(project_id),
            fk_deployment_id: new ObjectId(deployment_id),
            branch: branch,
          });
        } catch (e: any) {
          logs_to_insert.push({
            timestamp: new Date(),
            status: APP_CONSTANTS.WEBHOOK_LOGS_STATUS.ERROR,
            msg: e.message,
            fk_project_id: new ObjectId(project_id),
            fk_deployment_id: new ObjectId(deployment_id),
            branch: branch,
          });
        }
      }

      if (item.type === "whatsapp") {
        if (!whatsapp_el) {
          logs_to_insert.push({
            timestamp: new Date(),
            status: APP_CONSTANTS.WEBHOOK_LOGS_STATUS.ERROR,
            msg: "WhatsApp integration is not configured",
            fk_project_id: new ObjectId(project_id),
            fk_deployment_id: new ObjectId(deployment_id),
            branch: branch,
          });
          continue;
        }

        let whatsapp_details: any | null = null;

        if (
          Number(whatsapp_el.automation_provider) ===
          APP_CONSTANTS.INTEGRATIONS_WHATSAPP.TWILIO
        ) {
          const { twilio_account_sid, twilio_auth_token, twilio_from_number } =
            whatsapp_el;
          if (
            !twilio_account_sid ||
            !twilio_auth_token ||
            !twilio_from_number
          ) {
            logs_to_insert.push({
              timestamp: new Date(),
              status: APP_CONSTANTS.WEBHOOK_LOGS_STATUS.ERROR,
              msg: "Twilio — Field is missing, failed to send",
              fk_project_id: new ObjectId(project_id),
              fk_deployment_id: new ObjectId(deployment_id),
              branch: branch,
            });
            continue;
          }
          whatsapp_details = {
            twilio_account_sid,
            twilio_auth_token,
            twilio_from_number,
            to: item.config.to,
            body: item.config.body,
            project_name: get_data.project_name,
            deployment_link,
          };
        }

        if (
          Number(whatsapp_el.automation_provider) ===
          APP_CONSTANTS.INTEGRATIONS_WHATSAPP.META_CLOUD
        ) {
          const {
            meta_access_token,
            meta_phone_number_id,
            meta_business_account_id,
          } = whatsapp_el;
          if (
            !meta_access_token ||
            !meta_phone_number_id ||
            !meta_business_account_id
          ) {
            logs_to_insert.push({
              timestamp: new Date(),
              status: APP_CONSTANTS.WEBHOOK_LOGS_STATUS.ERROR,
              msg: "META — Field is missing, failed to send",
              fk_project_id: new ObjectId(project_id),
              fk_deployment_id: new ObjectId(deployment_id),
              branch: branch,
            });
            continue;
          }
          whatsapp_details = {
            meta_access_token,
            meta_phone_number_id,
            meta_business_account_id,
            to: item.config.to,
            body: item.config.body,
            project_name: get_data.project_name,
            deployment_link,
          };
        }

        if (!whatsapp_details) {
          logs_to_insert.push({
            timestamp: new Date(),
            status: APP_CONSTANTS.WEBHOOK_LOGS_STATUS.ERROR,
            msg: "Unknown WhatsApp provider configured",
            fk_project_id: new ObjectId(project_id),
            fk_deployment_id: new ObjectId(deployment_id),
            branch: branch,
          });
          continue;
        }

        try {
          if (
            Number(whatsapp_el.automation_provider) ===
            APP_CONSTANTS.INTEGRATIONS_WHATSAPP.TWILIO
          )
            await SendTwilioWhatsapp(whatsapp_details);
          else await SendMETAWhatsapp(whatsapp_details);

          logs_to_insert.push({
            timestamp: new Date(),
            status: APP_CONSTANTS.WEBHOOK_LOGS_STATUS.SUCCESS,
            msg: "WhatsApp message sent successfully",
            fk_deployment_id: new ObjectId(deployment_id),
            fk_project_id: new ObjectId(project_id),
            branch: branch,
          });
        } catch (e: any) {
          logs_to_insert.push({
            timestamp: new Date(),
            status: APP_CONSTANTS.WEBHOOK_LOGS_STATUS.ERROR,
            msg: e.message,
            fk_project_id: new ObjectId(project_id),
            fk_deployment_id: new ObjectId(deployment_id),
            branch: branch,
          });
        }
      }
    }

    if (logs_to_insert.length > 0) {
      await hook_db.collection("webhook_logs").insertMany(logs_to_insert);
    }
  } catch (e) {
    console.log(e);
  }
}

type AutomationNode = {
  id: string;
  type: "email" | "whatsapp";
  config: Record<string, string>;
};

type AutomationEdge = {
  source: string;
  target: string;
};

function buildExecutionOrder(
  nodes: AutomationNode[],
  edges: AutomationEdge[],
): AutomationNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const nextMap = new Map(edges.map((e) => [e.source, e.target]));
  const hasIncoming = new Set(edges.map((e) => e.target));

  const startNode = nodes.find((n) => !hasIncoming.has(n.id));
  if (!startNode) return [];

  const order: AutomationNode[] = [];
  let current: string | undefined = startNode.id;
  const visited = new Set<string>();

  while (current && !visited.has(current)) {
    const node = nodeMap.get(current);
    if (!node) break;
    order.push(node);
    visited.add(current);
    current = nextMap.get(current);
  }

  return order;
}
