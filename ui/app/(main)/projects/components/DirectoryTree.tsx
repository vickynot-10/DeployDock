"use client";
import { useMemo, useState } from "react";
import { ChevronRight, ChevronsUpDown, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type TreeNodeData = {
  name: string;
  path: string;
  children: TreeNodeData[];
};

type DirectoryTreeProps = {
  dirs: string[];
  packageDirs: string[];
  value: string;
  onChange: (path: string) => void;
  loading?: boolean;
  error?: string;
};

type TreeRowProps = {
  label: string;
  path: string;
  depth: number;
  hasChildren: boolean;
  isOpen: boolean;
  isSelected: boolean;
  hasPackage: boolean;
  onSelect: (path: string) => void;
  onToggle: (path: string) => void;
};

function buildTree(dirs: string[]): TreeNodeData[] {
  const roots: TreeNodeData[] = [];
  const nodeMap = new Map<string, TreeNodeData>();

  for (const dir of [...dirs].sort()) {
    let currentPath = "";
    let siblings = roots;

    for (const part of dir.split("/")) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      let node = nodeMap.get(currentPath);

      if (!node) {
        node = { name: part, path: currentPath, children: [] };
        nodeMap.set(currentPath, node);
        siblings.push(node);
      }

      siblings = node.children;
    }
  }

  return roots;
}

function TreeRow({
  label,
  path,
  depth,
  hasChildren,
  isOpen,
  isSelected,
  hasPackage,
  onSelect,
  onToggle,
}: TreeRowProps) {
  const Icon = isOpen ? FolderOpen : Folder;

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    onToggle(path);
  }

  return (
    <div
      role="treeitem"
      aria-selected={isSelected}
      aria-expanded={hasChildren ? isOpen : undefined}
      onClick={() => onSelect(path)}
      style={{ paddingLeft: depth * 16 + 4 }}
      className={cn(
        "flex cursor-pointer items-center gap-1.5 rounded-sm py-1.5 pr-2 text-sm",
        isSelected ? "bg-accent font-medium" : "hover:bg-accent/50",
      )}
    >
      {hasChildren ? (
        <button
          type="button"
          onClick={handleToggle}
          className="flex size-5 shrink-0 items-center justify-center rounded-sm hover:bg-accent"
        >
          <ChevronRight
            className={cn(
              "size-4 text-muted-foreground transition-transform",
              isOpen && "rotate-90",
            )}
          />
        </button>
      ) : (
        <span className="size-5 shrink-0" />
      )}
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{label}</span>
      {hasPackage && (
        <Badge variant="secondary" className="ml-auto text-xs">
          package.json
        </Badge>
      )}
    </div>
  );
}

type TreeBranchProps = {
  nodes: TreeNodeData[];
  depth: number;
  expanded: Set<string>;
  value: string;
  packageDirs: string[];
  onSelect: (path: string) => void;
  onToggle: (path: string) => void;
};

function TreeBranch({
  nodes,
  depth,
  expanded,
  value,
  packageDirs,
  onSelect,
  onToggle,
}: TreeBranchProps) {
  return (
    <>
      {nodes.map((node) => {
        const isOpen = expanded.has(node.path);
        return (
          <div key={node.path}>
            <TreeRow
              label={node.name}
              path={node.path}
              depth={depth}
              hasChildren={node.children.length > 0}
              isOpen={isOpen}
              isSelected={value === node.path}
              hasPackage={packageDirs.includes(node.path)}
              onSelect={onSelect}
              onToggle={onToggle}
            />
            {isOpen && (
              <TreeBranch
                nodes={node.children}
                depth={depth + 1}
                expanded={expanded}
                value={value}
                packageDirs={packageDirs}
                onSelect={onSelect}
                onToggle={onToggle}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

export function DirectoryTree({
  dirs,
  packageDirs,
  value,
  onChange,
  loading,
  error,
}: DirectoryTreeProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const tree = useMemo(() => buildTree(dirs), [dirs]);

  const trimmedQuery = query.trim().toLowerCase();
  const matches = useMemo(
    () =>
      trimmedQuery
        ? dirs.filter((d) => d.toLowerCase().includes(trimmedQuery))
        : [],
    [dirs, trimmedQuery],
  );

  function handleToggle(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function handleSelect(path: string) {
    onChange(path);
    setOpen(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setQuery("");
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        disabled={loading}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-between font-normal",
          error && "border-destructive",
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Folder className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">
            {loading
              ? "Loading folders..."
              : value === "/"
                ? "/ (repo root)"
                : value}
          </span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-[var(--anchor-width)] p-0">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search folders..."
          autoFocus
        />

        <div role="tree" className="max-h-64 overflow-auto">
          {trimmedQuery ? (
            matches.length === 0 ? (
              <p className="p-3 text-center text-sm text-muted-foreground">
                No folder found.
              </p>
            ) : (
              matches.map((path) => (
                <TreeRow
                  key={path}
                  label={path}
                  path={path}
                  depth={0}
                  hasChildren={false}
                  isOpen={false}
                  isSelected={value === path}
                  hasPackage={packageDirs.includes(path)}
                  onSelect={handleSelect}
                  onToggle={handleToggle}
                />
              ))
            )
          ) : (
            <>
              <TreeRow
                label="/ (repo root)"
                path="/"
                depth={0}
                hasChildren={false}
                isOpen={false}
                isSelected={value === "/"}
                hasPackage={packageDirs.includes("/")}
                onSelect={handleSelect}
                onToggle={handleToggle}
              />
              <TreeBranch
                nodes={tree}
                depth={0}
                expanded={expanded}
                value={value}
                packageDirs={packageDirs}
                onSelect={handleSelect}
                onToggle={handleToggle}
              />
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
