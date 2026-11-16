import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
const DUMMY = [1, 2, 3, 4, 5, 6, 7, 8];

export function BarChartLoader() {
  return (
    <div className="flex h-[180px] items-end gap-2 px-2">
      {DUMMY.map((el) => (
        <Skeleton
          key={el}
          className="flex-1 rounded-md"
          style={{ height: `${30 + ((el * 37) % 70)}%` }}
        />
      ))}
    </div>
  );
}

export function LineChartLoader() {
  return (
    <div className="relative h-[180px] w-full overflow-hidden">
      <svg
        viewBox="0 0 400 140"
        className="absolute inset-0 h-full w-full animate-pulse"
        preserveAspectRatio="none"
      >
        <polyline
          points="0,110 40,90 80,100 120,60 160,80 200,40 240,70 280,30 320,55 360,20 400,45"
          fill="none"
          stroke="var(--muted-foreground)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.4"
        />
      </svg>

      <div className="absolute bottom-0 flex w-full items-end justify-between px-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-8 rounded" />
        ))}
      </div>
    </div>
  );
}

export function StatsCardLoader() {
  return (
    <Card className="ring-foreground/10 !bg-transparent border-t border gap-6 overflow-hidden rounded-xl shadow-xs ring-1 p-0">
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-y-0 divide-border sm:divide-x lg:divide-x px-0">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 flex items-start justify-between">
            <div className="flex flex-col gap-4 w-full">
              <Skeleton className="h-4 w-28" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-7 w-16" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-12 rounded-4xl" />
                </div>
              </div>
            </div>
            <Skeleton className="h-11 w-11 rounded-full shrink-0" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function UpcomingRemindersLoader() {
  return (
    <Card className="  bg-transparent h-[400px] flex flex-col">
      <CardHeader>
        <CardTitle>Upcoming Reminders</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-center">
        <div className="flex gap-4">
          <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        <Skeleton className="mt-4 h-10 w-full rounded-md" />

        <div className="mt-3 rounded-md border border-border/60 px-3 py-2 flex flex-col gap-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>

        <div className="mt-4 flex gap-2">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>

        <div className="mt-6 flex justify-center gap-2">
          <Skeleton className="h-2 w-6 rounded-full" />
          <Skeleton className="h-2 w-2 rounded-full" />
          <Skeleton className="h-2 w-2 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function StatusPieChartLoader() {
  return (
    <div className="h-[400px] flex flex-col rounded-lg border border-border p-4">
      <Skeleton className="h-4 w-32 mb-4" />
      <div className="flex-1 space-y-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-24 shrink-0" />
            <div className="flex-1 flex items-center gap-3">
              <Skeleton className="h-8 flex-1 rounded-md" />
              <Skeleton className="h-4 w-6" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
