"use client";
import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Code, Coffee, Cog, FlaskConical, Gem, Hexagon } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RUNTIMES } from "@/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetUserBranch,
  useGetRepoTree,
  useGetDetect,
} from "@/hooks/queries/useGithub";
import RepoCombobox from "./GitHubRepoList";
import FieldRow from "./FieldRow";
import { DirectoryTree } from "./DirectoryTree";
import { Input } from "@/components/ui/input";
import { GitHubFormValues } from "@/types/services.types";
import { GITHUB_REPO_TYPE } from "@/constants";
import { cn } from "@/lib/utils";

function parseRepoInput(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/\/$/, "");
}

function useRepoParts() {
  const { control } = useFormContext<GitHubFormValues>();
  const repoFullName = useWatch({ control, name: "repo_full_name" });
  const [owner = "", repo = ""] = repoFullName.split("/");
  return { owner, repo };
}

const RUNTIME_OPTIONS = [
  {
    value: RUNTIMES.NODE,
    label: "Node.js",
    icon: Hexagon,
    build_command: "npm install && npm run build",
    start_command: "npm start",
    port: 3000,
  },
  {
    value: RUNTIMES.PYTHON,
    label: "Python",
    icon: Code,
    build_command: "pip install --no-cache-dir -r requirements.txt",
    start_command: "gunicorn app:app -b 0.0.0.0:$PORT",
    port: 8000,
  },
  {
    value: RUNTIMES.JAVA,
    label: "Java",
    icon: Coffee,
    build_command: "mvn -q package -DskipTests",
    start_command: "java -jar target/app.jar",
    port: 8080,
  },
  {
    value: RUNTIMES.RUBY,
    label: "Ruby",
    icon: Gem,
    build_command: "bundle install",
    start_command: "bundle exec rails server -b 0.0.0.0 -p $PORT",
    port: 3000,
  },
  {
    value: RUNTIMES.ELXIR,
    label: "Elixir",
    icon: FlaskConical,
    build_command: "mix deps.get && mix compile",
    start_command: "mix phx.server",
    port: 4000,
  },
  {
    value: RUNTIMES.RUST,
    label: "Rust",
    icon: Cog,
    build_command: "cargo build --release",
    start_command: "./target/release/app",
    port: 8080,
  },
];

export function AutoDeployField() {
  const { setValue, control } = useFormContext<GitHubFormValues>();
  const autoDeploy = useWatch({ control, name: "auto_deploy" });

  function handleAutoDeployChange(checked: boolean) {
    setValue("auto_deploy", checked, { shouldDirty: true });
  }

  return (
    <FieldRow
      label="Auto deploy"
      description="Deploy automatically on every push to the selected branch"
    >
      <div className="flex items-center gap-2">
        <Checkbox
          id="auto_deploy"
          checked={!!autoDeploy}
          onCheckedChange={handleAutoDeployChange}
        />
        <Label htmlFor="auto_deploy">Enable auto deploy</Label>
      </div>
    </FieldRow>
  );
}

export function UseDockerfileField() {
  const { setValue, clearErrors, control } = useFormContext<GitHubFormValues>();
  const isDockerfile = useWatch({ control, name: "use_dockerfile" });

  function handleDockerfileChange(checked: boolean) {
    setValue("use_dockerfile", checked);
    if (checked) clearErrors(["build_command", "start_command"]);
  }

  return (
    <FieldRow
      label="Dockerfile"
      description="Build with the Dockerfile in the root directory instead of build and start commands"
    >
      <div className="flex items-center gap-2">
        <Checkbox
          id="use_dockerfile"
          checked={!!isDockerfile}
          onCheckedChange={handleDockerfileChange}
        />
        <Label htmlFor="use_dockerfile">Use repository Dockerfile</Label>
      </div>
    </FieldRow>
  );
}

