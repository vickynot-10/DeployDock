"use client";
import { useForm, Controller } from "react-hook-form";
import { useState, useEffect, useCallback, useRef } from "react";
import AppTextInput from "@/components/ui-elements/AppTextInput";
import AppButton from "@/components/ui-elements/AppButton";
import AppTextArea from "@/components/ui-elements/AppTextArea";
import AppSelect from "@/components/ui-elements/AppSelect";
import { useQuery, useMutation } from "@tanstack/react-query";
import BreadCrumbs from "@/components/ui-elements/BreadCrumbs";
import { toast } from "react-toastify";
import Skeleton from "react-loading-skeleton";
import { useMe } from "@/hooks/useMe";
import api from "@/libs/axios";
import { useRouter } from "next/navigation";
import { IoArrowBack } from "react-icons/io5";
import AppModal from "@/components/ui-elements/AppModal";
import { PiCode } from "react-icons/pi";
import TooltipWrapper from "@/helpers/tooltipWrapper";
import AppIconButton from "@/components/ui-elements/AppIconButton";
import Loader from "@/components/ui-elements/Loader";
import { PiLightningFill } from "react-icons/pi";
import dynamic from "next/dynamic";
const DeployScriptEditor = dynamic(() => import("@/components/SciptEditor"), {
  ssr: false,
});
type ExampleTab = "deploy_ssh" | "deploy_docker" | "env" | "stop" | "nginx";
const tab_order: Tab[] = ["project", "deployment", "scripts"];
const SETTINGS_TABS = [
  { label: "Script Editor", value: 1 },
  { label: "Environment Varibales", value: 2 },
  { label: "Stop Scripts", value: 3 },
  { label: "Nginx Config", value: 4 },
];
import {
  SiNextdotjs,
  SiAngular,
  SiReact,
  SiVite,
  SiVuedotjs,
  SiNuxt,
  SiNodedotjs,
} from "react-icons/si";
type Tab = "project" | "deployment" | "scripts";
const tabs: { key: Tab; label: string }[] = [
  { key: "project", label: "Project" },

  { key: "deployment", label: "Deployment" },

  { key: "scripts", label: "Configuration" },
];
import { SiDocker } from "react-icons/si";
import { APP_CONSTANTS } from "@/app_constants";
import { MdOutlineFileUpload } from "react-icons/md";

const framework_labels: Record<number, string> = {
  1: "Angular",
  2: "React",
  3: "Vite + React",
  4: "Vite + Vue",
  5: "Vue",
  6: "Next.js",
  7: "Nuxt",
  8: "Vite",
  9: "Node.js",
  10: "Docker",
};

const framework_icons: Record<number, React.ReactNode> = {
  1: <SiAngular size={13} />,
  2: <SiReact size={13} />,
  3: <SiReact size={13} />,
  4: <SiVuedotjs size={13} />,
  5: <SiVuedotjs size={13} />,
  6: <SiNextdotjs size={13} />,
  7: <SiNuxt size={13} />,
  8: <SiVite size={13} />,
  9: <SiNodedotjs size={13} />,
  10: <SiDocker size={13} />,
};


const examples: Record<string, { label: string; content: string }> = {
  deploy_ssh: {
    label: "SSH / Node.js",
    content: `cd /var/www/nodejsapp
git fetch origin
git reset --hard origin/main
git clean -fd
npm install
npm run build
pm2 restart nodeapp 2>/dev/null || pm2 start npm --name "nodeapp" -- run start`,
  },
  deploy_docker: {
    label: "Docker",
    content: `cd /var/www/nodejsapp
git fetch origin
git reset --hard origin/main
git clean -fd
docker compose down && docker compose up -d --build`,
  },
  env: {
    label: "Environment Variables",
    content: `APP_NAME=myapp
NODE_ENV=production
PORT=3000
UI_APP=http://localhost:3000
MONGODB_URI=mongodb://127.0.0.1:27017/mydb
JWT_SECRET_KEY=your_jwt_secret_here
ENCRYPTION_KEY=your_32char_encryption_key_here
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret`,
  },
  stop: {
    label: "Stop Script",
    content: `pm2 delete "nodeapp"`,
  },
  nginx: {
    label: "Nginx Config",
    content: `server {
    listen 80;
    server_name app.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}`,
  },
};

