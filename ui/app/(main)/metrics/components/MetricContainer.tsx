import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import type { ServiceMetric } from "@/hooks/queries/useMetrics";
import { formatBytes, formatUptime } from "./metricFormat";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

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

function ContainerContent({ item }: { item: ServiceMetric }) {
  const memoryPercent = item.memory_limit
    ? (item.memory_bytes / item.memory_limit) * 100
    : 0;

  return (
    <div className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="truncate text-base">
          {item.service_name}
        </CardTitle>
        <Badge variant="secondary">{formatUptime(item.started_at)}</Badge>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col justify-evenly text-sm">
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
    </div>
  );
}

export function ContainerCards({
  containers,
}: {
  containers: ServiceMetric[];
}) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;

    function update() {
      if (!api) return;
      setCount(api.scrollSnapList().length);
      setCurrent(api.selectedScrollSnap());
    }

    update();
    api.on("select", update);
    api.on("reInit", update);

    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);

  if (containers.length === 0) {
    return (
      <Card className="flex h-full items-center justify-center">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No running containers
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <Carousel
        setApi={setApi}
        opts={{ align: "start" }}
        className="min-h-0 flex-1 [&>div]:h-full"
      >
        <CarouselContent className="ml-0 h-full">
          {containers.map((item) => (
            <CarouselItem
              key={item.service_id}
              className="h-full basis-full pl-0"
            >
              <ContainerContent item={item} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {count > 1 && (
        <div className="flex items-center justify-center gap-2 pb-4">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to container ${index + 1}`}
              aria-current={index === current}
              onClick={() => api?.scrollTo(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                index === current
                  ? "w-6 bg-primary"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60",
              )}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