export function RuntimeField() {
  const { setValue, control } = useFormContext<GitHubFormValues>();
  const runtime = useWatch({ control, name: "runtime" });

  const RUNTIME_ITEMS = RUNTIME_OPTIONS.map((item) => ({
    value: item.value,
    label: item.label,
  }));
  function handleRuntimeChange(v: unknown) {
    const next = RUNTIME_OPTIONS.find((item) => item.value === Number(v));
    if (!next) return;
    setValue("runtime", next.value);
    setValue("build_command", next.build_command);
    setValue("start_command", next.start_command);
    setValue("port", next.port);
  }

  return (
    <FieldRow label="Runtime" description="Language your service runs on">
      <Select
        value={runtime}
        onValueChange={handleRuntimeChange}
        items={RUNTIME_ITEMS}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select runtime" />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} sideOffset={4}>
          {RUNTIME_OPTIONS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              <span className="flex items-center gap-2">
                <item.icon className="size-4" />
                {item.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldRow>
  );
}

export function StartCommandField() {
  const {
    register,
    formState: { errors },
  } = useFormContext<GitHubFormValues>();

  return (
    <FieldRow
      label="Start command"
      description="Must listen on 0.0.0.0 and the port above (use $PORT)"
      htmlFor="start_command"
    >
      <Input
        id="start_command"
        placeholder="npm start"
        aria-invalid={!!errors.start_command}
        {...register("start_command", {
          validate: (value, form_values) =>
            form_values.use_dockerfile ||
            !!value ||
            "Start command is required",
        })}
      />
      {errors.start_command && (
        <p className="mt-1 text-sm text-destructive">
          {errors.start_command.message}
        </p>
      )}
    </FieldRow>
  );
}

export function RepoTypeField() {
  const { setValue, control } = useFormContext<GitHubFormValues>();
  const repoType = useWatch({ control, name: "repo_type" });

  useEffect(() => {
    if (!repoType) setValue("repo_type", GITHUB_REPO_TYPE.PRIVATE);
  }, [repoType, setValue]);

  function handleRepoTypeChange(v: unknown) {
    const next = Number(v) || GITHUB_REPO_TYPE.PRIVATE;
    if (next === repoType) return;
    setValue("repo_type", next);
    setValue("repo_id", null);
    setValue("repo_full_name", "");

    setValue("branch", "");
    setValue("root_directory", "/");
  }

  return (
    <FieldRow
      label="Repository type"
      description="Private repos are picked from your GitHub account"
    >
      <RadioGroup
        value={repoType || GITHUB_REPO_TYPE.PRIVATE}
        onValueChange={handleRepoTypeChange}
        className="flex items-center gap-6"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem
            value={GITHUB_REPO_TYPE.PRIVATE}
            id="repo_type_private"
          />
          <Label htmlFor="repo_type_private">Private</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem
            value={GITHUB_REPO_TYPE.PUBLIC}
            id="repo_type_public"
          />
          <Label htmlFor="repo_type_public">Public</Label>
        </div>
      </RadioGroup>
    </FieldRow>
  );
}
function PublicRepoInput() {
  const {
    setValue,
    control,
    formState: { errors },
  } = useFormContext<GitHubFormValues>();
  const repoFullName = useWatch({ control, name: "repo_full_name" });
  const [inputValue, setInputValue] = useState(repoFullName ?? "");

  function commitRepo() {
    const parsed = parseRepoInput(inputValue);
    if (parsed === repoFullName) return;
    setInputValue(parsed);
    setValue("repo_full_name", parsed, { shouldValidate: true });
    setValue("name", parsed.split("/")[1] ?? "");
    setValue("branch", "");
    setValue("root_directory", "/");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    commitRepo();
  }

  return (
    <>
      <Input
        id="repo_full_name"
        placeholder="owner/repo or https://github.com/owner/repo"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={commitRepo}
        onKeyDown={handleKeyDown}
        aria-invalid={!!errors.repo_full_name}
      />
      {errors.repo_full_name && (
        <p className="mt-1 text-sm text-destructive">
          {errors.repo_full_name.message}
        </p>
      )}
    </>
  );
}

export function RepoField() {
  const {
    setValue,
    control,
    formState: { errors },
  } = useFormContext<GitHubFormValues>();
  const repoId = useWatch({ control, name: "repo_id" });
  const repoType = useWatch({ control, name: "repo_type" });
  const isPublic = repoType === GITHUB_REPO_TYPE.PUBLIC;

  function handleRepoChange(id: number, selectedRepo: any) {
    if (id === repoId) return;
    setValue("repo_id", id);
    setValue("name", selectedRepo?.name ?? "");
    setValue("repo_id", id, { shouldValidate: true });
    setValue("repo_full_name", selectedRepo.full_name);
    setValue("branch", "");
    setValue("root_directory", "/");
  }

  return (
    <FieldRow
      label="Repository"
      description={
        isPublic
          ? "Enter a public repository as owner/repo or its GitHub URL"
          : "Select the repository you want to deploy"
      }
    >
      {isPublic ? (
        <PublicRepoInput />
      ) : (
        <RepoCombobox
          value={repoId}
          onChange={handleRepoChange}
          error={errors.repo_id?.message}
        />
      )}
    </FieldRow>
  );
}

export function BranchField() {
  const {
    setValue,
    control,
    formState: { errors },
  } = useFormContext<GitHubFormValues>();
  const repoFullName = useWatch({ control, name: "repo_full_name" });
  const branch = useWatch({ control, name: "branch" });
  const { owner, repo } = useRepoParts();

  const { data: branchData, isLoading } = useGetUserBranch(owner, repo);

  const branches: string[] = branchData?.data?.branches ?? [];
  const defaultBranch: string = branchData?.data?.default_branch ?? "";

  useEffect(() => {
    if (defaultBranch) setValue("branch", defaultBranch);
  }, [defaultBranch, repoFullName, setValue]);

  function handleBranchChange(v: string | null) {
    setValue("branch", v ?? "", { shouldValidate: true });
    setValue("root_directory", "/");
  }

  return (
    <FieldRow label="Branch" description="Branch to build and deploy from">
      <Select
        value={branch}
        onValueChange={handleBranchChange}
        disabled={isLoading}
      >
        <SelectTrigger
          className={cn("w-full", errors.branch && "border-destructive")}
          aria-invalid={!!errors.branch}
        >
          <SelectValue
            placeholder={isLoading ? "Loading..." : "Select branch"}
          />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} sideOffset={4}>
          {branches.map((b) => (
            <SelectItem key={b} value={b}>
              <span className="flex items-center gap-2">
                {b}
                {b === defaultBranch && (
                  <Badge variant="secondary" className="text-xs">
                    default
                  </Badge>
                )}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>{" "}
      {errors.branch && (
        <p className="mt-1 text-sm text-destructive">{errors.branch.message}</p>
      )}
    </FieldRow>
  );
}

export function RootDirectoryField() {
  const {
    setValue,
    control,
    formState: { errors },
  } = useFormContext<GitHubFormValues>();
  const branch = useWatch({ control, name: "branch" });
  const rootDirectory = useWatch({ control, name: "root_directory" });
  const { owner, repo } = useRepoParts();

  const { data: treeData, isLoading } = useGetRepoTree(owner, repo, branch);

  const dirs: string[] = treeData?.data?.dirs ?? [];
  const packageDirs: string[] = treeData?.data?.package_dirs ?? [];
  const truncated: boolean = treeData?.data?.truncated ?? false;

  function handleRootChange(path: string) {
    setValue("root_directory", path);
  }

  return (
    <FieldRow
      label="Root directory"
      description={
        truncated
          ? "Repo is very large, some folders may be missing"
          : "Folder containing your app. Use / for the repo root"
      }
    >
      <DirectoryTree
        dirs={dirs}
        packageDirs={packageDirs}
        value={rootDirectory}
        onChange={handleRootChange}
        loading={!branch || isLoading}
        error={errors.root_directory?.message}
      />
    </FieldRow>
  );
}
export function BuildSettingsFields({ type }: { type: string }) {
  const isStatic = type === "static";
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<GitHubFormValues>();
  const branch = useWatch({ control, name: "branch" });
  const rootDirectory = useWatch({ control, name: "root_directory" });
  const { owner, repo } = useRepoParts();

  const { data: detectData, isLoading } = useGetDetect(
    owner,
    repo,
    branch,
    rootDirectory,
  );

  const detectedBuildCommand: string = detectData?.data?.build_command ?? "";

  useEffect(() => {
    if (!isStatic || !detectData) return;
    setValue("build_command", detectedBuildCommand);
  }, [isStatic, detectData, detectedBuildCommand, setValue]);

  return (
    <>
      <FieldRow
        label="Build command"
        description="Install and build in one command"
        htmlFor="build_command"
      >
        <Input
          id="build_command"
          placeholder={
            isLoading ? "Detecting..." : "npm install && npm run build"
          }
          aria-invalid={!!errors.build_command}
          {...register("build_command", {
            validate: (value, form_values) =>
              form_values.use_dockerfile ||
              !!value ||
              "Build command is required",
          })}
        />

        {errors.build_command && (
          <p className="mt-1 text-sm text-destructive">
            {errors.build_command.message}
          </p>
        )}
      </FieldRow>

      {isStatic && (
        <FieldRow
          label="Output directory"
          description="Folder with the built static files"
          htmlFor="output_directory"
        >
          <Input
            id="output_directory"
            placeholder="dist"
            aria-invalid={!!errors.output_directory}
            {...register("output_directory")}
          />
        </FieldRow>
      )}
    </>
  );
}
