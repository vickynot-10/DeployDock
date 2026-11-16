"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  ExternalLink,
  GitBranch,
  PauseCircle,
  PlayCircle,
  Rocket,
  Trash2,
  Plug,
  Settings2,
} from "lucide-react";
import { DEPLOYMENT_STATUS, DEPLOY_TYPE } from "@/constants";
import {
  useDeployService,
  useGetServicebyID,
  useServicesBulkAction,
} from "@/hooks/queries/useServices";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ServiceActionType } from "../projects/components/ServicesDialog";
import ServicesSuspendDeleteDialog from "../projects/components/ServicesDialog";

import AppIcon from "@/components/common/AppIcons";
import AppIconButton from "@/components/common/AppIconButton";
import { ViewServiceSkeleton } from "@/components/common/AppLoaders";
import { useServiceStatusSocket } from "@/hooks/socket/useServiceSocket";
import Tooltip from "@/components/common/ToolTip";
import { useBreadcrumbItems } from "@/contexts/breadcrumb-provider";
import {
  AppTableHeader,
  EmptyRow,
  LogsCell,
  StatusCell,
  TimeCells,
  TriggerCell,
} from "@/components/common/AppTable";
import { AppRunTimeBadge } from "@/components/common/AppRunTime";
type Props = {
  id: string;
  type: string;
};

type ServiceData = {
  id: string;
  name: string;
  type: "static" | "web";
  host: string | null;
  enabled: boolean;
  project_id: string;
  deploy_type: number;

  port: number;
  image_url: string | null;
  repo_full_name: string | null;
  branch: string | null;
  runtime?: number;
};

export type Deployment = {
  id: string;
  status: number;
  trigger: number;
  error: string | null;
  image_tag: string | null;
  commit_sha: string | null;
  container_name: string | null;
  created_on: string;
  started_on: string | null;
  finished_on: string | null;
};

type TableProps = {
  deployments: Deployment[];
  enabled: boolean;
  type: string;
  service_id: string;
};

const EMPTY: Deployment[] = [];

export function shortImage(tag: string | null) {
  if (!tag) return "-";
  const [name, digest] = tag.split("@");
  return digest ? `${name}@${digest.slice(7, 19)}` : tag;
}

const DOCKER_TABLE_HEADERS = [
  { label: "Status", id: 1 },
  { label: "Container", id: 2 },
  { label: "Image", id: 3 },

  { label: "Trigger", id: 4 },
  { label: "Started", id: 5 },
  { label: "Duration", id: 6 },
  { label: null, id: 6 },
];

function DockerDeployTable({
  deployments,
  enabled,
  type,
  service_id,
}: TableProps) {
  return (
    <Table>
      <AppTableHeader items={DOCKER_TABLE_HEADERS} />
      <TableBody>
        {deployments.map((deployment) => (
          <TableRow key={deployment.id} className="h-14">
            <StatusCell status={deployment.status} enabled={enabled} />
            <TableCell>
              <div className="flex flex-col">
                <span className="font-mono text-sm">
                  {deployment.container_name ?? deployment.id.slice(0, 8)}
                </span>
                {deployment.error && (
                  <Tooltip content={deployment.error}>
                    <span className="block max-w-[400px] truncate text-xs text-destructive cursor-default">
                      {deployment.error}
                    </span>
                  </Tooltip>
                )}
              </div>
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {shortImage(deployment.image_tag)}
            </TableCell>
            <TriggerCell trigger={deployment.trigger} />
            <TimeCells deployment={deployment} />
            <LogsCell
              deployment_id={deployment.id}
              type={type}
              service_id={service_id}
            />
          </TableRow>
        ))}
        {deployments.length === 0 && (
          <EmptyRow text="Deployment not found !" colspan={7} />
        )}
      </TableBody>
    </Table>
  );
}

const GITHUB_TABLE_HEADERS = [
  { label: "Status", id: 1 },
  { label: "Deployment", id: 2 },
  { label: "Commit", id: 3 },

  { label: "Trigger", id: 4 },
  { label: "Started", id: 5 },
  { label: "Duration", id: 6 },
  { label: null, id: 6 },
];

function GithubDeployTable({
  deployments,
  enabled,
  type,
  service_id,
}: TableProps) {
  return (
    <Table>
      <AppTableHeader items={GITHUB_TABLE_HEADERS} />
      <TableBody>
        {deployments.map((deployment) => (
          <TableRow key={deployment.id} className="h-14">
            <StatusCell status={deployment.status} enabled={enabled} />
            <TableCell>
              <div className="flex flex-col">
                <span className="font-mono text-sm">
                  {deployment.container_name ?? deployment.id.slice(0, 8)}
                </span>
                {deployment.error && (
                  <Tooltip content={deployment.error}>
                    <span className="block max-w-[400px] truncate text-xs text-destructive cursor-default">
                      {deployment.error}
                    </span>
                  </Tooltip>
                )}
              </div>
            </TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {deployment.commit_sha ? deployment.commit_sha.slice(0, 7) : "-"}
            </TableCell>
            <TriggerCell trigger={deployment.trigger} />
            <TimeCells deployment={deployment} />
            <LogsCell
              deployment_id={deployment.id}
              type={type}
              service_id={service_id}
            />
          </TableRow>
        ))}
        {deployments.length === 0 && (
          <EmptyRow text="Deployment not found !" colspan={7} />
        )}
      </TableBody>
    </Table>
  );
}

