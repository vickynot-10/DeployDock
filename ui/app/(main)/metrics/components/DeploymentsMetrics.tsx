import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MetricsResponse } from "@/hooks/queries/useMetrics";
import { cn } from "@/lib/utils";
import { formatDuration } from "./metricFormat";

type Stats = MetricsResponse["deployments"];

type StatCardProps = {
  title: string;
  value: string | number;
  className?: string;
};

function StatCard({ title, value, className }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className={cn("text-3xl", className)}>{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

export function DeploymentStats({ stats }: { stats: Stats }) {
  const avgDuration = stats.avg_duration_seconds
    ? formatDuration(Number(stats.avg_duration_seconds))
    : "-";

  const breakdown = [
    { label: "Queued", value: stats.queued },
    { label: "Cancelled", value: stats.cancelled },
    { label: "Stopped", value: stats.stopped },
    { label: "Superseded", value: stats.superseded },
    { label: "Suspended", value: stats.suspended },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total deployments" value={stats.total_deployments} />
        <StatCard title="Running" value={stats.running} />
        <StatCard
          title="Failed"
          value={stats.failed}
          className={stats.failed > 0 ? "text-destructive" : undefined}
        />
        <StatCard title="Avg build time" value={avgDuration} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Other statuses</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {breakdown.map((item) => (
            <Badge key={item.label} variant="secondary" className="gap-1">
              {item.label}
              <span className="font-semibold">{item.value}</span>
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
