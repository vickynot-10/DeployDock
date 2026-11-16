"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDown,
  Loader2,
  Maximize2,
  Minimize2,
  Terminal,
  WrapText,
} from "lucide-react";
import { SearchInput } from "@/components/common/AppTable";
import { ServiceSelect } from "@/components/common/ServiceSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import useDebounce from "@/hooks/app/useDebounce";
import {
  LOGS_QUERY_KEY,
  useGetLogs,
  type LogLine,
} from "@/hooks/queries/useLogs";
import { cn } from "@/lib/utils";

const DEFAULT_LIMIT = 200;
const MIN_LIMIT = 10;
const MAX_LIMIT = 1000;
const BOTTOM_THRESHOLD = 40;

const SKELETON_WIDTHS = [
  "w-3/4",
  "w-1/2",
  "w-2/3",
  "w-5/6",
  "w-1/3",
  "w-3/5",
  "w-4/5",
  "w-2/5",
  "w-3/4",
  "w-1/2",
  "w-2/3",
  "w-5/6",
];

const STREAM_CLASS: Record<string, string> = {
  system: "text-sky-400",
  stdout: "text-zinc-200",
  stderr: "text-red-400",
};

function clampLimit(value: string) {
  const parsed = Number(value);
  if (!parsed) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, Math.floor(parsed)));
}

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function LogsModule() {
  const queryClient = useQueryClient();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [lineLimit, setLineLimit] = useState(String(DEFAULT_LIMIT));
  const [isWrapped, setIsWrapped] = useState(true);
  const [isFollowing, setIsFollowing] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const debounceSearch = useDebounce(search, 500);
  const debounceLimit = useDebounce(lineLimit, 500);
  const limit = clampLimit(debounceLimit);
  const terminalRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevHeightRef = useRef<number | null>(null);

  const { data, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useGetLogs({
      limit,
      search: debounceSearch,
      service_id: selectedService,
    });

  const lines: LogLine[] = data
    ? data.pages.flatMap((page) => page?.rows ?? []).reverse()
    : [];
  const showService = selectedService === null;
  const isEmpty = !isLoading && lines.length === 0;
  const emptyText = debounceSearch
    ? `No matches for "${debounceSearch}"`
    : "No logs yet";

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (prevHeightRef.current !== null) {
      el.scrollTop += el.scrollHeight - prevHeightRef.current;
      prevHeightRef.current = null;
      return;
    }
    if (isFollowing) el.scrollTop = el.scrollHeight;
  }, [data]);

  useEffect(function () {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === terminalRef.current);
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return function () {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(
    function () {
      const el = scrollRef.current;
      if (el && isFollowing) el.scrollTop = el.scrollHeight;
    },
    [isFullscreen],
  );

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }
    terminalRef.current?.requestFullscreen();
  }

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsFollowing(distance < BOTTOM_THRESHOLD);
  }

  function handleSearch(value: string) {
    setSearch(value);
    setIsFollowing(true);
  }

  function handleServiceChange(id: string | null) {
    setSelectedService(id);
    setIsFollowing(true);
  }

  function handleLimitChange(e: ChangeEvent<HTMLInputElement>) {
    setLineLimit(e.target.value.replace(/\D/g, ""));
    setIsFollowing(true);
  }

  function handleLimitBlur() {
    setLineLimit(String(clampLimit(lineLimit)));
  }

  async function loadOlder() {
    const el = scrollRef.current;
    if (!el) return;
    setIsFollowing(false);
    prevHeightRef.current = el.scrollHeight;
    const result = await fetchNextPage();
    if (result.isError) prevHeightRef.current = null;
  }

  function jumpToLatest() {
    setIsFollowing(true);
    if ((data?.pages.length ?? 0) > 1) {
      queryClient.resetQueries({ queryKey: [LOGS_QUERY_KEY] });
      return;
    }
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          search={search}
          setSearch={handleSearch}
          placeholder="Search log lines"
        />
        <ServiceSelect value={selectedService} onChange={handleServiceChange} />
        <div className="flex items-center gap-2">
          <Label htmlFor="line_limit" className="text-sm text-muted-foreground">
            Last
          </Label>
          <Input
            id="line_limit"
            inputMode="numeric"
            className="w-20"
            value={lineLimit}
            onChange={handleLimitChange}
            onBlur={handleLimitBlur}
          />
          <span className="text-sm text-muted-foreground">lines</span>
        </div>
      </div>

      <div
        ref={terminalRef}
        className={cn(
          "flex flex-col overflow-hidden border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-sm",
          isFullscreen ? "h-screen" : "h-[calc(100vh-16rem)] rounded-lg",
        )}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="size-3 rounded-full bg-red-500/80" />
              <span className="size-3 rounded-full bg-amber-500/80" />
              <span className="size-3 rounded-full bg-green-500/80" />
            </div>
            <div className="ml-2 flex items-center gap-1.5 font-mono text-xs text-zinc-400">
              <Terminal className="size-3.5" />
              logs
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              title="Wrap lines"
              className={cn(
                "h-7 gap-1 px-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100",
                isWrapped && "bg-zinc-800 text-zinc-100",
              )}
              onClick={() => setIsWrapped((prev) => !prev)}
            >
              <WrapText className="size-3.5" />
              Wrap
            </Button>
            <Button
              size="sm"
              variant="ghost"
              title={isFullscreen ? "Exit full screen" : "View full screen"}
              className="h-7 gap-1 px-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? (
                <Minimize2 className="size-3.5" />
              ) : (
                <Maximize2 className="size-3.5" />
              )}
              {isFullscreen ? "Exit full screen" : "Full screen"}
            </Button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="h-full overflow-auto p-4 font-mono text-[13px] leading-6"
          >
            {isLoading && (
              <div className="space-y-2">
                {SKELETON_WIDTHS.map((width, index) => (
                  <div key={index} className="flex gap-3">
                    <Skeleton className="h-4 w-28 shrink-0 bg-zinc-800" />
                    <Skeleton className={cn("h-4 bg-zinc-800", width)} />
                  </div>
                ))}
              </div>
            )}

            {isEmpty && (
              <div className="flex h-full items-center justify-center text-zinc-500">
                {emptyText}
              </div>
            )}

            {!isLoading && lines.length > 0 && (
              <>
                {hasNextPage && (
                  <div className="mb-2 flex justify-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={loadOlder}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage && (
                        <Loader2 size={14} className="mr-1 animate-spin" />
                      )}
                      Load older
                    </Button>
                  </div>
                )}

                {lines.map((line) => (
                  <div
                    key={line.log_id}
                    className={cn(
                      "flex gap-3",
                      !isWrapped && "w-max min-w-full",
                    )}
                  >
                    <span className="shrink-0 select-none text-zinc-600">
                      {formatTimestamp(line.ts)}
                    </span>
                    {showService && (
                      <span className="shrink-0 text-sky-400">
                        {line.service_name}
                      </span>
                    )}
                    <span
                      className={cn(
                        "min-w-0 flex-1",
                        STREAM_CLASS[line.stream] ?? "text-zinc-200",
                        isWrapped
                          ? "whitespace-pre-wrap break-all"
                          : "whitespace-pre",
                      )}
                    >
                      {line.message}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>

          <AnimatePresence>
            {!isFollowing && lines.length > 0 && (
              <motion.div
                className="absolute bottom-4 right-6"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
              >
                <Button
                  size="sm"
                  className="gap-1 shadow-md"
                  onClick={jumpToLatest}
                >
                  <ArrowDown size={14} />
                  Jump to latest
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
