"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { ServiceSelect } from "@/components/common/ServiceSelect";
import { ContainerCards } from "./components/MetricContainer";
import { MetricChart } from "./components/MetricChart";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChartConfig } from "@/components/ui/chart";
import { useGetMetrics } from "@/hooks/queries/useMetrics";
import MetricStats from "./components/MetricStats";
import { StatusChart } from "./components/MetricCharts";

const BYTES_PER_KB = 1024;
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

  const maxNetworkBytes = Math.max(
    0,
    ...containers.flatMap((item) => [item.rx_bytes, item.tx_bytes]),
  );
  const isNetworkInMb = maxNetworkBytes >= BYTES_PER_MB;
  const networkDivisor = isNetworkInMb ? BYTES_PER_MB : BYTES_PER_KB;
  const networkUnit = isNetworkInMb ? "MB" : "KB";

  const networkConfig = {
    rx: { label: `In (${networkUnit})`, color: "var(--chart-4)" },
    tx: { label: `Out (${networkUnit})`, color: "var(--chart-5)" },
  } satisfies ChartConfig;

  const networkRows = containers.map((item) => ({
    name: item.service_name,
    rx: Number((item.rx_bytes / networkDivisor).toFixed(2)),
    tx: Number((item.tx_bytes / networkDivisor).toFixed(2)),
  }));

  function handleServiceChange(id: string | null) {
    setServiceId(id);
  }

  function handleRefresh() {
    refetch();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end flex-row gap-2">
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

      {isLoading || !data ? (
        <MetricsSkeleton />
      ) : (
        <>
          <MetricStats stats={data.deployments} />

          <StatusChart stats={data.deployments} />

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
                description={`Total traffic since the container started, in ${networkUnit}`}
                config={networkConfig}
                data={networkRows}
                xKey="name"
                dataKeys={["rx", "tx"]}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
