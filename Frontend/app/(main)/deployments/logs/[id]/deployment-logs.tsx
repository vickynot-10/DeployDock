"use client";
import BreadCrumbs from "@/components/ui-elements/BreadCrumbs";
import api from "@/libs/axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { APP_CONSTANTS } from "@/app_constants";
import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import {
  PiCheckCircleFill,
  PiXCircleFill,
  PiCircleHalfFill,
  PiTerminal,
  PiCheckCircle,
  PiXCircle,
  PiWarning,
  PiInfo,
  PiCaretRight,
} from "react-icons/pi";

async function GetDeploymentLogs(id: string) {
  const res = await api.get(`/deployments/logs/${id}`);
  return res.data;
}

const LOG_TYPE_ICON: Record<number, React.ReactNode> = {
  [APP_CONSTANTS.WORKER_LOGS_TYPES.SUCCESS]: (
    <PiCheckCircle size={13} className="text-emerald-400 shrink-0 mt-[2px]" />
  ),
  [APP_CONSTANTS.WORKER_LOGS_TYPES.ERROR]: (
    <PiXCircle size={13} className="text-red-400 shrink-0 mt-[2px]" />
  ),
  [APP_CONSTANTS.WORKER_LOGS_TYPES.WARNING]: (
    <PiWarning size={13} className="text-yellow-400 shrink-0 mt-[2px]" />
  ),
  [APP_CONSTANTS.WORKER_LOGS_TYPES.INFO]: (
    <PiCheckCircle size={13} className="text-emerald-400 shrink-0 mt-[2px]" />
  ),
  [APP_CONSTANTS.WORKER_LOGS_TYPES.LOG]: (
    <PiCaretRight
      size={13}
      className="text-[var(--text-4)] shrink-0 mt-[2px]"
    />
  ),
};

const LOG_TYPE_COLORS: Record<number, string> = {
  [APP_CONSTANTS.WORKER_LOGS_TYPES.SUCCESS]: "text-emerald-400",
  [APP_CONSTANTS.WORKER_LOGS_TYPES.ERROR]: "text-red-400",
  [APP_CONSTANTS.WORKER_LOGS_TYPES.WARNING]: "text-yellow-400",
  [APP_CONSTANTS.WORKER_LOGS_TYPES.INFO]: "text-emerald-400",
  [APP_CONSTANTS.WORKER_LOGS_TYPES.LOG]: "text-[var(--text-3)]",
};

function LogMessage({
  message,
  log_type,
}: {
  message: string;
  log_type: number;
}) {
  const color = LOG_TYPE_COLORS[log_type] ?? "text-[var(--text-3)]";
  const is_pre = /[─│┌┐└┘├┤┬┴┼]/.test(message);
  if (is_pre) {
    return (
      <pre
        className={`leading-relaxed whitespace-pre overflow-x-auto text-[11px] text-emerald-400 `}
      >
        {message}
      </pre>
    );
  }
  return <p className={`leading-relaxed ${color}`}>{message}</p>;
}
import { useSSE } from "@/contexts/SSEProvider";

type Props = { id: string };

const status_config: Record<
  string,
  { label: string; icon: React.ReactNode; className: string }
> = {
  1: {
    label: "Success",
    icon: <PiCheckCircleFill size={14} />,
    className: " bg-emerald-900 ",
  },
  3: {
    label: "Failed",
    icon: <PiXCircleFill size={14} />,
    className: "bg-red-400/10",
  },
  2: {
    label: "Running",
    icon: <PiCircleHalfFill size={14} className="animate-spin" />,
    className: " bg-blue-400/10",
  },
};

