"use client";
import { DEPLOY_TYPE } from "@/constants";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  GitBranch,
  ArrowRight,
  FileCode2,
  Server,
  Container,
  Trash2,
  PauseCircle,
  PlayCircle,
  X,
  Rocket,
  Edit2,
  History,
} from "lucide-react";
import { useMemo, useState } from "react";

import { formatRelative } from "@/lib/date";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetProjectServices } from "@/hooks/queries/useProjects";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AppIconButton from "@/components/common/AppIconButton";
import ServicesSuspendDeleteDialog, {
  type ServiceActionType,
} from "./ServicesDialog";
import {
  useDeployService,
  useServicesBulkAction,
} from "@/hooks/queries/useServices";

import AppIcon from "@/components/common/AppIcons";
import { ProjectServicesSkeleton } from "@/components/common/AppLoaders";
import { useBreadcrumbItems } from "@/contexts/breadcrumb-provider";
import {
  SearchInput,
  ServiceNameCell,
  TableChipFilters,
} from "@/components/common/AppTable";

type Props = {
  id: string;
};

type Service = {
  id: string;
  service_name: string;
  deploy_type: number;
  type: "static" | "web";
  host?: string;
  updated_on: string;
  enabled: boolean;
};

type FilterKey = "github" | "docker" | "static" | "web" | "suspended";

const FILTERS: { key: FilterKey; label: string; icon?: typeof GitBranch }[] = [
  { key: "github", label: "GitHub", icon: GitBranch },
  { key: "docker", label: "Docker", icon: Container },
  { key: "static", label: "Static", icon: FileCode2 },
  { key: "web", label: "Web", icon: Server },
  { key: "suspended", label: "Suspended", icon: PauseCircle },
];

const matchesFilter = (s: Service, key: FilterKey) => {
  switch (key) {
    case "github":
      return s.deploy_type !== DEPLOY_TYPE.DOCKER;
    case "docker":
      return s.deploy_type === DEPLOY_TYPE.DOCKER;
    case "static":
      return s.type === "static";
    case "web":
      return s.type === "web";
    case "suspended":
      return !s.enabled;
  }
};

const serviceTypes = [
  {
    key: "static",
    title: "Static Sites",
    description:
      "Ship pre-built pages straight from the edge. Perfect for landing pages, portfolios, docs, and anything that doesn't need a server.",
    cta: "Create Static Site",
    icon: FileCode2,
    href: (id: string) => `/projects/${id}/new/static`,
  },
  {
    key: "web",
    title: "Web Services",
    description:
      "Run long-lived server apps with your own runtime. Great for APIs, full-stack apps, background workers, and backends for mobile apps.",
    cta: "Create Web Service",
    icon: Server,
    href: (id: string) => `/projects/${id}/new/web`,
  },
] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 24 },
  },
} as const;

