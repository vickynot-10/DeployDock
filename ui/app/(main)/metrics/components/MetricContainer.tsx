import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ServiceMetric } from "@/hooks/queries/useMetrics";
import { formatBytes, formatUptime } from "./metricFormat";

function UsageBar({ percent }: { percent: number }) {
  const width = Math.min(100, Math.max(0, percent));
  return (
    <div className="h-1.5 w-full rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function ContainerCard({ item }: { item: ServiceMetric }) {
  const memoryPercent = item.memory_limit
    ? (item.memory_bytes / item.memory_limit) * 100
    : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="truncate text-base">
          {item.service_name}
        </CardTitle>
        <Badge variant="secondary">{formatUptime(item.started_at)}</Badge>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted-foreground">CPU</span>
            <span className="font-medium">{item.cpu_percent.toFixed(1)}%</span>
          </div>
          <UsageBar percent={item.cpu_percent} />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Memory</span>
            <span className="font-medium">
              {formatBytes(item.memory_bytes)} /{" "}
              {formatBytes(item.memory_limit)}
            </span>
          </div>
          <UsageBar percent={memoryPercent} />
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Network in / out</span>
          <span className="font-medium">
            {formatBytes(item.rx_bytes)} / {formatBytes(item.tx_bytes)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Restarts</span>
          <span
            className={
              item.restart_count > 0
                ? "font-medium text-destructive"
                : "font-medium"
            }
          >
            {item.restart_count}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function ContainerCards({
  containers,
}: {
  containers: ServiceMetric[];
}) {
  if (containers.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No running containers
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {containers.map((item) => (
        <ContainerCard key={item.service_id} item={item} />
      ))}
    </div>
  );
}
