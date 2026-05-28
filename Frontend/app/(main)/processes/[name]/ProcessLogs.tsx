"use client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import api from "@/libs/axios";
import Skeleton from "react-loading-skeleton";
import { PiArrowClockwise } from "react-icons/pi";
import BreadCrumbs from "@/components/ui-elements/BreadCrumbs";
import AppTextInput from "@/components/ui-elements/AppTextInput";
import AppIconButton from "@/components/ui-elements/AppIconButton";
import TooltipWrapper from "@/helpers/tooltipWrapper";

const fetchProcessLogs = async (app_name: string, lines = 50) => {
  const res = await api.get("/processes/app-process-logs", {
    params: { app_name, lines },
  });
  return res.data;
};

const LOG_PREFIX = /^0\|[\w-]+\s+\|\s?/;

type LogClass =
  | "separator"
  | "empty"
  | "err"
  | "warn"
  | "ok"
  | "trace"
  | "dim"
  | "info"
  | "default";

function classifyLog(raw: string): { type: LogClass; text: string } {
  if (
    raw.startsWith("/home/") ||
    (raw.startsWith("/var/") && raw.includes("last"))
  ) {
    return { type: "separator", text: raw };
  }
  const text = raw.replace(LOG_PREFIX, "");
  if (!text.trim()) return { type: "empty", text: "" };
  const lower = text.toLowerCase();
  if (
    /^error:/.test(text) ||
    (/\berror\b/.test(lower) && !/injecting/.test(lower))
  )
    return { type: "err", text };
  if (/throw new error|throw /.test(lower) || /^\s+\^/.test(text))
    return { type: "err", text };
  if (/mongo failed|failed/.test(lower)) return { type: "warn", text };
  if (/mongodb connected|server running on port/.test(lower))
    return { type: "ok", text };
  if (
    /at object\.<anonymous>|at module\._compile|at module\.load|at require/.test(
      lower,
    )
  )
    return { type: "trace", text };
  if (/\[dotenv|> start|> node /.test(text)) return { type: "dim", text };
  if (/node\.js v/.test(text)) return { type: "info", text };
  return { type: "default", text };
}

const logColorMap: Record<LogClass, string> = {
  err: "text-red-400",
  warn: "text-yellow-400",
  ok: "text-green-400",
  trace: "text-neutral-600",
  dim: "text-neutral-500",
  info: "text-[var(--accent)]",
  default: "text-neutral-300",
  separator: "text-neutral-500",
  empty: "",
};

const logBgMap: Record<string, string> = {
  err: "bg-red-950/40",
  warn: "bg-yellow-950/40",
  ok: "bg-green-950/30",
};

export default function SeparateProcessLogsComp({
  process_name,
}: {
  process_name: string;
}) {
  const [inputLines, setInputLines] = useState(50);
  const [lines, setLines] = useState(50);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["app-process-logs", process_name, lines],
    queryFn: () => fetchProcessLogs(process_name, lines),
    enabled: !!process_name,
    refetchOnMount: false,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  function SetInput(value: string) {
    const num_val = Number(value);

    if (num_val <= 0) {
      setInputLines(1);
      return;
    }

    setInputLines(num_val);
  }

  const project = data?.data;
  const logs: any[] = data?.runtime_logs ?? [];

  const handleFetch = () => {
    setLines(inputLines);
  };

  const breadcrumb_items = [
    { label: "Processes", url: "/processes", active: false },
    { label: project?.project_name ?? "Logs", active: true },
  ];

  return (
    <>
      <BreadCrumbs items={breadcrumb_items} />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            {isLoading ? (
              <Skeleton height={20} width={160} borderRadius={6} />
            ) : (
              <h2 className="text-[15px] font-semibold text-[var(--text-1)]">
                {project?.project_name ?? "Process Logs"}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-2">
            <AppTextInput
              type="number"
              value={inputLines}
              onChange={(e) => SetInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFetch()}
              placeholder="Lines"
              className="w-24"
            />
            <TooltipWrapper content="Fetch logs">
              <AppIconButton onClick={handleFetch}>
                {" "}
                <PiArrowClockwise />{" "}
              </AppIconButton>
            </TooltipWrapper>
          </div>
        </div>
      </div>

      <div className="rounded-xl border my-3 border-neutral-800 bg-[#0d0d0f] font-mono text-[12.5px]">
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#16161c] border-b border-neutral-800">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-neutral-500 text-[11px]">
            {project?.process_name} — pm2 logs
          </span>
          <span className="text-[11px] text-[var(--accent)] bg-neutral-900 border border-neutral-700 px-2 py-0.5 rounded">
            {inputLines} lines
          </span>
        </div>

        <div className="overflow-y-auto py-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-neutral-800">
          {isLoading || isFetching ? (
            <div className="px-3.5 py-2">
              {Array.from({ length: lines }).map((_, i) => (
                <div key={i} className="flex gap-2.5 py-[1.5px]">
                  <Skeleton width={28} height={14} borderRadius={3} />
                  <Skeleton width="60%" height={14} borderRadius={3} />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="px-4 py-6 text-neutral-600 text-center">
              No logs found
            </div>
          ) : (
            (() => {
              let lineNum = 1;
              return logs.map((raw, i) => {
                const { type, text } = classifyLog(raw);

                if (type === "separator") {
                  const isErr = raw.includes("error");
                  return (
                    <div
                      key={i}
                      className="px-3.5 pt-3 pb-1 flex items-center gap-2"
                    >
                      <div className="h-px w-4 bg-neutral-800" />
                      <span
                        className={`text-[11px] ${isErr ? "text-red-600" : "text-[var(--accent)]"} opacity-70`}
                      >
                        {raw}
                      </span>
                      <div className="h-px flex-1 bg-neutral-800" />
                    </div>
                  );
                }

                if (type === "empty") return <div key={i} className="h-1.5" />;

                const num = lineNum++;
                return (
                  <div
                    key={i}
                    className={`flex gap-2.5 px-3.5 py-[1.5px] group hover:bg-neutral-900/60 ${logBgMap[type] ?? ""}`}
                  >
                    <span className="text-[11px] text-neutral-700 min-w-[28px] text-right pt-[1px] select-none flex-shrink-0">
                      {num}
                    </span>
                    <span
                      className={`break-all whitespace-pre-wrap ${logColorMap[type]}`}
                    >
                      {text}
                    </span>
                  </div>
                );
              });
            })()
          )}
        </div>
      </div>
    </>
  );
}