type ProjectFormValues = {
  project_name: string;
  environment: "development" | "staging" | "production";
  description?: string;
  repo_url?: string;
  branch?: string;
  repo_full_name?: string;
  is_private?: boolean;
  enable_webhook?: boolean;
  fk_server_id?: string;
  deploy_script: any;
  ssh_host?: string;
  ssh_user?: string;
  ssh_key?: string;
  deploy_type: 1 | 2;
  environment_variables: string;
  stop_script?: string;
  process_name?: string;
  nginx_config?: string;
};

const environment_options = [
  { value: "development", label: "Development" },
  { value: "staging", label: "Staging" },
  { value: "production", label: "Production" },
];

const validate_repo_url = (v?: string) => {
  if (!v) return "Repository URL is required";
  if (!/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(\.git)?$/.test(v))
    return "Must be a valid GitHub HTTPS URL";
  return true;
};

const validate_branch = (v?: string) => {
  if (!v) return "Branch is required";
  if (/[^a-zA-Z0-9/_\-.]/.test(v)) return "Invalid branch name";
  return true;
};

function get_selected_option<T>(
  options: { value: T; label: string }[],
  value: T,
) {
  return options.find((o) => o.value === value) ?? null;
}

async function save_project(data: ProjectFormValues, id?: string) {
  const payload = id ? { ...data, id } : data;
  const res = await api.post("/projects", payload);
  return res.data;
}

async function get_project_by_id(id: string) {
  const res = await api.get(`/projects/${id}`);
  return res.data;
}

async function get_github_repos() {
  const res = await api.get(`/projects/github/repos`);
  return res.data;
}

async function get_server_list() {
  const res = await api.get(`/servers/servers-list`);
  return res.data;
}

const ssh_example = `cd /var/www/myapp
npm install
npm run build
pm2 restart app 2>/dev/null || pm2 start npm --name "app" -- run start`;

const docker_example = `cd /var/www/myapp
docker compose down && docker compose up -d --build`;

type Props = { id?: string };

