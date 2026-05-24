import { parentPort, workerData } from "worker_threads";
import { Client } from "ssh2";
import crypto from "crypto";
import { configDotenv } from "dotenv";
import { ObjectId } from "mongodb";
configDotenv();

const { project, gh_token, commit_sha, updated_by } = workerData;

function RollBackProject() {
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
      _id,
    } = project;

    const deploy_type_num = Number(deploy_type ?? 1);

    if (deploy_type_num > 2 || deploy_type_num < 1) {
      return parentPort?.postMessage(
        ReturnPortMsg(
          "error",
          project.project_name,
          updated_by,
          project._id,
          `Invalid Project Deploy Type as its only should between Docker or SSH`,
        ),
      );
    }

    if (!gh_token && is_private) {
      return parentPort?.postMessage(
        ReturnPortMsg(
          "error",
          project.project_name,
          updated_by,
          project._id,
          `Github token is missing`,
        ),
      );
    }
    if (!ssh_host) {
      return parentPort?.postMessage(
        ReturnPortMsg(
          "error",
          project.project_name,
          updated_by,
          project._id,
          `SSH Host is missing`,
          "completed",
        ),
      );
    }
    if (!ssh_user) {
      return parentPort?.postMessage(
        ReturnPortMsg(
          "error",
          project.project_name,
          updated_by,
          project._id,
          `SSH User is missing`,
          "completed",
        ),
      );
    }
    if (!ssh_key) {
      return parentPort?.postMessage(
        ReturnPortMsg(
          "error",
          project.project_name,
          updated_by,
          project._id,
          `SSH Key is missing`,
          "completed",
        ),
      );
    }

    if (!repo_url) {
      return parentPort?.postMessage(
        ReturnPortMsg(
          "error",
          project.project_name,
          updated_by,
          project._id,
          `Repository URL is missing`,
          "completed",
        ),
      );
    }
    if (!branch) {
      return parentPort?.postMessage(
        ReturnPortMsg(
          "error",
          project.project_name,
          updated_by,
          project._id,
          `Github Branch is missing`,
          "completed",
        ),
      );
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
      parentPort?.postMessage(
        ReturnPortMsg(
          "info",
          project.project_name,
          updated_by,
          project._id,
          `SSH Connected`,
          "working",
        ),
      );

      const commands: string[] = Array.isArray(deploy_script)
        ? deploy_script
        : deploy_script.split("\n").filter((c: string) => c.trim());

      if (commands.length <= 0) {
        parentPort?.postMessage(
          ReturnPortMsg(
            "error",
            project.project_name,
            updated_by,
            project._id,
            `Deployment Scripts are Empty`,
            "completed",
          ),
        );
        conn.end();
        return;
      }

      const cd_match = commands.find((c) => c.trim().startsWith("cd "));
      const work_dir = cd_match
        ? cd_match.trim().replace("cd ", "").trim()
        : null;
      if (!work_dir) {
        parentPort?.postMessage(
          ReturnPortMsg(
            "error",
            project.project_name,
            updated_by,
            project._id,
            `No working directory found in script, running from home directory`,
            "completed",
          ),
        );
        return;
      }

      const env_b64 = Buffer.from(env_content).toString("base64");
      const write_env_cmd = env_content
        ? `echo "${env_b64}" | base64 -d > ${work_dir}/.env`
        : null;

      const safe_branch = sanitize(project.branch, "branch");

    const git_cmd = commit_sha
  ? `
if [ -d "${work_dir}/.git" ]; then
  cd ${work_dir} &&
  ${is_private && github_token ? `git remote set-url origin ${authed_repo_url} &&` : ""}
  git fetch --all &&
  git reset --hard ${commit_sha} &&
  git clean -fd &&
  ${is_private && github_token ? `git remote set-url origin ${repo_url} &&` : ""}
  true;
else
  git clone ${authed_repo_url} ${work_dir} &&
  cd ${work_dir} &&
  git checkout ${commit_sha} &&
  ${is_private && github_token ? `git remote set-url origin ${repo_url} &&` : ""}
  true;
fi
`
  : `
if [ -d "${work_dir}/.git" ]; then
  cd ${work_dir} &&
  ${is_private && github_token ? `git remote set-url origin ${authed_repo_url} &&` : ""}
  git fetch origin &&
  git reset --hard origin/${safe_branch} &&
  git clean -fd &&
  ${is_private && github_token ? `git remote set-url origin ${repo_url} &&` : ""}
  true;
else
  git clone -b ${safe_branch} ${authed_repo_url} ${work_dir} &&
  ${is_private && github_token ? `cd ${work_dir} && git remote set-url origin ${repo_url} &&` : ""}
  true;
fi
`;
      let resolved_commands: string[] = [];

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
          parentPort?.postMessage(
            ReturnPortMsg(
              "success",
              project.project_name,
              updated_by,
              project._id,
              `Deployment completed`,
              "completed",
            ),
          );
          conn.end();
          return;
        }

        const cmd = resolved_commands[index];

        parentPort?.postMessage(
          ReturnPortMsg(
            "log",
            project.project_name,
            updated_by,
            project._id,
            `$ ${cmd}`,
            "working",
          ),
        );

        conn.exec(cmd, (err, stream) => {
          if (err) {
            parentPort?.postMessage(
              ReturnPortMsg(
                "error",
                project.project_name,
                updated_by,
                project._id,
                err.message,
                "completed",
              ),
            );
            conn.end();
            return;
          }

          stream.on("data", (data: Buffer) => {
            parentPort?.postMessage(
              ReturnPortMsg(
                "log",
                project.project_name,
                updated_by,
                project._id,
                data.toString(),
                "working",
              ),
            );
          });

          stream.stderr.on("data", (data: Buffer) => {
            parentPort?.postMessage(
              ReturnPortMsg(
                "warning",
                project.project_name,
                updated_by,
                project._id,
                data.toString(),
                "working",
              ),
            );
          });

          stream.on("close", (code: number) => {
            if (code !== 0) {
              parentPort?.postMessage(
                ReturnPortMsg(
                  "error",
                  project.project_name,
                  updated_by,
                  project._id,
                  `Command failed with exit code ${code}: ${cmd}`,
                  "completed",
                ),
              );
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
      parentPort?.postMessage(
        ReturnPortMsg(
          "error",
          project.project_name,
          updated_by,
          project._id,
          `SSH Error: ${err.message}`,
          "completed",
        ),
      );
    });

    conn.connect({
      host,
      port: 22,
      username: user,
      privateKey: formatted_key,
    });
  } catch (e: any) {
    return parentPort?.postMessage(
      ReturnPortMsg(
        "error",
        project.project_name,
        updated_by,
        project._id,
        e.message || e.data?.message || "Error Occured While Deploying",
        "completed",
      ),
    );
  }
}

RollBackProject();

type LogType = "error" | "completed" | "info" | "warning" | "log" | "success";

function ReturnPortMsg(
  type: LogType,
  project_name: string,
  updated_by: string,
  project_id: string,
  details: string,
  status?: string,
) {
  return {
    type,
    msg:
      type === "success"
        ? `${project_name} Rollback Succeed`
        : `${project_name} Rollback failed`,
    details,
    fk_project_id: project_id,
    timestamp: new Date(),
    updated_by: new ObjectId(updated_by),
    ...(status && { status }),
  };
}

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
