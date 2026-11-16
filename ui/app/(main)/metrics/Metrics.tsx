"use client";

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { ServiceSelect } from "@/components/common/ServiceSelect";
import { ContainerCards } from "./components/MetricContainer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ChartConfig } from "@/components/ui/chart";
import { useGetMetrics } from "@/hooks/queries/useMetrics";
import MetricStats from "./components/MetricStats";
import {
  DeployMentsDayChart,
  ResourceChart,
  StatusChart,
} from "./components/MetricCharts";

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

  const deployment_dates = data?.deploymentsOverDays ?? [];

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

          <DeployMentsDayChart deployment_dates={deployment_dates} />

          <div className=" grid grid-cols-1 md:grid-cols-2 gap-3 ">
            <ContainerCards containers={containers} />

            <StatusChart stats={data.deployments} />
          </div>

          <ResourceChart
            cpuRows={cpuRows}
            memoryRows={memoryRows}
            networkRows={networkRows}
            cpuConfig={cpuConfig}
            memoryConfig={memoryConfig}
            networkConfig={networkConfig}
            networkUnit={networkUnit}
          />
        </>
      )}
    </div>
  );
}
