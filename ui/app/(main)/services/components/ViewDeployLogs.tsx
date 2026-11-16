"use client";
import { useGetDeployLogsByID } from "@/hooks/queries/useDeploy";
import { ServiceHeader } from "../ViewServices";
import TerminalLogs, { DeploymentLog } from "./TerminalLogs";
import { ViewDeploylogsSkeleton } from "@/components/common/AppLoaders";
import DeploymentDetails from "./DeploymentDetails";
import { DEPLOY_TYPE } from "@/constants";
import type { Deployment } from "../ViewServices";
import { useBreadcrumbItems } from "@/contexts/breadcrumb-provider";
type Props = {
  id: string;
  type: string;
};

const EMPTY: DeploymentLog[] = [];

export default function ViewDeploylogs({ id, type }: Props) {
  const { data, isLoading } = useGetDeployLogsByID(id);

  const service = data?.data?.service ?? null;

  useBreadcrumbItems([
    {
      label: "Services",
      href: service ? `/projects/${service.project_id}` : "/projects",
    },
    {
      label: service ? `Deployments - ${service.name}` : "Deployments",
      href: service ? `/services/${type}/${service.id}/deploys` : "/projects",
    },
    {
      label: "Deployment Logs",
    },
  ]);

  if (isLoading) return <ViewDeploylogsSkeleton />;
  const deployment = (data?.data?.deployment ?? null) as Deployment | null;
  if (!service) return null;
  const logs = (data?.data?.deployment_logs ?? EMPTY) as DeploymentLog[];
  return (
    <div className="space-y-6">
      <ServiceHeader service={service} />
      {deployment && (
        <DeploymentDetails
          deployment={deployment}
          isDocker={service.deploy_type === DEPLOY_TYPE.DOCKER}
        />
      )}
      <div className="space-y-2">
        <TerminalLogs logs={logs} deployment_id={id} />
      </div>
    </div>
  );
}