export default function ProjectServices({ id }: Props) {
  const { data, isLoading } = useGetProjectServices(id);
  const project_data = data?.data ?? null;
  const services = (project_data?.services ?? []) as Service[];

  const { mutate: ResumeMutate } = useServicesBulkAction();
  useBreadcrumbItems([{ label: "Services", href: "/services" }]);
  const { mutate, isPending, variables: deployingId } = useDeployService();

  const [dialog, setDialog] = useState<{
    type: ServiceActionType;
    ids: string[];
  } | null>(null);

  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<FilterKey[]>([]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      if (q && !s.service_name.toLowerCase().includes(q)) return false;
      const groups: FilterKey[][] = [
        ["github", "docker"],
        ["static", "web"],
        ["suspended"],
      ];
      return groups.every((group) => {
        const on = group.filter((k) => activeFilters.includes(k));
        return on.length === 0 || on.some((k) => matchesFilter(s, k));
      });
    });
  }, [services, search, activeFilters]);

  const filteredIds = filtered.map((s) => s.id);
  const selectedVisible = selected.filter((sid) => filteredIds.includes(sid));
  const selectedServices = filtered.filter((s) =>
    selectedVisible.includes(s.id),
  );

  const suspendIds = selectedServices
    .filter((s) => s.enabled === true)
    .map((s) => s.id);
  const allChecked =
    filtered.length > 0 && selectedVisible.length === filtered.length;
  const someChecked = selectedVisible.length > 0 && !allChecked;

  const toggleAll = () =>
    setSelected((prev) =>
      allChecked
        ? prev.filter((sid) => !filteredIds.includes(sid))
        : Array.from(new Set([...prev, ...filteredIds])),
    );

  const toggleOne = (sid: string) =>
    setSelected((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid],
    );

  const toggleFilter = (key: FilterKey) =>
    setActiveFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );

  if (isLoading) return <ProjectServicesSkeleton />;
  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Services</h2>
          <p className="text-sm text-muted-foreground">
            {services.length === 0
              ? "No services yet. Create one to get started."
              : `${services.length} service${services.length > 1 ? "s" : ""}`}
          </p>
        </div>

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2"
        >
          {serviceTypes.map(
            ({ key, title, description, cta, icon: Icon, href }) => (
              <motion.div
                key={key}
                variants={item}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card className="group h-full transition-colors hover:border-primary/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Icon className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
                      {title}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent />

                  <CardFooter>
                    <Button variant="link" className="h-auto gap-1 p-0">
                      <Link
                        href={href(id)}
                        className="flex flex-row items-center gap-2"
                      >
                        {cta}
                        <ArrowRight className="transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ),
          )}
        </motion.div>

        {services.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1">
                  {FILTERS.map(({ key, label, icon: Icon }) => {
                    const active = activeFilters.includes(key);
                    return (
                      <TableChipFilters
                        key={key}
                        label={label}
                        active={active}
                        Icon={Icon}
                        toggleFilter={() => toggleFilter(key)}
                      />
                    );
                  })}
                </div>

                {activeFilters.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-xs"
                    onClick={() => setActiveFilters([])}
                  >
                    <X className="size-3" />
                    Clear
                  </Button>
                )}
              </div>
              <AnimatePresence initial={false}>
                {selectedVisible.length > 0 && (
                  <motion.div
                    key="bulk"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/50 px-4 py-2">
                      <span className="text-sm">
                        {selectedVisible.length} selected
                      </span>
                      <div className="flex items-center gap-2">
                        {suspendIds.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                            onClick={() =>
                              setDialog({ type: "suspend", ids: suspendIds })
                            }
                          >
                            <PauseCircle className="size-4" /> Suspend (
                            {suspendIds.length})
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          className="gap-1.5"
                          onClick={() =>
                            setDialog({ type: "delete", ids: selectedVisible })
                          }
                        >
                          <Trash2 className="size-4" /> Delete
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <SearchInput
              search={search}
              setSearch={setSearch}
              placeholder="Search Services"
            />

            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allChecked}
                      indeterminate={someChecked}
                      onCheckedChange={toggleAll}
                      aria-label={allChecked ? "Deselect all" : "Select all"}
                    />
                  </TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider">
                    Service Name
                  </TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider">
                    Type
                  </TableHead>
                  <TableHead className="font-mono text-xs uppercase tracking-wider">
                    Updated
                  </TableHead>
                  <TableHead className="w-48" />
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence initial={false}>
                  {filtered.map((service) => {
                    const isSelected = selected.includes(service.id);
                    return (
                      <motion.tr
                        key={service.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        data-state={isSelected ? "selected" : undefined}
                        className={cn(
                          "h-14 border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
                          service.enabled && "opacity-70",
                        )}
                      >
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleOne(service.id)}
                            aria-label={`Select ${service.service_name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <a
                            href={
                              service.host
                                ? service.host
                                : `/services/${service.type}/${service.id}/deploys`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className={cn(
                              "inline-flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline",
                              !service.enabled &&
                                "pointer-events-none opacity-50",
                            )}
                          >
                            <ServiceNameCell
                              deploy_type={service.deploy_type}
                              service_name={service.service_name}
                              enabled={service.enabled}
                            />
                          </a>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {service.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatRelative(service.updated_on)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <AppIconButton
                              icon={<Rocket className="size-4 " />}
                              type="button"
                              tooltip="Deploy"
                              disabled={
                                !service.enabled ||
                                (isPending && deployingId === service.id)
                              }
                              onClick={() => mutate(service.id)}
                            />

                            <AppIconButton
                              icon={<Edit2 className="size-4 " />}
                              type="button"
                              tooltip="Edit Service"
                              href={`/projects/${id}/edit/${service.id}`}
                            />

                            <AppIconButton
                              icon={<History className="size-4 " />}
                              type="button"
                              tooltip="View Deployments"
                              href={`/services/${service.type}/${service.id}/deploys`}
                            />

                            {!service.enabled ? (
                              <AppIconButton
                                icon={
                                  <PlayCircle className="size-4 text-green-600" />
                                }
                                type="button"
                                tooltip="Resume"
                                onClick={() =>
                                  ResumeMutate({
                                    action: "resume",
                                    ids: [service.id],
                                    project_id: id,
                                  })
                                }
                              />
                            ) : (
                              <AppIconButton
                                icon={
                                  <PauseCircle className="size-4 text-amber-600" />
                                }
                                type="button"
                                tooltip="Suspend"
                                onClick={() =>
                                  setDialog({
                                    type: "suspend",
                                    ids: [service.id],
                                  })
                                }
                              />
                            )}
                            <AppIconButton
                              icon={
                                <Trash2 className="size-4 text-destructive" />
                              }
                              type="button"
                              tooltip="Delete"
                              onClick={() =>
                                setDialog({ type: "delete", ids: [service.id] })
                              }
                            />
                          </div>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>

                {filtered.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-sm text-muted-foreground"
                    >
                      No services match your search or filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ServicesSuspendDeleteDialog
        open={dialog !== null}
        onOpenChange={(o) => !o && setDialog(null)}
        ids={dialog?.ids ?? []}
        type={dialog?.type ?? "suspend"}
        onSuccess={() => setSelected([])}
        project_id={id}
      />
    </>
  );
}
