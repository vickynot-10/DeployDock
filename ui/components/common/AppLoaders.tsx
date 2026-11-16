import { Skeleton } from "@/components/ui/skeleton";
import {
  TableHeader,
  Table,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "../ui/table";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
export function ViewServiceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <Skeleton className="size-5 rounded-full" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="flex items-center gap-1.5">
                <Skeleton className="size-4" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="size-7" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      <div className="space-y-2">
        <Skeleton className="h-6 w-20" />
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {Array.from({ length: 6 }).map((_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-3 w-16" />
                </TableHead>
              ))}
              <TableHead className="w-10 pe-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="h-14 hover:bg-transparent">
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-12" />
                </TableCell>
                <TableCell className="w-10 pe-10">
                  <div className="flex gap-1">
                    <Skeleton className="size-8" />
                    <Skeleton className="size-8" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function ViewDeploylogsSkeleton() {
  const widths = ["w-64", "w-48", "w-72", "w-56", "w-40", "w-60"];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-5 w-14 rounded-full" />
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-lg border p-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <Skeleton className="size-5 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-4" />
            <Skeleton className="h-4 w-12" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="size-7" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="overflow-hidden rounded-lg border bg-zinc-950 shadow-sm">
          <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-4 py-2">
            <div className="flex gap-1.5">
              <Skeleton className="size-3 rounded-full bg-zinc-800" />
              <Skeleton className="size-3 rounded-full bg-zinc-800" />
              <Skeleton className="size-3 rounded-full bg-zinc-800" />
            </div>
            <Skeleton className="ml-2 h-3 w-28 bg-zinc-800" />
          </div>

          <div className="h-[28rem] space-y-2 overflow-hidden p-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-4 w-16 shrink-0 bg-zinc-800" />
                <Skeleton
                  className={`h-4 bg-zinc-800 ${widths[i % widths.length]}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProjectServicesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="h-full">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="size-5" />
                <Skeleton className="h-5 w-32" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardHeader>
            <CardContent />
            <CardFooter>
              <Skeleton className="h-4 w-36" />
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-10 w-[26rem] max-w-full rounded-full" />
        </div>

        <Skeleton className="h-9 w-full" />

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10">
                <Skeleton className="size-4" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-3 w-24" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-3 w-12" />
              </TableHead>
              <TableHead>
                <Skeleton className="h-3 w-16" />
              </TableHead>
              <TableHead className="w-48" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="h-14 hover:bg-transparent">
                <TableCell>
                  <Skeleton className="size-4" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-5 rounded-full" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-14 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Skeleton className="size-8" />
                    <Skeleton className="size-8" />
                    <Skeleton className="size-8" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function ProjectsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-end">
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex min-h-34 flex-col justify-between gap-4 rounded-md border p-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="size-6" />
              </div>
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
        <Skeleton className="min-h-34 rounded-md" />
      </div>
    </div>
  );
}

export function EditServiceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-6 w-44" />
          </div>
        </div>
        <Skeleton className="h-7 w-56 rounded-md" />
      </div>

      <div className="space-y-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <Skeleton className="h-9 w-28" />
      </div>
    </div>
  );
}
