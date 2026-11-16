"use client";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { DeploymentDate, MetricsResponse } from "@/hooks/queries/useMetrics";

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
const DAYS_WINDOW = 7;

const dayChartConfig = {
  count: { label: "Deployments", color: "var(--color-blue-500)" },
} satisfies ChartConfig;

type DayRow = { day: string; count: number };

function getDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function buildDayRows(items: DeploymentDate[]): DayRow[] {
  const totals = new Map<string, number>();
  for (const item of items) {
    const key = getDayKey(new Date(item.deployment_date));
    totals.set(key, (totals.get(key) ?? 0) + Number(item.count));
  }

  const today = new Date();
  const rows: DayRow[] = [];
  for (let offset = DAYS_WINDOW - 1; offset >= 0; offset--) {
    const day = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - offset,
    );
    rows.push({
      day: day.toLocaleDateString([], { day: "numeric", month: "short" }),
      count: totals.get(getDayKey(day)) ?? 0,
    });
  }
  return rows;
}

export function DeployMentsDayChart({
  deployment_dates,
}: {
  deployment_dates: DeploymentDate[];
}) {
  const [magicView, setMagicView] = useState<"bar" | "line">("bar");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const rows = buildDayRows(deployment_dates);
  const maxCount = Math.max(...rows.map((row) => row.count));
  const peakIndex =
    maxCount > 0 ? rows.findIndex((row) => row.count === maxCount) : -1;
  const activeIndex = hoverIndex ?? peakIndex;

  return (
    <Card className="shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between px-6">
        <CardTitle>
          <h4 className="text-lg font-medium">Deployments per Day</h4>
        </CardTitle>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={magicView === "bar" ? "secondary" : "ghost"}
            onClick={() => setMagicView("bar")}
          >
            Bar
          </Button>
          <Button
            size="sm"
            variant={magicView === "line" ? "secondary" : "ghost"}
            onClick={() => setMagicView("line")}
          >
            Line
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-6">
        <ChartContainer config={dayChartConfig} className="h-64 w-full">
          {magicView === "bar" ? (
            <BarChart data={rows} margin={{ top: 8, right: 8, left: 8 }}>
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                radius={8}
                maxBarSize={40}
                onMouseEnter={(_, index) => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(null)}
              >
                {rows.map((row, index) => (
                  <Cell
                    key={row.day}
                    fill="var(--color-count)"
                    fillOpacity={index === activeIndex ? 1 : 0.2}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <LineChart data={rows} margin={{ top: 8, right: 12, left: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={32}
                allowDecimals={false}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Line
                dataKey="count"
                type="monotone"
                stroke="var(--color-count)"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
type ChartRow = Record<string, string | number>;

type ResourceView = "cpu" | "memory" | "network";

type ResourceChartProps = {
  cpuRows: ChartRow[];
  memoryRows: ChartRow[];
  networkRows: ChartRow[];
  cpuConfig: ChartConfig;
  memoryConfig: ChartConfig;
  networkConfig: ChartConfig;
  networkUnit: string;
  emptyText?: string;
};

export function ResourceChart({
  cpuRows,
  memoryRows,
  networkRows,
  cpuConfig,
  memoryConfig,
  networkConfig,
  networkUnit,
  emptyText = "No running containers",
}: ResourceChartProps) {
  const [view, setView] = useState<ResourceView>("cpu");

  const views = {
    cpu: {
      label: "CPU",
      description: "Percent of one core, per service",
      config: cpuConfig,
      data: cpuRows,
      dataKeys: ["cpu"],
    },
    memory: {
      label: "Memory",
      description: "Memory in use, per service",
      config: memoryConfig,
      data: memoryRows,
      dataKeys: ["memory_mb"],
    },
    network: {
      label: "Network",
      description: `Total traffic since the container started, in ${networkUnit}`,
      config: networkConfig,
      data: networkRows,
      dataKeys: ["rx", "tx"],
    },
  } satisfies Record<
    ResourceView,
    {
      label: string;
      description: string;
      config: ChartConfig;
      data: ChartRow[];
      dataKeys: string[];
    }
  >;

  const active = views[view];

  return (
    <Card className="shadow-xs">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1.5">
          <CardTitle className="text-base">{active.label}</CardTitle>
          <CardDescription>{active.description}</CardDescription>
        </div>
        <div className="flex items-center gap-1">
          {(Object.keys(views) as ResourceView[]).map((key) => (
            <Button
              key={key}
              size="sm"
              variant={view === key ? "secondary" : "ghost"}
              onClick={() => setView(key)}
            >
              {views[key].label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {active.data.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          <ChartContainer
            key={view}
            config={active.config}
            className="h-56 w-full"
          >
            <BarChart data={active.data} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis tickLine={false} axisLine={false} width={44} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              {active.dataKeys.length > 1 && (
                <ChartLegend content={<ChartLegendContent />} />
              )}
              {active.dataKeys.map((key) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={`var(--color-${key})`}
                  radius={4}
                  maxBarSize={56}
                />
              ))}
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
