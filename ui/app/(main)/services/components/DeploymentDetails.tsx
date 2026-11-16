"use client";

import { formatRelative } from "@/lib/date";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Deployment, shortImage } from "../ViewServices";
import {
  STATUS_META,
  TRIGGER_LABEL,
  formatDuration,
} from "@/components/common/AppTable";
function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

export default function DeploymentDetails({
  deployment,
  isDocker,
}: {
  deployment: Deployment;
  isDocker: boolean;
}) {
  const meta = STATUS_META[deployment.status] ?? {
    label: "Unknown",
    className: "text-muted-foreground",
  };

  return (
    <div className="space-y-4 rounded-lg border p-4 ">
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
        <Detail label="Status">
          <Badge variant="outline" className={cn("capitalize", meta.className)}>
            {meta.label}
          </Badge>
        </Detail>

        <Detail label="Trigger">
          <Badge variant="secondary">
            {TRIGGER_LABEL[deployment.trigger] ?? "-"}
          </Badge>
        </Detail>

        <Detail label={isDocker ? "Container" : "Deployment"}>
          <span className="font-mono">
            {isDocker
              ? (deployment.container_name ?? deployment.id.slice(0, 8))
              : deployment.id.slice(0, 8)}
          </span>
        </Detail>

        <Detail label={isDocker ? "Image" : "Commit"}>
          <span className="font-mono text-xs">
            {isDocker
              ? shortImage(deployment.image_tag)
              : (deployment.commit_sha?.slice(0, 7) ?? "-")}
          </span>
        </Detail>

        <Detail label="Started">
          <span className="text-muted-foreground">
            {formatRelative(deployment.started_on ?? deployment.created_on)}
          </span>
        </Detail>

        <Detail label="Duration">
          <span className="text-muted-foreground">
            {formatDuration(deployment.started_on, deployment.finished_on)}
          </span>
        </Detail>
      </div>

      {deployment.error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 font-mono text-xs text-destructive">
          {deployment.error}
        </div>
      )}
    </div>
  );
}
