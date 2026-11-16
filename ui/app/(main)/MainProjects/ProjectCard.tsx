"use client";

import { Settings } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/date";
import CreateOrEditProjects from "./CreateProject";
import Link from "next/link";

export type Project = {
  id: string;
  project_name: string;
  environment: string;
  updated_on: string;
};

type ProjectCardProps = {
  project: Project;
  index: number;
};

type SettingsTriggerProps = {
  onClick: () => void;
};

function SettingsTrigger({ onClick }: SettingsTriggerProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Project settings"
      onClick={onClick}
    >
      <Settings className="size-4" />
    </Button>
  );
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  const { datePart, timePart } = formatDateTime(project.updated_on);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, delay: index * 0.06 },
      }}
      className="relative flex min-h-34 flex-col justify-between gap-4 rounded-md border bg-card p-5 transition-colors hover:border-foreground"
    >
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/projects/${project.id}`}
          className="min-w-0 flex-1 after:absolute after:inset-0 after:content-['']"
        >
          <h3 className="truncate text-lg font-semibold">
            {project.project_name}
          </h3>
        </Link>
        <div className="relative z-10">
          <CreateOrEditProjects
            data={project}
            trigger={(props) => <SettingsTrigger {...props} />}
          />
        </div>
      </div>

      <div className="space-y-2">
        <span className="inline-block rounded-sm bg-muted px-3 py-1 text-sm">
          {project.environment}
        </span>
        <p className="text-sm text-muted-foreground">
          Last updated {datePart} · {timePart}
        </p>
      </div>
    </motion.div>
  );
}
