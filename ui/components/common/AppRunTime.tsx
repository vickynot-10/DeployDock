"use client";

import {
  Hexagon,
  Code,
  Coffee,
  Gem,
  FlaskConical,
  Cog,
  type LucideIcon,
} from "lucide-react";
import { RUNTIMES } from "@/constants";
import { Badge } from "@/components/ui/badge";

const RUNTIME: Record<number, { label: string; icon: LucideIcon }> = {
  [RUNTIMES.NODE]: { label: "Node.js", icon: Hexagon },
  [RUNTIMES.PYTHON]: { label: "Python", icon: Code },
  [RUNTIMES.JAVA]: { label: "Java", icon: Coffee },
  [RUNTIMES.RUBY]: { label: "Ruby", icon: Gem },
  [RUNTIMES.ELXIR]: { label: "Elixir", icon: FlaskConical },
  [RUNTIMES.RUST]: { label: "Rust", icon: Cog },
};

export function AppRunTimeBadge({ type }: { type: number }) {
  const runtime = RUNTIME[type];
  if (!runtime) return null;

  const Icon = runtime.icon;

  return (
    <Badge variant="secondary" className="gap-1.5">
      <Icon className="size-3.5" />
      {runtime.label}
    </Badge>
  );
}
