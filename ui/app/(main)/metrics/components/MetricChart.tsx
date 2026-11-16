import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type ChartRow = Record<string, string | number>;

type MetricChartProps = {
  title: string;
  description: string;
  config: ChartConfig;
  data: ChartRow[];
  xKey: string;
  dataKeys: string[];
  emptyText?: string;
};

export function MetricChart({
  title,
  description,
  config,
  data,
  xKey,
  dataKeys,
  emptyText = "No running containers",
}: MetricChartProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
            {emptyText}
          </div>
        ) : (
          <ChartContainer config={config} className="h-56 w-full">
            <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey={xKey}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis tickLine={false} axisLine={false} width={44} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              {dataKeys.length > 1 && (
                <ChartLegend content={<ChartLegendContent />} />
              )}
              {dataKeys.map((key) => (
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
