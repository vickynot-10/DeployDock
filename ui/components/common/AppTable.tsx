"use client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "../ui/badge";
import { DEPLOY_TRIGGER, DEPLOY_TYPE, DEPLOYMENT_STATUS } from "@/constants";
import { useRollbackDeploy } from "@/hooks/queries/useDeploy";
import AppIconButton from "./AppIconButton";
import { RotateCcwIcon, Search, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/date";
import { Skeleton } from "../ui/skeleton";
import { Input } from "../ui/input";
import { AnimatePresence, motion } from "motion/react";
import AppIcon from "./AppIcons";

export const TRIGGER_LABEL: Record<number, string> = {
  [DEPLOY_TRIGGER.AUTO]: "Auto",
  [DEPLOY_TRIGGER.MANUAL]: "Manual",
  [DEPLOY_TRIGGER.ROLLBACK]: "Rollback",
};

export const STATUS_META: Record<number, { label: string; className: string }> =
  {
    [DEPLOYMENT_STATUS.QUEUED]: {
      label: "Queued",
      className: "text-muted-foreground",
    },
    [DEPLOYMENT_STATUS.BUILDING]: {
      label: "Building",
      className: "text-blue-600",
    },
    [DEPLOYMENT_STATUS.RUNNING]: {
      label: "Running",
      className: "text-green-600",
    },
    [DEPLOYMENT_STATUS.FAILED]: {
      label: "Failed",
      className: "text-destructive",
    },
    [DEPLOYMENT_STATUS.CANCELLED]: {
      label: "Cancelled",
      className: "text-muted-foreground",
    },
    [DEPLOYMENT_STATUS.SUSPENDED]: {
      label: "Suspended",
      className: "text-amber-600",
    },
    [DEPLOYMENT_STATUS.SUPERSEDED]: {
      label: "Superseded",
      className: "text-muted-foreground",
    },
    [DEPLOYMENT_STATUS.STOPPED]: {
      label: "Stopped",
      className: "text-orange-600",
    },
  };

export function HeadCell({ children }: { children: React.ReactNode }) {
  return (
    <TableHead className="font-mono text-xs uppercase tracking-wider">
      {children}
    </TableHead>
  );
}

export function AppTableHeader({
  items,
}: {
  items: { label: string | null; id: number }[];
}) {
  return (
    <TableHeader>
      <TableRow className="hover:bg-transparent">
        {items.map((el) => {
          return <HeadCell key={el.id}>{el.label}</HeadCell>;
        })}
      </TableRow>
    </TableHeader>
  );
}

export function TriggerCell({ trigger }: { trigger: number }) {
  return (
    <TableCell>
      <Badge variant="secondary">{TRIGGER_LABEL[trigger] ?? "-"}</Badge>
    </TableCell>
  );
}

export function LogsCell({
  deployment_id,
  type,
  service_id,
}: {
  deployment_id: string;
  type: string;
  service_id: string;
}) {
  const { mutate, isPending, variables } = useRollbackDeploy();

  const isRollingBack = isPending && variables.deployment_id === deployment_id;
  return (
    <TableCell className="w-10 pe-10">
      <AppIconButton
        icon={<Terminal className="size-4" />}
        tooltip="View logs"
        href={`/services/${type}/${deployment_id}/logs`}
      />

      <AppIconButton
        icon={
          <RotateCcwIcon
            className={cn("size-4", isRollingBack && "animate-spin")}
          />
        }
        tooltip="Rollback"
        disabled={isRollingBack}
        onClick={() => mutate({ deployment_id, service_id: service_id })}
      />
    </TableCell>
  );
}

export function StatusCell({
  status,
  enabled,
}: {
  status: number;
  enabled: boolean;
}) {
  const meta = STATUS_META[status] ?? {
    label: "Unknown",
    className: "text-muted-foreground",
  };
  const isLive = enabled && status === DEPLOYMENT_STATUS.RUNNING;

  return (
    <TableCell>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={cn("capitalize", meta.className)}>
          {meta.label}
        </Badge>
        {isLive && <Badge>Live</Badge>}
      </div>
    </TableCell>
  );
}

export function EmptyRow({ text, colspan }: { text: string; colspan: number }) {
  return (
    <TableRow className="hover:bg-transparent">
      <TableCell
        colSpan={colspan}
        className="h-24 text-center text-sm text-muted-foreground"
      >
        {text ? text : "Data not found"}
      </TableCell>
    </TableRow>
  );
}

export function formatDuration(start: string | null, end: string | null) {
  if (!start || !end) return "-";
  const seconds = Math.round(
    (new Date(end).getTime() - new Date(start).getTime()) / 1000,
  );
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export function SearchInput({
  search,
  setSearch,
  placeholder,
}: {
  search: string;
  setSearch: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
      />
    </div>
  );
}
export function TableLoader() {
  return (
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
  );
}

export function TimeCells({ deployment }: { deployment: any }) {
  return (
    <>
      <TableCell className="text-muted-foreground">
        {formatRelative(deployment.started_on ?? deployment.created_on)}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatDuration(deployment.started_on, deployment.finished_on)}
      </TableCell>
    </>
  );
}

export function TableChipFilters({
  key,
  label,
  active,
  Icon,
  toggleFilter,
}: {
  key: string;
  label: string;
  active: boolean;
  Icon: any;

  toggleFilter: (value: string) => void;
}) {
  return (
    <button
      key={key}
      type="button"
      onClick={() => toggleFilter(key)}
      aria-pressed={active}
      className={cn(
        "relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <AnimatePresence initial={false}>
        {active && (
          <motion.span
            key="pill"
            className="absolute inset-0 rounded-full bg-background shadow-sm"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
          />
        )}
      </AnimatePresence>
      {Icon && <Icon className="relative size-4" />}
      <span className="relative">{label}</span>
    </button>
  );
}

export function ServiceNameCell({
  deploy_type,
  service_name,
  enabled,
}: {
  deploy_type: number;
  service_name: string;
  enabled: boolean;
}) {
  const isDocker = deploy_type === DEPLOY_TYPE.DOCKER;

  return (
    <div className="flex items-center gap-3">
      <AppIcon type={isDocker ? "docker" : "github"} />
      <span className="font-medium underline underline-offset-4">
        {service_name}
      </span>
      {!enabled && (
        <Badge variant="outline" className="text-amber-600">
          Suspended
        </Badge>
      )}
    </div>
  );
}
