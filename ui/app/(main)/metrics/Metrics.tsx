"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { ServiceSelect } from "@/components/common/ServiceSelect";
import { ContainerCards } from "./components/MetricContainer";
import { DeploymentStats } from "./components/DeploymentsMetrics";
import { MetricChart } from "./components/MetricChart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChartConfig } from "@/components/ui/chart";
import { useGetMetrics } from "@/hooks/queries/useMetrics";

const BYTES_PER_MB = 1024 * 1024;

const statusConfig = {
  count: { label: "Deployments", color: "var(--chart-1)" },
} satisfies ChartConfig;

const cpuConfig = {
  cpu: { label: "CPU %", color: "var(--chart-2)" },
} satisfies ChartConfig;

const memoryConfig = {
  memory_mb: { label: "Memory (MB)", color: "var(--chart-3)" },
} satisfies ChartConfig;

const networkConfig = {
  rx_mb: { label: "In (MB)", color: "var(--chart-4)" },
  tx_mb: { label: "Out (MB)", color: "var(--chart-5)" },
} satisfies ChartConfig;

function MetricsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export default function MetricsModule() {
  const [serviceId, setServiceId] = useState<string | null>(null);
  const { data, isLoading, isFetching, refetch } = useGetMetrics(serviceId);

  const containers = data?.containers ?? [];

  const statusRows = data
    ? [
        { status: "Running", count: data.deployments.running },
        { status: "Failed", count: data.deployments.failed },
        { status: "Queued", count: data.deployments.queued },
        { status: "Cancelled", count: data.deployments.cancelled },
        { status: "Stopped", count: data.deployments.stopped },
        { status: "Superseded", count: data.deployments.superseded },
        { status: "Suspended", count: data.deployments.suspended },
      ]
    : [];

  const cpuRows = containers.map((item) => ({
    name: item.service_name,
    cpu: Number(item.cpu_percent.toFixed(2)),
  }));

  const memoryRows = containers.map((item) => ({
    name: item.service_name,
    memory_mb: Number((item.memory_bytes / BYTES_PER_MB).toFixed(1)),
  }));

  const networkRows = containers.map((item) => ({
    name: item.service_name,
    rx_mb: Number((item.rx_bytes / BYTES_PER_MB).toFixed(2)),
    tx_mb: Number((item.tx_bytes / BYTES_PER_MB).toFixed(2)),
  }));

  function handleServiceChange(id: string | null) {
    setServiceId(id);
  }

  function handleRefresh() {
    refetch();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Metrics</h1>
        <div className="flex items-center gap-2">
          <ServiceSelect value={serviceId} onChange={handleServiceChange} />
          <Button
            variant="secondary"
            size="icon"
            onClick={handleRefresh}
            disabled={isFetching}
            aria-label="Refresh metrics"
          >
            {isFetching ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
          </Button>
        </div>
      </div>

      {isLoading || !data ? (
        <MetricsSkeleton />
      ) : (
        <>
          <DeploymentStats stats={data.deployments} />

          <MetricChart
            title="Deployments by status"
            description="Number of deployments in each status"
            config={statusConfig}
            data={statusRows}
            xKey="status"
            dataKeys={["count"]}
          />

          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              Running containers
            </h2>
            <ContainerCards containers={containers} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <MetricChart
              title="CPU"
              description="Percent of one core, per service"
              config={cpuConfig}
              data={cpuRows}
              xKey="name"
              dataKeys={["cpu"]}
            />
            <MetricChart
              title="Memory"
              description="Memory in use, per service"
              config={memoryConfig}
              data={memoryRows}
              xKey="name"
              dataKeys={["memory_mb"]}
            />
            <div className="lg:col-span-2">
              <MetricChart
                title="Network"
                description="Total traffic since the container started"
                config={networkConfig}
                data={networkRows}
                xKey="name"
                dataKeys={["rx_mb", "tx_mb"]}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
