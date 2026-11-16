"use client";

import { Plus } from "lucide-react";
import { useGetProjects } from "@/hooks/queries/useProjects";
import CreateOrEditProjects from "./CreateProject";
import ProjectCard, { Project } from "./ProjectCard";
import { ProjectsSkeleton } from "@/components/common/AppLoaders";

type CreateTriggerProps = {
  onClick: () => void;
};

function CreateCardTrigger({ onClick }: CreateTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-34 items-center justify-center gap-2 rounded-md border border-dashed text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
    >
      <Plus className="size-4" />
      Create new project
    </button>
  );
}

export default function Projects() {
  const { data, isLoading } = useGetProjects();

  if (isLoading) return <ProjectsSkeleton />;
  const projects: Project[] = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-end">
        <CreateOrEditProjects />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} />
        ))}
        <CreateOrEditProjects
          trigger={(props) => <CreateCardTrigger {...props} />}
        />
      </div>
    </div>
  );
}
