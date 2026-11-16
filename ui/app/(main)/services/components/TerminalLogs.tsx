"use client";

import { useEffect, useRef, useState } from "react";
import { Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useDeployLogsSocket,
  type LiveLogLine,
} from "@/hooks/socket/useDeployLogsSocket";

export type DeploymentLog = {
  id: number | string;
  ts: string;
  line: string;
  stream: string;
  deployment_id: string;
};

const STREAM_CLASS: Record<string, string> = {
  system: "text-sky-400",
  stdout: "text-zinc-200",
  stderr: "text-red-400",
};

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString("en-GB", { hour12: false });
}

export default function TerminalLogs({
  logs,
  deployment_id,
}: {
  logs: DeploymentLog[];
  deployment_id: string;
}) {
  const [liveLogs, setLiveLogs] = useState<LiveLogLine[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useDeployLogsSocket(deployment_id, setLiveLogs);

  useEffect(
    function () {
      setLiveLogs([]);
    },
    [deployment_id],
  );

  const allLogs: DeploymentLog[] = [
    ...logs,
    ...liveLogs.map((item, index) => ({
      ...item,
      id: `live-${index}`,
      deployment_id,
    })),
  ];

  useEffect(
    function () {
      bottomRef.current?.scrollIntoView({ block: "end" });
    },
    [allLogs.length],
  );

  return (
    <div className="overflow-hidden rounded-lg border bg-zinc-950 text-zinc-100 shadow-sm">
      <div className="flex items-center gap-2 border-b border-zinc-800 bg-zinc-900 px-4 py-2">
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-red-500/80" />
          <span className="size-3 rounded-full bg-amber-500/80" />
          <span className="size-3 rounded-full bg-green-500/80" />
        </div>
        <div className="ml-2 flex items-center gap-1.5 font-mono text-xs text-zinc-400">
          <Terminal className="size-3.5" />
          deployment logs
        </div>
      </div>

      <div className="h-[28rem] overflow-auto p-4 font-mono text-[13px] leading-6">
        {allLogs.length === 0 ? (
          <p className="text-zinc-500">No logs yet.</p>
        ) : (
          allLogs.map((log) => (
            <div key={log.id} className="flex gap-3 whitespace-pre-wrap">
              <span className="shrink-0 select-none text-zinc-600">
                {formatTime(log.ts)}
              </span>
              <span
                className={cn(
                  "break-all",
                  STREAM_CLASS[log.stream] ?? "text-zinc-200",
                )}
              >
                {log.line}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
