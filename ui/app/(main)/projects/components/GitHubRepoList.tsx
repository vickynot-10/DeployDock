"use client";
import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { useGetUserRepos } from "@/hooks/queries/useGithub";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

type Props = {
  value: number | null;
  onChange: (id: number, repo: any) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function RepoMeta({ repo, withLink }: { repo: any; withLink?: boolean }) {
  return (
    <span className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
      <span>{repo.private ? "Private" : "Public"}</span>
      <span>•</span>
      <span>Updated {formatDate(repo.updated_at)}</span>
      {withLink && (
        <>
          <span>•</span>
          <a
            href={repo.url}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="underline hover:text-foreground"
          >
            View on GitHub
          </a>
        </>
      )}
    </span>
  );
}

export default function RepoCombobox({
  value,
  onChange,
  disabled,
  placeholder = "Select a repository",
  error,
}: Props) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useGetUserRepos();

  const repos: any[] = data?.data ?? [];
  const selected = repos.find((r) => r.id === value);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          disabled={disabled || isLoading}
          aria-invalid={!!error}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-auto w-full justify-between py-2 text-left font-normal",
            error && "border-destructive",
          )}
        >
          {selected ? (
            <span className="flex flex-col items-start gap-0.5">
              <span className="font-medium">{selected.full_name}</span>
              <RepoMeta repo={selected} />
            </span>
          ) : (
            <span className="text-muted-foreground">
              {isLoading ? "Loading repositories..." : placeholder}
            </span>
          )}
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </PopoverTrigger>

        <PopoverContent align="start" className="w-[var(--anchor-width)] p-0">
          <Command>
            <CommandInput placeholder="Search repositories..." />
            <CommandList className="max-h-72">
              <CommandEmpty>No repository found.</CommandEmpty>
              <CommandGroup>
                {repos.map((r) => (
                  <CommandItem
                    key={r.id}
                    value={r.full_name} // used only for search filtering
                    keywords={[r.private ? "private" : "public"]}
                    onSelect={() => {
                      onChange(r.id, r); // store the id
                      setOpen(false);
                    }}
                    className="py-2"
                  >
                    <span className="flex flex-1 flex-col items-start gap-0.5">
                      <span className="font-medium">{r.full_name}</span>
                      <RepoMeta repo={r} withLink />
                    </span>
                    <Check
                      className={cn(
                        "size-4",
                        value === r.id ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </>
  );
}
