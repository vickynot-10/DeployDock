"use client";

import { Label, Pie, PieChart } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { MetricsResponse } from "@/hooks/queries/useMetrics";

type Stats = MetricsResponse["deployments"];

const chartConfig = {
  count: { label: "Deployments" },
  Running: { label: "Running", color: "var(--color-emerald-500)" },
  Failed: { label: "Failed", color: "var(--color-red-500)" },
  Queued: { label: "Queued", color: "var(--color-sky-400)" },
  Building: { label: "Building", color: "var(--color-blue-500)" },
  Cancelled: { label: "Cancelled", color: "var(--color-orange-400)" },
  Stopped: { label: "Stopped", color: "var(--color-zinc-400)" },
  Superseded: { label: "Superseded", color: "var(--color-violet-400)" },
  Suspended: { label: "Suspended", color: "var(--color-amber-400)" },
} satisfies ChartConfig;

export function StatusChart({ stats }: { stats: Stats }) {
  const total = stats.total_deployments ?? 0;

  const statusRows = [
    {
      id: 1,
      status: "Running",
      count: stats.running ?? 0,
      fill: "var(--color-emerald-500)",
      barClass: "bg-emerald-500",
      badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    },
    {
      id: 2,
      status: "Failed",
      count: stats.failed ?? 0,
      fill: "var(--color-red-500)",
      barClass: "bg-red-500",
      badgeClass: "bg-red-500/10 text-red-600 dark:text-red-400",
    },
    {
      id: 3,
      status: "Queued",
      count: stats.queued ?? 0,
      fill: "var(--color-sky-400)",
      barClass: "bg-sky-400",
      badgeClass: "bg-sky-400/10 text-sky-600 dark:text-sky-400",
    },
    {
      id: 4,
      status: "Cancelled",
      count: stats.cancelled ?? 0,
      fill: "var(--color-orange-400)",
      barClass: "bg-orange-400",
      badgeClass: "bg-orange-400/10 text-orange-600 dark:text-orange-400",
    },
    {
      id: 5,
      status: "Stopped",
      count: stats.stopped ?? 0,
      fill: "var(--color-zinc-400)",
      barClass: "bg-zinc-400",
      badgeClass: "bg-zinc-400/10 text-muted-foreground",
    },
    {
      id: 6,
      status: "Superseded",
      count: stats.superseded ?? 0,
      fill: "var(--color-violet-400)",
      barClass: "bg-violet-400",
      badgeClass: "bg-violet-400/10 text-violet-600 dark:text-violet-400",
    },
    {
      id: 7,
      status: "Suspended",
      count: stats.suspended ?? 0,
      fill: "var(--color-amber-400)",
      barClass: "bg-amber-400",
      badgeClass: "bg-amber-400/10 text-amber-600 dark:text-amber-400",
    },
  ];

  const pieData =
    total > 0
      ? statusRows.filter((item) => item.count > 0)
      : [{ status: "None", count: 1, fill: "var(--muted)" }];

  function getPercent(count: number) {
    if (total === 0) return "0%";
    return `${Math.round((count / total) * 100)}%`;
  }

  function renderCenterLabel({ viewBox }: { viewBox?: unknown }) {
    if (!viewBox || typeof viewBox !== "object") return null;
    if (!("cx" in viewBox) || !("cy" in viewBox)) return null;
    const cx = Number(viewBox.cx);
    const cy = Number(viewBox.cy);
    return (
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
        <tspan x={cx} y={cy - 10} className="fill-muted-foreground text-sm">
          Total
        </tspan>
        <tspan
          x={cx}
          y={cy + 15}
          className="fill-foreground text-xl font-medium"
        >
          {total}
        </tspan>
      </text>
    );
  }

  return (
    <Card className=" shadow-xs">
      <CardHeader className="px-6">
        <CardTitle>
          <h4 className="text-lg font-medium">Deployments by Status</h4>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col justify-between gap-8 flex-1 px-6">
        <ChartContainer config={chartConfig} className="aspect-square max-h-50">
          <PieChart margin={{ top: -20 }}>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={pieData}
              dataKey="count"
              nameKey="status"
              innerRadius={65}
              strokeWidth={3}
              startAngle={90}
              endAngle={-270}
            >
              <Label content={renderCenterLabel} />
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {statusRows.map((item) => (
            <div
              key={item.id}
              tabIndex={0}
              className="group flex items-center justify-between rounded-md px-1.5 py-1 outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50"
            >
              <div className="flex min-w-0 items-center gap-2">
                <div
                  className={cn(item.barClass, "w-1 h-4 shrink-0 rounded-full")}
                ></div>
                <h6 className="truncate text-sm font-normal leading-tight">
                  {item.status}
                </h6>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <h6 className="text-sm font-medium">{item.count}</h6>
                <Badge
                  className={cn(
                    item.badgeClass,
                    "shadow-none opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
                  )}
                >
                  {getPercent(item.count)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