export default function AddOrEditProject({ id }: Props) {
  const {
    register,
    watch,
    reset,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    defaultValues: {
      environment: "development",
      branch: "main",
      enable_webhook: false,
      deploy_script: "",
      deploy_type: 1,
      environment_variables: "",
    },
  });

  const { data: user_data, isLoading: user_loading } = useMe();
  const [active_tab, set_active_tab] = useState<Tab>("project");
  const [active_editor, setActive_editor] = useState(1);
  const [selected_repo, set_selected_repo] = useState<any>(null);
  const router = useRouter();
  const selected_branch = watch("branch");
  const fk_server_id = watch("fk_server_id");

  const [show_example, set_show_example] = useState(false);
  const [example_tab, set_example_tab] = useState<
    "deploy_ssh" | "deploy_docker" | "env" | "stop" | "nginx"
  >("deploy_ssh");

  const close_example = useCallback(() => set_show_example(false), []);
  const open_example = useCallback((tab: ExampleTab) => {
    set_example_tab(tab);
    set_show_example(true);
  }, []);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleEnvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 50) {
      toast.error("File too large");
      return;
    }
    if (!file.name.endsWith(".env")) {
      toast.error("Only .env files allowed");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setValue("environment_variables", content);
    };

    reader.readAsText(file);
  }
  const { data: project_data, isLoading: project_loading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => get_project_by_id(id!),
    enabled: !!id,
    refetchOnMount: true,
  });

  const { data: server_data, isLoading: server_loading } = useQuery({
    queryKey: ["servers-list"],
    queryFn: get_server_list,
    refetchOnMount: true,
  });

  const { data: github_repos, isLoading: repo_loading } = useQuery({
    queryKey: ["github_repos"],
    queryFn: get_github_repos,
    enabled: user_data?.provider === "github",
    refetchOnMount: true,

    retry: false,
  });

  const { data: branch_data, isLoading: branch_loading } = useQuery({
    queryKey: ["branches", selected_repo?.repo_full_name],
    queryFn: () =>
      api
        .get(`/projects/github/branches?repo=${selected_repo.repo_full_name}`)
        .then((r) => r.data),
    enabled: !!selected_repo,
    retry: false,
  });

  const { data: project_info, isLoading: project_info_loading } = useQuery({
    queryKey: ["project-info", selected_repo?.repo_full_name],
    queryFn: () =>
      api
        .get(`/projects/github/project-info`, {
          params: {
            repo: selected_repo.repo_full_name,
            branch: selected_branch,
          },
        })
        .then((r) => r.data),

    enabled:
      !!selected_branch && !!selected_repo && !!selected_repo.repo_full_name,
    retry: false,
  });

  const server_options = [
    { value: "custom", label: "Custom (manual entry)", server_type: null },
    ...(server_data?.data?.map((s: any) => ({
      value: s._id,
      label: s.name,
      server_type: s.server_type,
    })) ?? []),
  ];

  const is_custom = fk_server_id === "custom";

  const repo_options =
    github_repos?.data?.map((repo: any) => ({
      value: repo.repo_id,
      label: repo.name,
    })) ?? [];

  const branch_options =
    branch_data?.data?.map((b: any) => ({
      value: b.name,
      label: b.name,
    })) ?? [];

  useEffect(() => {
    if (github_repos?.data && project_data?.data) {
      const match = github_repos.data.find(
        (r: any) => r.repo_url === project_data?.data?.repo_url,
      );
      if (match) {
        set_selected_repo(match);
        setValue("repo_full_name", match.repo_full_name);
        setValue("is_private", match.is_private);
      }
    }
    if (project_data?.data) {
      const data = { ...project_data.data };
      if (Array.isArray(data.deploy_script)) {
        data.deploy_script = data.deploy_script.join("\n");
      }
      const pm2_name =
        data.project_name?.toLowerCase().replace(/\s+/g, "-") ?? "app";
      if (!data.stop_script) data.stop_script = `pm2 delete "${pm2_name}"`;

      reset(data);
    }
  }, [project_data, github_repos, reset, setValue]);

  const on_server_change = (
    onChange: (value: string | undefined) => void,
    value: string | undefined,
  ) => {
    onChange(value);
    setValue("ssh_host", undefined);
    setValue("ssh_user", undefined);
    setValue("ssh_key", undefined);
  };

  function GoBack() {
    router.push("/projects");
    return;
  }

  const [copied, set_copied] = useState(false);

  function handle_copy(text: string) {
    navigator.clipboard.writeText(text);
    set_copied(true);
    setTimeout(() => set_copied(false), 2000);
  }

  const { mutate, isPending } = useMutation({
    mutationFn: (data: ProjectFormValues) => save_project(data, id),
    onSuccess: (data: any) => {
      if (data.is_created || data.is_updated) {
        toast.success(
          data.msg || (data.is_created ? "Project Created" : "Project Updated"),
        );
        GoBack();
      } else {
        toast.error(data.msg || "An error occurred");
      }
    },
  });
  useEffect(() => {
    if (!project_info) return;

    if (
      id &&
      project_data &&
      project_data.data &&
      project_data.data.deploy_script &&
      Array.isArray(project_data.data.deploy_script) &&
      project_data.data.deploy_script.length > 0
    ) {
      const scripts_ = project_data.data.deploy_script
        .filter(Boolean)
        .join("\n");

      setValue("deploy_script", scripts_);
      return;
    }

    const { scripts, start_command, pm2_cmd, serve_cmd, docker_cmd, project } =
      project_info;

    let script = "";

    const is_docker =
      project === APP_CONSTANTS.PROJECT_FRONTEND_FRAMEWORKS.DOCKER;

    if (is_docker) {
      setValue("deploy_type", 2);
      script = [
        `cd /var/www/myapp`,
        docker_cmd ?? `docker compose down && docker compose up -d --build`,
      ].join("\n");
    } else if (start_command) {
      script = [
        `cd /var/www/myapp`,
        `git pull`,
        `pip install -r requirements.txt`,
        start_command,
      ].join("\n");
    } else {
      script = [
        `cd /var/www/myapp`,
        `git pull`,
        `npm install`,
        scripts?.build ? `npm run build` : null,
        serve_cmd ?? pm2_cmd ?? `pm2 restart app`,
      ]
        .filter(Boolean)
        .join("\n");
    }

    setValue("deploy_script", script);
  }, [project_info, setValue, id]);
  const on_submit = (data: ProjectFormValues) => mutate(data);
  const tabsRef = useRef<HTMLDivElement>(null);

  const [pillStyle, setPillStyle] = useState({ width: 0, x: 0 });

  useEffect(() => {
    const activeBtn = tabsRef.current?.querySelector<HTMLButtonElement>(
      "[data-active='true']",
    );
    if (activeBtn) {
      setPillStyle({
        width: activeBtn.offsetWidth,
        x: activeBtn.offsetLeft - 3,
      });
    }
  }, [active_editor]);

  function go_next() {
    const current = tab_order.indexOf(active_tab);
    if (current < tab_order.length - 1) set_active_tab(tab_order[current + 1]);
  }

  function go_prev() {
    const current = tab_order.indexOf(active_tab);
    if (current > 0) set_active_tab(tab_order[current - 1]);
  }

  if (
    user_loading ||
    (id &&
      (project_loading ||
        repo_loading ||
        branch_loading ||
        server_loading ||
        project_info_loading))
  ) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton height={20} width={200} borderRadius={6} />
        <div className="flex gap-0 border-b border-[var(--border-1)] mb-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} height={38} width={110} borderRadius={0} />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col gap-2.5">
              <Skeleton height={14} width={90} borderRadius={4} />
              <Skeleton height={44} borderRadius={8} />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-4 mt-2">
          <Skeleton height={40} width={90} borderRadius={8} />
          <Skeleton height={40} width={90} borderRadius={8} />
        </div>
      </div>
    );
  }

  const breadcrumb_items = [
    { label: "Projects", url: "/projects", active: false },
    { label: id ? "Edit Project" : "Create Project", active: true },
  ];

  function ToggleEditor(val: number) {
    setActive_editor(val);
  }

  return (
    <>
      <div className=" flex flex-row items-center justify-between  w-full">
        <div>
          <TooltipWrapper content="Go Back" direction="bottom" placement="left">
            <AppIconButton variant="outline" onClick={GoBack}>
              <IoArrowBack />
            </AppIconButton>
          </TooltipWrapper>
        </div>

        <BreadCrumbs items={breadcrumb_items} />
      </div>

      <form
        onSubmit={handleSubmit(on_submit)}
        className="flex flex-col gap-4"
        noValidate
      >
        <div className="flex border-b border-[var(--border-1)]">
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => set_active_tab(key)}
              className={`px-5 py-2.5 text-[13px] font-medium transition-colors border-b-2 -mb-px capitalize ${
                active_tab === key
                  ? "border-[var(--text-1)] text-[var(--text-1)]"
                  : "border-transparent text-[var(--text-4)] hover:text-[var(--text-2)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {active_tab === "project" && (
          <div className="flex flex-col gap-4 mt-2">
            <div className="grid grid-cols-2 gap-2.5">
              <AppTextInput
                placeholder="Enter project name"
                {...register("project_name", {
                  required: "Project name is required",
                })}
                className="h-11"
                error={errors.project_name?.message}
              />
              <Controller
                name="environment"
                control={control}
                render={({ field }) => (
                  <AppSelect
                    value={get_selected_option(
                      environment_options,
                      field.value,
                    )}
                    onChange={(o) => field.onChange(o?.value)}
                    options={environment_options}
                    className="h-11"
                  />
                )}
              />
            </div>
            <AppTextArea
              placeholder="Enter project description"
              {...register("description")}
            />
          </div>
        )}

        {active_tab === "deployment" && (
          <div className="flex flex-col gap-4 mt-2">
            <Controller
              name="enable_webhook"
              control={control}
              render={({ field }) => (
                <div
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors cursor-pointer ${
                    field.value
                      ? "border-[var(--border-2)] bg-[var(--bg-2)]"
                      : "border-[var(--border-1)] bg-[var(--bg-2)]"
                  }`}
                  onClick={() => field.onChange(!field.value)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        field.value
                          ? "bg-white/10 text-white"
                          : "bg-[var(--bg-3)] text-[var(--text-4)]"
                      }`}
                    >
                      <PiLightningFill size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-[var(--text-1)]">
                        Auto-deploy on push
                      </span>
                      <span className="text-[11px] text-[var(--text-4)]">
                        Trigger a deployment automatically when you push to the
                        selected branch
                      </span>
                    </div>
                  </div>
                  <div
                    className={`w-10 h-5 rounded-full flex items-center transition-colors flex-shrink-0 px-0.5 ${
                      field.value ? "bg-white/90" : "bg-[var(--border-2)]"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full shadow transition-transform ${
                        field.value
                          ? "translate-x-5 bg-black"
                          : "translate-x-0 bg-white"
                      }`}
                    />
                  </div>
                </div>
              )}
            />

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                {user_data?.provider === "github" && repo_options.length > 0 ? (
                  <Controller
                    name="repo_full_name"
                    control={control}
                    render={({ field }) => (
                      <AppSelect
                        isSearchable
                        value={
                          repo_options.find((o: any) => {
                            const repo = github_repos?.data?.find(
                              (r: any) => r.repo_full_name === field.value,
                            );
                            return repo ? o.value === repo.repo_id : false;
                          }) ?? null
                        }
                        onChange={(option) => {
                          const repo = github_repos?.data?.find(
                            (r: any) => r.repo_id === option?.value,
                          );
                          if (!repo) return;
                          set_selected_repo(repo);
                          field.onChange(repo.repo_full_name);
                          setValue("repo_url", repo.repo_url);
                          setValue("is_private", repo.is_private);
                          setValue("branch", repo.default_branch);
                        }}
                        options={repo_options}
                        className="h-11"
                      />
                    )}
                  />
                ) : repo_loading ? (
                  <Skeleton height={44} borderRadius={8} />
                ) : (
                  <AppTextInput
                    placeholder="https://github.com/username/repo"
                    {...register("repo_url", { validate: validate_repo_url })}
                    className="h-11"
                    error={errors.repo_url?.message}
                  />
                )}
              </div>
              <div>
                {user_data?.provider === "github" &&
                branch_options.length > 0 ? (
                  <Controller
                    name="branch"
                    control={control}
                    render={({ field }) => (
                      <AppSelect
                        value={
                          branch_options.find(
                            (o: any) => o.value === field.value,
                          ) ?? null
                        }
                        onChange={(o) => field.onChange(o?.value)}
                        options={branch_options}
                        className="h-11"
                      />
                    )}
                  />
                ) : branch_loading ? (
                  <Skeleton height={44} borderRadius={8} />
                ) : (
                  <AppTextInput
                    placeholder="main"
                    {...register("branch", { validate: validate_branch })}
                    className="h-11"
                    error={errors.branch?.message}
                  />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <AppTextInput
                placeholder="Enter Process name (Eg : myapp) can be used for viewing Logs "
                {...register("process_name")}
                className="h-11"
              />

              {server_loading ? (
                <Skeleton height={44} borderRadius={8} />
              ) : (
                <Controller
                  name="fk_server_id"
                  control={control}
                  render={({ field }) => (
                    <AppSelect
                      placeholder="Select a server or choose custom..."
                      isSearchable
                      value={
                        server_options.find((o) => o.value === field.value) ??
                        null
                      }
                      onChange={(o) =>
                        on_server_change(field.onChange, o?.value)
                      }
                      options={server_options}
                      className="h-11"
                    />
                  )}
                />
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              {is_custom && (
                <div className="flex flex-col gap-2 my-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <AppTextInput
                      placeholder="192.168.1.1 or example.com"
                      {...register("ssh_host", {
                        required: "SSH host is required",
                      })}
                      className="h-11"
                      error={errors.ssh_host?.message}
                    />
                    <AppTextInput
                      placeholder="SSH user (e.g. root, ubuntu)"
                      {...register("ssh_user", {
                        required: "SSH user is required",
                      })}
                      className="h-11"
                      error={errors.ssh_user?.message}
                    />
                  </div>

                  <AppTextArea
                    placeholder={
                      "Paste your SSH private key\n-----BEGIN OPENSSH PRIVATE KEY-----\n...\n-----END OPENSSH PRIVATE KEY-----"
                    }
                    rows={8}
                    {...register("ssh_key", {
                      required: "SSH key is required",
                    })}
                    error={errors.ssh_key?.message}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {active_tab === "scripts" && (
          <>
            <div className=" flex flex-row items-center justify-between">
              <div className=" flex  flex-row items-center">
                <div
                  ref={tabsRef}
                  className="relative flex gap-0 bg-[var(--bg-1)] border border-[var(--border-1)] rounded-[10px] p-[3px] w-fit"
                >
                  <div
                    className="absolute top-[3px] h-[calc(100%-6px)] bg-[var(--bg-4)] border border-[var(--border-2)] rounded-[7px] pointer-events-none z-0"
                    style={{
                      width: pillStyle.width,
                      transform: `translateX(${pillStyle.x}px)`,
                      transition:
                        "transform 0.22s cubic-bezier(0.35,0,0.25,1), width 0.22s cubic-bezier(0.35,0,0.25,1)",
                    }}
                  />

                  {SETTINGS_TABS.map(({ label, value }) => {
                    const isActive = value === active_editor;
                    return (
                      <button
                        key={value}
                        data-active={isActive}
                        type="button"
                        onClick={() => ToggleEditor(value)}
                        className={`
              relative z-10 px-3.5 py-1.5 rounded-[7px] text-[13px] font-medium
              border border-transparent transition-colors duration-150 whitespace-nowrap
              ${isActive ? "text-[var(--text-1)]" : "text-[var(--text-4)] hover:text-[var(--text-2)]"}
            `}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Controller
                name="deploy_type"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    {[
                      {
                        value: 1,
                        label: "SSH / PM2",
                        icon: <SiNodedotjs size={13} />,
                      },
                      {
                        value: 2,
                        label: "Docker",
                        icon: <SiDocker size={13} />,
                      },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          field.onChange(opt.value);
                          setValue(
                            "deploy_script",
                            opt.value === 2 ? docker_example : ssh_example,
                          );
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[12px] font-medium transition-colors ${
                          field.value === opt.value
                            ? "border-[var(--accent)] bg-[var(--bg-2)] text-[var(--text-1)]"
                            : "border-[var(--border-1)] bg-[var(--bg-1)] text-[var(--text-4)] hover:text-[var(--text-2)]"
                        }`}
                      >
                        {opt.icon}
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              />
            </div>
            {active_editor === 1 && (
              <div className="flex flex-col gap-2">
                {project_info_loading || (id && project_loading) ? (
                  <Skeleton height={300} borderRadius={12} />
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-3)] bg-[var(--bg-2)] border border-[var(--border-1)] rounded-lg px-3 py-2 w-fit">
                        <span>
                          {project_info && (
                            <>
                              <div className=" flex flex-row gap-1 font-semibold text-[var(--text-1)]">
                                {framework_icons[project_info.project]}
                                Auto-detected:{" "}
                                {framework_labels[project_info.project]}
                              </div>
                            </>
                          )}

                          {!project_info && <>Deploy Script</>}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => open_example("deploy_ssh")}
                        className="flex items-center gap-1.5 text-[11px] text-[var(--accent)] hover:text-[var(--text-1)] transition-colors"
                      >
                        <PiCode size={13} />
                        View examples
                      </button>
                    </div>

                    <Controller
                      name="deploy_script"
                      control={control}
                      render={({ field }) => (
                        <DeployScriptEditor
                          key="deploy-script-editor"
                          value={
                            typeof field.value === "string" ? field.value : ""
                          }
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </>
                )}
              </div>
            )}

            {active_editor === 2 && (
              <div className="flex flex-col gap-2">
                {project_info_loading || (id && project_loading) ? (
                  <Skeleton height={300} borderRadius={12} />
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-3)] bg-[var(--bg-2)] border border-[var(--border-1)] rounded-lg px-3 py-2 w-fit">
                        <span>Environment Variables</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => open_example("env")}
                          className="flex items-center gap-1.5 text-[11px] text-[var(--accent)] hover:text-[var(--text-1)] transition-colors"
                        >
                          <PiCode size={13} />
                          View example
                        </button>
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="flex items-center gap-1.5 text-[11px] text-[var(--accent)] hover:text-[var(--text-1)] transition-colors"
                        >
                          <MdOutlineFileUpload size={13} />
                          Upload .env
                        </button>
                        <input
                          ref={fileRef}
                          hidden
                          type="file"
                          accept=".env,.txt"
                          onChange={handleEnvUpload}
                        />
                      </div>
                    </div>

                    <Controller
                      name="environment_variables"
                      control={control}
                      render={({ field }) => (
                        <DeployScriptEditor
                          key="environment-editor"
                          value={
                            typeof field.value === "string" ? field.value : ""
                          }
                          onChange={field.onChange}
                        />
                      )}
                    />
                  </>
                )}
              </div>
            )}

            {active_editor === 3 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-3)] bg-[var(--bg-2)] border border-[var(--border-1)] rounded-lg px-3 py-2 w-fit">
                    <span>Stop Script</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => open_example("stop")}
                    className="flex items-center gap-1.5 text-[11px] text-[var(--accent)] hover:text-[var(--text-1)] transition-colors"
                  >
                    <PiCode size={13} />
                    View example
                  </button>
                </div>
                <span className="text-[11px] text-[var(--text-4)]">
                  Runs when you click Stop on the project
                </span>
                <Controller
                  name="stop_script"
                  control={control}
                  render={({ field }) => (
                    <DeployScriptEditor
                      key="stop-script-editor"
                      value={typeof field.value === "string" ? field.value : ""}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            )}

            {active_editor === 4 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-3)] bg-[var(--bg-2)] border border-[var(--border-1)] rounded-lg px-3 py-2 w-fit">
                    <span>Nginx Config</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => open_example("nginx")}
                    className="flex items-center gap-1.5 text-[11px] text-[var(--accent)] hover:text-[var(--text-1)] transition-colors"
                  >
                    <PiCode size={13} />
                    View example
                  </button>
                </div>
                <span className="text-[11px] text-[var(--text-4)]">
                  Paste your Nginx server block. DeployDock will write this to{" "}
                  <span className="font-mono">/etc/nginx/sites-available/</span>{" "}
                  and reload Nginx after each deploy.
                </span>
                <Controller
                  name="nginx_config"
                  control={control}
                  render={({ field }) => (
                    <DeployScriptEditor
                      key="nginx-config-editor"
                      value={typeof field.value === "string" ? field.value : ""}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            )}
          </>
        )}

        <div className="flex flex-row items-center justify-end gap-4 mt-2 mb-4">
          {active_tab !== "project" && (
            <AppButton
              variant="secondary"
              type="button"
              onClick={go_prev}
              disabled={isPending}
            >
              Previous
            </AppButton>
          )}
          <AppButton
            variant="secondary"
            type="button"
            onClick={GoBack}
            disabled={isPending}
          >
            Go Back
          </AppButton>
          <AppButton variant="primary" type="submit" disabled={isPending}>
            {isPending ? <Loader color="black" /> : id ? "Update" : "Save"}
          </AppButton>
          {active_tab !== "scripts" && (
            <AppButton
              variant="primary"
              type="button"
              onClick={go_next}
              disabled={isPending}
            >
              Next
            </AppButton>
          )}
        </div>
      </form>

      <AppModal
        open={show_example}
        onClose={close_example}
        onSubmit={close_example}
        title="Examples"
        submit_text="Close"
        variant="primary"
        width="580px"
      >
        <div className="flex flex-col gap-4">
          <div className="flex border-b border-[var(--border-1)] gap-0 flex-wrap">
            {(Object.keys(examples) as ExampleTab[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => set_example_tab(key)}
                className={`px-4 py-2 text-[12px] font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
                  example_tab === key
                    ? "border-[var(--text-1)] text-[var(--text-1)]"
                    : "border-transparent text-[var(--text-4)] hover:text-[var(--text-2)]"
                }`}
              >
                {examples[key].label}
              </button>
            ))}
          </div>

          <div className="relative">
            <pre className="bg-[var(--bg-3)] rounded-lg px-4 py-3 text-[12px] text-[var(--text-2)] font-mono whitespace-pre leading-relaxed overflow-x-auto">
              {examples[example_tab].content}
            </pre>
            <button
              type="button"
              onClick={() => handle_copy(examples[example_tab].content)}
              className="absolute top-2 right-2 flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-md bg-[var(--bg-4)] border border-[var(--border-2)] text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <p className="text-[11px] text-[var(--text-4)]">
            {example_tab === "deploy_ssh" &&
              "Fetches latest code, installs deps, builds, and restarts via PM2. Adjust the path and process name to match your server."}
            {example_tab === "deploy_docker" &&
              "Pulls latest code then rebuilds and restarts your Docker containers. Make sure docker-compose.yml is in your repo."}
            {example_tab === "env" &&
              "Each line is KEY=VALUE. These are written to a .env file in your working directory on the remote server before the deploy script runs."}
            {example_tab === "stop" &&
              "This runs when you click Stop on the project. PM2 delete removes the process entirely — use pm2 stop to keep it registered."}
            {example_tab === "nginx" &&
              "Paste a full server block. DeployDock writes this to /etc/nginx/sites-available/ and reloads Nginx after deploy. Make sure Nginx is installed on your server."}
          </p>
        </div>
      </AppModal>
    </>
  );
}