export function ServiceHeader({ service }: { service: ServiceData }) {
  const [copied, setCopied] = useState(false);
  const isDocker = service.deploy_type === DEPLOY_TYPE.DOCKER;

  const url = service.host ? service.host : null;

  async function copyUrl() {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold">{service.name}</h2>
        <Badge variant="secondary" className="capitalize">
          {service.type}
        </Badge>
        {!service.enabled && (
          <Badge variant="outline" className="text-amber-600">
            Suspended
          </Badge>
        )}

        <AppIconButton
          icon={<Settings2 className=" size-4" />}
          tooltip="Edit Service"
          href={`/projects/${service.project_id}/edit/${service.id}`}
        />
      </div>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <AppIcon type={isDocker ? "docker" : "github"} />

            <span className="font-medium">
              {isDocker ? service.image_url : service.repo_full_name}
            </span>
          </div>
          {!isDocker && service.branch && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <GitBranch className="size-4" />
              <span>{service.branch}</span>
            </div>
          )}
          {service.runtime && <AppRunTimeBadge type={service.runtime} />}
          {service.port && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Plug className="size-4" />
              <span className="font-mono">:{service.port}</span>
            </div>
          )}{" "}
        </div>

        {url && (
          <div className="flex items-center gap-1">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline",
                !service.enabled && "pointer-events-none opacity-50",
              )}
            >
              {url}
              <ExternalLink className="size-3" />
            </a>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={copyUrl}
              aria-label="Copy URL"
            >
              {copied ? (
                <Check className="size-4 text-green-600" />
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

export default function ViewService({ id, type }: Props) {
  const router = useRouter();
  const { data, isLoading } = useGetServicebyID(id);
  useServiceStatusSocket(id);
  const { mutate: bulkMutate, isPending: isBulkPending } =
    useServicesBulkAction();
  const { mutate: deployMutate, isPending: isDeploying } = useDeployService();

  const [dialogType, setDialogType] = useState<ServiceActionType | null>(null);

  const service = (data?.data?.services ?? null) as ServiceData | null;
  const deployments = (data?.data?.deployments ?? EMPTY) as Deployment[];

  useBreadcrumbItems([
    {
      label: "Services",
      href: service ? `/projects/${service.project_id}` : "/projects",
    },
    { label: service ? `Deployments - ${service.name}` : "Deployments" },
  ]);

  if (isLoading) return <ViewServiceSkeleton />;

  if (!service) {
    return <p className="text-sm text-muted-foreground">Service not found.</p>;
  }

  const hasInFlight = deployments.some(
    (d) =>
      d.status === DEPLOYMENT_STATUS.QUEUED ||
      d.status === DEPLOYMENT_STATUS.BUILDING,
  );

  const isDocker = service.deploy_type === DEPLOY_TYPE.DOCKER;

  function handleResume() {
    bulkMutate({
      action: "resume",
      ids: [service!.id],
      project_id: service!.project_id,
    });
  }

  function handleDeleted() {
    router.push(`/projects/${service!.project_id}`);
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <ServiceHeader service={service} />
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="gap-1.5"
              disabled={!service.enabled || isDeploying || hasInFlight}
              onClick={() => deployMutate(service.id)}
            >
              <Rocket className="size-4" /> Deploy
            </Button>
            {service.enabled ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setDialogType("suspend")}
              >
                <PauseCircle className="size-4" /> Suspend
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={isBulkPending}
                onClick={handleResume}
              >
                <PlayCircle className="size-4 text-green-600" /> Resume
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={() => setDialogType("delete")}
            >
              <Trash2 className="size-4" /> Delete
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Deploys</h3>
          {isDocker ? (
            <DockerDeployTable
              deployments={deployments}
              enabled={service.enabled}
              type={type}
              service_id={service.id}
            />
          ) : (
            <GithubDeployTable
              deployments={deployments}
              enabled={service.enabled}
              type={type}
              service_id={service.id}
            />
          )}
        </div>
      </div>

      <ServicesSuspendDeleteDialog
        open={dialogType !== null}
        onOpenChange={(o) => !o && setDialogType(null)}
        ids={[service.id]}
        type={dialogType ?? "suspend"}
        onSuccess={dialogType === "delete" ? handleDeleted : undefined}
        project_id={service.project_id}
      />
    </>
  );
}
