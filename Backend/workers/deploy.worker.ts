import { parentPort, workerData } from "worker_threads";
import { Client } from "ssh2";
import crypto from "crypto";
import { configDotenv } from "dotenv";
configDotenv();

const APP_CONSTANTS = {
  WORKER_LOGS_STATUS: {
    WORKING: 0,
    COMPLETED: 1,
  },
  WORKER_LOGS_TYPES: {
    SUCCESS: 1,
    LOG: 2,
    ERROR: 3,
    INFO: 4,
    WARNING: 5,
  },
};

const { project, gh_token } = workerData;

function StartDeployApp() {
  try {
    if (!project) {
      throw new Error("Project is Not find");
    }
    const {
      ssh_host,
      ssh_user,
      ssh_key,
      repo_url,
      branch,
      is_private,
      deploy_script,
      deploy_type,
    } = project;

    const deploy_type_num = Number(deploy_type ?? 1);

    if (deploy_type_num > 2 || deploy_type_num < 1) {
      return parentPort?.postMessage({
        type: APP_CONSTANTS.WORKER_LOGS_TYPES.ERROR,
        message: `Invalid Project Deploy Type as its only should between Docker or SSH`,
        status: APP_CONSTANTS.WORKER_LOGS_STATUS.COMPLETED,
      });
    }

    if (!gh_token && is_private) {
      return parentPort?.postMessage({
        type: APP_CONSTANTS.WORKER_LOGS_TYPES.ERROR,
        message: `Github token is missing`,
        status: APP_CONSTANTS.WORKER_LOGS_STATUS.COMPLETED,
      });
    }
    if (!ssh_host) {
      return parentPort?.postMessage({
        type: APP_CONSTANTS.WORKER_LOGS_TYPES.ERROR,
        message: `SSH Host is missing`,
        status: APP_CONSTANTS.WORKER_LOGS_STATUS.COMPLETED,
      });
    }
    if (!ssh_user) {
      return parentPort?.postMessage({
        type: APP_CONSTANTS.WORKER_LOGS_TYPES.ERROR,
        message: `SSH User is missing`,
        status: APP_CONSTANTS.WORKER_LOGS_STATUS.COMPLETED,
      });
    }
    if (!ssh_key) {
      return parentPort?.postMessage({
        type: APP_CONSTANTS.WORKER_LOGS_TYPES.ERROR,
        message: `SSH Key is missing`,
        status: APP_CONSTANTS.WORKER_LOGS_STATUS.COMPLETED,
      });
    }

    if (!repo_url) {
      return parentPort?.postMessage({
        type: APP_CONSTANTS.WORKER_LOGS_TYPES.ERROR,
        message: `Repository URL is missing`,
        status: APP_CONSTANTS.WORKER_LOGS_STATUS.COMPLETED,
      });
    }
    if (!branch) {
      return parentPort?.postMessage({
        type: APP_CONSTANTS.WORKER_LOGS_TYPES.ERROR,
        message: `Github Branch is missing`,
        status: APP_CONSTANTS.WORKER_LOGS_STATUS.COMPLETED,
      });
    }

    const host = decrypt(ssh_host);
    const user = decrypt(ssh_user);
    const key = decrypt(ssh_key);
    const github_token = gh_token ? decrypt(gh_token) : null;

    const env_content = buildEnvFile(project.environment_variables, decrypt);

    const authed_repo_url =
      is_private && github_token
        ? repo_url.replace("https://", `https://${github_token}@`)
        : repo_url;

    const body = key
      .replace(/-----BEGIN OPENSSH PRIVATE KEY-----/g, "")
      .replace(/-----END OPENSSH PRIVATE KEY-----/g, "")
      .replace(/\s+/g, "")
      .trim();

    const chunked = body.match(/.{1,64}/g)?.join("\n") ?? body;
    const formatted_key = `-----BEGIN OPENSSH PRIVATE KEY-----\n${chunked}\n-----END OPENSSH PRIVATE KEY-----`;

    const conn = new Client();
    conn.on("ready", () => {
      const start_time = Date.now();
      parentPort?.postMessage({
        type: APP_CONSTANTS.WORKER_LOGS_TYPES.INFO,
        message: `SSH Connected`,
        status: APP_CONSTANTS.WORKER_LOGS_STATUS.WORKING,
      });

      const commands: string[] = Array.isArray(deploy_script)
        ? deploy_script
        : deploy_script.split("\n").filter((c: string) => c.trim());

      if (commands.length <= 0) {
        parentPort?.postMessage({
          type: APP_CONSTANTS.WORKER_LOGS_TYPES.ERROR,
          message: `Deployment Scripts are Empty`,
          status: APP_CONSTANTS.WORKER_LOGS_STATUS.COMPLETED,
        });
        conn.end();
        return;
      }

      const cd_match = commands.find((c) => c.trim().startsWith("cd "));
      const work_dir = cd_match
        ? cd_match.trim().replace("cd ", "").trim()
        : null;
      if (!work_dir) {
        parentPort?.postMessage({
          type: APP_CONSTANTS.WORKER_LOGS_TYPES.ERROR,
          message: `No working directory found in script, running from home directory`,
          status: APP_CONSTANTS.WORKER_LOGS_STATUS.COMPLETED,
        });
        return;
      }

      const env_b64 = Buffer.from(env_content).toString("base64");
      const write_env_cmd = env_content
        ? `echo "${env_b64}" | base64 -d > ${work_dir}/.env`
        : null;

      const safe_branch = sanitize(project.branch, "branch");

      const git_cmd = is_private && github_token
        ? `if [ -d "${work_dir}/.git" ]; then cd ${work_dir} && git remote set-url origin ${authed_repo_url} && git fetch origin && git reset --hard origin/${safe_branch} && git clean -fd; else git clone -b ${safe_branch} ${authed_repo_url} ${work_dir}; fi`
        : `if [ -d "${work_dir}/.git" ]; then cd ${work_dir} && git fetch origin && git reset --hard origin/${safe_branch} && git clean -fd; else git clone -b ${safe_branch} ${authed_repo_url} ${work_dir}; fi`; let resolved_commands: string[] = [];

      if (deploy_type_num === 2) {
        resolved_commands = [
          `mkdir -p ${work_dir}`,
          git_cmd,

          ...(write_env_cmd ? [write_env_cmd] : []),
          `test -f ${work_dir}/Dockerfile || { echo "ERROR: Dockerfile not found in repo" >&2; exit 1; }`,
          ...commands
            .filter(
              (cmd) =>
                !cmd.trim().startsWith("cd ") &&
                !cmd.trim().startsWith("git pull") &&
                !cmd.trim().startsWith("git clone"),
            )
            .map((cmd) => `cd ${work_dir} && ${cmd}`),
        ];
      } else {
        resolved_commands = [
          `mkdir -p ${work_dir}`,
          git_cmd,
          ...(write_env_cmd ? [write_env_cmd] : []),
          `cd ${work_dir} && git rev-parse HEAD`,
          ...commands
            .filter(
              (cmd) =>
                !cmd.trim().startsWith("cd ") &&
                !cmd.trim().startsWith("git pull") &&
                !cmd.trim().startsWith("git clone"),
            )
            .map((cmd) => `cd ${work_dir} && ${cmd}`),
        ];
      }

      let commit_sha: string | null = null;
      let nginx_applied = false;
      function ExecuteCommands(index: number) {
        if (index >= resolved_commands.length) {
          const nginx_config = project.nginx_config?.trim();

          if (nginx_config && !nginx_applied) {
            nginx_applied = true;
            const site_name =
              project.process_name?.trim() ||
              project.project_name.toLowerCase().replace(/\s+/g, "-");
            const escaped = nginx_config.replace(/'/g, `'\\''`);
            const nginx_cmds = [
              `echo '${escaped}' | sudo tee /etc/nginx/sites-available/${site_name} > /dev/null`,
              `sudo ln -sf /etc/nginx/sites-available/${site_name} /etc/nginx/sites-enabled/${site_name}`,
              `sudo nginx -t`,
              `sudo systemctl reload nginx`,
            ];
            resolved_commands.push(...nginx_cmds);
            ExecuteCommands(index);
            return;
          }

          const duration_seconds = Math.floor((Date.now() - start_time) / 1000);
          parentPort?.postMessage({
            type: APP_CONSTANTS.WORKER_LOGS_TYPES.SUCCESS,
            message: `Deployment completed`,
            status: APP_CONSTANTS.WORKER_LOGS_STATUS.COMPLETED,
            duration_seconds,
            commit_sha,
          });
          conn.end();
          return;
        }

        const cmd = resolved_commands[index];

        parentPort?.postMessage({
          type: APP_CONSTANTS.WORKER_LOGS_TYPES.LOG,
          message: `$ ${cmd}`,
          status: APP_CONSTANTS.WORKER_LOGS_STATUS.WORKING,
        });

        conn.exec(cmd, (err, stream) => {
          if (err) {
            parentPort?.postMessage({
              type: APP_CONSTANTS.WORKER_LOGS_TYPES.ERROR,
              message: err.message,
              status: APP_CONSTANTS.WORKER_LOGS_STATUS.COMPLETED,
            });
            conn.end();
            return;
          }

          stream.on("data", (data: Buffer) => {
            const output = data.toString().trim();

            if (/^[a-f0-9]{40}$/.test(output)) {
              commit_sha = output;
            }
            parentPort?.postMessage({
              type: APP_CONSTANTS.WORKER_LOGS_TYPES.LOG,
              message: data.toString(),
              status: APP_CONSTANTS.WORKER_LOGS_STATUS.WORKING,
            });
          });

          stream.stderr.on("data", (data: Buffer) => {
            const msg = data.toString();


            if (
              msg.includes("Repository not found") ||
              msg.includes("not found") ||
              msg.includes("ERROR: Repository not found") ||
              msg.includes("fatal: repository") ||
              msg.includes("does not exist")
            ) {
              parentPort?.postMessage({
                type: APP_CONSTANTS.WORKER_LOGS_TYPES.ERROR,
                message: is_private
                  ? `Repository not found — check if the repo URL is correct or your GitHub token has access`
                  : `Repository not found — make sure the URL is correct and the repo is public`,
                status: APP_CONSTANTS.WORKER_LOGS_STATUS.COMPLETED,
              });
              conn.end();
              return;
            }
            parentPort?.postMessage({
              type: APP_CONSTANTS.WORKER_LOGS_TYPES.WARNING,
              message: msg,
              status: APP_CONSTANTS.WORKER_LOGS_STATUS.WORKING,
            });
          });

          stream.on("close", (code: number) => {
            if (code !== 0) {
              parentPort?.postMessage({
                type: APP_CONSTANTS.WORKER_LOGS_TYPES.ERROR,
                message: `Command failed with exit code ${code}: ${cmd}`,
                status: APP_CONSTANTS.WORKER_LOGS_STATUS.COMPLETED,
              });
              conn.end();
              return;
            }
            ExecuteCommands(index + 1);
          });
        });
      }

      ExecuteCommands(0);
    });

    conn.on("error", (err) => {
      parentPort?.postMessage({
        type: APP_CONSTANTS.WORKER_LOGS_TYPES.ERROR,
        message: `SSH Error: ${err.message}`,
        status: APP_CONSTANTS.WORKER_LOGS_STATUS.COMPLETED,
      });
    });

    conn.connect({
      host,
      port: 22,
      username: user,
      privateKey: formatted_key,
    });
  } catch (e: any) {
    return parentPort?.postMessage({
      type: APP_CONSTANTS.WORKER_LOGS_TYPES.ERROR,
      message: e.message || e.data?.message || "Error Occured While Deploying",
      status: APP_CONSTANTS.WORKER_LOGS_STATUS.COMPLETED,
    });
  }
}
StartDeployApp();

function sanitize(value: string, field: string): string {
  if (/[;&|`$<>\\]/.test(value)) {
    throw new Error(`Invalid characters in ${field}`);
  }
  return value.trim();
}

function decrypt(text: string) {
  const ALGORITHM = "aes-256-cbc";
  const [ivHex, encryptedText] = text.split(":");
  const SECRET_KEY = process.env.ENCRYPTION_KEY!;
  if (!SECRET_KEY) {
    throw new Error("ENCRYPTION_KEY not set");
  }
  const key = crypto.createHash("sha256").update(SECRET_KEY).digest();
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
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