function format_date(d: string) {
  if (!d) return "-";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function format_time(d: string) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function format_duration(s: number) {
  if (!s && s !== 0) return "-";
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

const breadcrumbs_items = [
  { label: "Deployments", url: "/deployments", active: false },
  { label: "Deployment Logs", active: true },
];

export default function DeploymentLogs({ id }: Props) {
  const query_client = useQueryClient();
  const [live_logs, set_live_logs] = useState<any[]>([]);
  const [live_status, set_live_status] = useState<number | null>(null);
  const logs_bottom_ref = useRef<HTMLDivElement>(null);

  const { data: res, isLoading } = useQuery({
    queryKey: ["deployment-logs", id],
    queryFn: () => GetDeploymentLogs(id!),
    enabled: !!id,
    retry: false,
    refetchOnMount: true,
  });

  const data: any = res && res.deployment;
  const is_running = Number(live_status ?? data?.status) === 2;

  const { subscribe } = useSSE();

  const subscribe_ref = useRef(subscribe);
  subscribe_ref.current = subscribe;

  useEffect(() => {
    if (!data || data.status !== 2) return;

    const unsub = subscribe_ref.current((event) => {
      if (event.deployment_id && String(event.deployment_id) !== String(id))
        return;

      if (event.type === "log") {
        set_live_logs((prev) => [...prev, event]);
      }

      if (event.type === "status") {
        if (event.status === "success") set_live_status(1);
        else if (event.status === "failed") set_live_status(3);
        else if (event.status === "running") set_live_status(2);

        query_client.invalidateQueries({ queryKey: ["deployment-logs", id] });
      }
    });

    return () => unsub();
  }, [data?.status, id]);

  const display_logs: any[] = is_running ? live_logs : (res?.logs ?? []);

  const display_status = live_status ?? data?.status;
  const status_info = status_config[display_status] ?? {
    label: display_status ?? "-",
    icon: null,
    className: "text-[var(--text-3)] bg-[var(--bg-4)] border-[var(--border-2)]",
  };

  return (
    <>
      <BreadCrumbs items={breadcrumbs_items} />
      <div className="flex items-center gap-3 mb-3">
        <div>
          <h1 className="text-[18px] font-bold text-[var(--text-1)] leading-tight">
            {isLoading
              ? "Loading..."
              : `${data?.project_name ?? "Deployment Logs"} - ${
                  data?.deployment_id ?? ""
                }`}
          </h1>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl p-4 bg-[var(--bg-1)] border border-[var(--border-1)]"
              >
                <Skeleton width={60} height={10} className="mb-2" />
                <Skeleton width={80} height={24} borderRadius={999} />
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-[var(--border-1)]">
            <div className="px-4 py-3 border-b border-[var(--border-1)] bg-[var(--bg-1)]">
              <Skeleton width={100} height={14} />
            </div>
            <div className="bg-[var(--bg-0)] p-4 flex flex-col gap-2 min-h-[200px]">
              {[...Array(8)].map((_, i) => (
                <Skeleton
                  key={i}
                  width={`${60 + Math.random() * 35}%`}
                  height={14}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {!isLoading && data && (
        <>
          <div className="grid grid-cols-3 mb-3 gap-3">
            <div
              className={`flex flex-col gap-2 items-center justify-center rounded-xl px-6 py-5 ${status_info.className} `}
            >
              <span className="text-[11px] font-bold uppercase text-white tracking-widest opacity-80">
                Status
              </span>
              <span className="text-[16px]">{status_info.label}</span>
            </div>

            <div
              className={`flex flex-col gap-2 rounded-xl   items-center justify-center  text-white bg-indigo-950 px-6 py-5`}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                Duration
              </span>
              <span className="text-[16px] ">
                {format_duration(data.duration_seconds)}
              </span>
            </div>

            <div
              className={`flex flex-col gap-2 rounded-xl text-white bg-slate-950 items-center justify-center px-6 py-5`}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 ">
                Deployed At
              </span>
              <span className="text-[16px]     whitespace-pre-line">
                {format_date(data.deployed_at)}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border-1)]">
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[var(--border-1)] bg-[var(--bg-1)]">
              <PiTerminal size={15} className="text-[var(--text-4)]" />
              <span className="text-[13px] font-semibold text-[var(--text-2)]">
                Build Output
              </span>
              {is_running && (
                <span className="flex items-center gap-1.5 text-[11px] text-blue-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  Live
                </span>
              )}
              <span className="ml-auto text-[11px] text-[var(--text-4)]">
                {display_logs.length} entries
              </span>
            </div>

            <div className="bg-[var(--bg-0)] p-4 flex flex-col gap-0 font-mono text-[12.5px] min-h-[200px] max-h-[480px] overflow-y-auto">
              {display_logs.length === 0 && (
                <p className="text-[var(--text-4)]">
                  {is_running ? "Waiting for logs..." : "No logs available."}
                </p>
              )}
              {display_logs &&
                display_logs.map((log: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 py-[3px] group hover:bg-white/[0.02] px-2 rounded"
                  >
                    <span className="text-[var(--text-4)] shrink-0 select-none w-[76px] text-right text-[11px] pt-[2px]">
                      {format_time(log.deployed_at)}
                    </span>
                    {LOG_TYPE_ICON[log.log_type] ?? (
                      <PiCaretRight
                        size={13}
                        className="text-[var(--text-4)] shrink-0 mt-[2px]"
                      />
                    )}
                    <LogMessage message={log.message} log_type={log.log_type} />
                  </div>
                ))}
              <div ref={logs_bottom_ref} />
            </div>
          </div>
        </>
      )}

      {!isLoading && !data && (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <PiTerminal size={28} className="text-[var(--text-4)]" />
          <p className="text-[13px] text-[var(--text-4)]">
            No deployment data found
          </p>
        </div>
      )}
    </>
  );
}
