"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Activity, CircleAlert, Rocket, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { MetricsResponse } from "@/hooks/queries/useMetrics";
import { formatDuration } from "./metricFormat";

type Stats = MetricsResponse["deployments"];

export default function MetricStats({ stats }: { stats: Stats }) {
  const failed = stats.failed ?? 0;

  const STATS = [
    {
      title: "Total Deployments",
      value: stats.total_deployments ?? 0,
      note: "All time",
      icon: Rocket,
      iconClass: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
      valueClass: "",
    },
    {
      title: "Running",
      value: stats.running ?? 0,
      note: "Live right now",
      icon: Activity,
      iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      valueClass: "",
    },
    {
      title: "Failed",
      value: failed,
      note: failed > 0 ? "Needs attention" : "No failures",
      icon: CircleAlert,
      iconClass: "bg-red-500/10 text-red-600 dark:text-red-400",
      valueClass: failed > 0 ? "text-destructive" : "",
    },
    {
      title: "Avg Build Time",
      value: stats.avg_duration_seconds
        ? formatDuration(Number(stats.avg_duration_seconds))
        : "-",
      note: "Per finished deployment",
      icon: Timer,
      iconClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      valueClass: "",
    },
  ];

  return (
    <Card className="p-0 shadow-xs">
      <CardContent className="items-center w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 px-0">
        {STATS.map((item) => {
          return (
            <div
              className="w-full border-border border-b last:border-b-0 md:border-e md:even:border-e-0 md:nth-[n+3]:border-b-0 lg:border-b-0 lg:even:border-e lg:last:border-e-0"
              key={item.title}
            >
              <div className="p-6 flex items-start justify-between">
                <div className="flex flex-col gap-4">
                  <p className="text-base font-medium text-card-foreground">
                    {item.title}
                  </p>
                  <div>
                    <p
                      className={cn(
                        "text-2xl font-medium text-card-foreground",
                        item.valueClass,
                      )}
                    >
                      {item.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.note}</p>
                  </div>
                </div>
                <div className={cn("p-3 rounded-full", item.iconClass)}>
                  <item.icon size={16} />
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
