"use client";

import { Clock } from "lucide-react";
import { DEPLOY_TYPE } from "@/constants";
import { useGetServicebyIDEdit } from "@/hooks/queries/useServices";
import DockerTab from "../../../components/DockerTab";
import { formatDateTime } from "@/lib/date";
import AppIcon from "@/components/common/AppIcons";
import GitHubTab from "../../../components/Githubtab";
import { EditServiceSkeleton } from "@/components/common/AppLoaders";
import { useBreadcrumbItems } from "@/contexts/breadcrumb-provider";

export type Props = {
  id: string;
  service_id: string;
};

export default function EditService({ service_id, id }: Props) {
  const { data, isLoading } = useGetServicebyIDEdit(service_id);

  const service = data?.data ?? null;
  useBreadcrumbItems([
    {
      label: "Services",
      href: service ? `/projects/${service.project_id}` : "/projects",
    },
    { label: service ? `Edit Service - ${service.name}` : "Edit Service" },
  ]);

  if (isLoading) return <EditServiceSkeleton />;

  if (!service) return null;

  const isDocker = Number(service?.deploy_type) === DEPLOY_TYPE.DOCKER;

  const d = formatDateTime(service.updated_on);

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AppIcon type={isDocker ? "docker" : "github"} size={40} />
          <div className="flex flex-col">
            <p className="text-xs text-muted-foreground">
              {isDocker ? "Editing Docker service" : "Editing GitHub service"}
            </p>
            <h1 className="text-xl font-semibold leading-tight tracking-tight">
              {service.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-md border bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>Last updated</span>
          <span className="font-medium text-foreground/80">
            {d.datePart} · {d.timePart}
          </span>
        </div>
      </div>

      {isDocker && (
        <DockerTab
          id={id}
          type={service.type}
          isEdit={true}
          editData={service}
          service_id={service_id}
        />
      )}

      {!isDocker && (
        <GitHubTab
          id={id}
          type={service.type}
          isEdit={true}
          editData={service}
          service_id={service_id}
        />
      )}
    </>
  );
}
