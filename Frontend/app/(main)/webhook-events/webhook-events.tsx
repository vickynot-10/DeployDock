"use client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState, useMemo, memo } from "react";
import { useRouter } from "next/navigation";
import api from "@/libs/axios";
import AppSelect from "@/components/ui-elements/AppSelect";
import Skeleton from "react-loading-skeleton";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  PiCheckCircleFill,
  PiXCircleFill,
  PiArrowSquareOutBold,
  PiWebhooksLogoBold,
  PiClockBold,
  PiGitBranchBold,
} from "react-icons/pi";

const DATE_OPTIONS = [
  { label: "Today", value: 1 },
  { label: "Yesterday", value: 2 },
  { label: "Last 7 days", value: 3 },
  { label: "Last 30 Days", value: 4 },
  { label: "Custom", value: 5 },
];

function get_date_range(option: number): { start: string; end: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString();
  if (option === 1) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { start: fmt(start), end: fmt(now) };
  }
  if (option === 2) {
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return { start: fmt(start), end: fmt(end) };
  }
  if (option === 3) {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { start: fmt(start), end: fmt(now) };
  }
  if (option === 4) {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return { start: fmt(start), end: fmt(now) };
  }
  return { start: "", end: "" };
}

function format_ts(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

async function get_project_list() {
  const res = await api.get(`/webhooks/projects`);
  return res.data;
}

async function get_webhook_logs(
  project_id: string,
  start_date: string,
  end_date: string,
) {
  const res = await api.get("/webhooks", {
    params: { project_id, start_date, end_date },
  });
  return res.data;
}

type WebhookLog = {
  _id: string;
  msg: string;
  status: 1 | 2;
  timestamp: string;
  branch: string;
};

type WebhookGroup = {
  deployment_id: string;
  logs: WebhookLog[];
};

const DeploymentGroup = memo(function DeploymentGroup({
  group,
}: {
  group: WebhookGroup;
}) {
  const router = useRouter();
  const overall_failed = group.logs.some((l) => l.status === 2);
  const short_id = group.deployment_id.slice(-8).toUpperCase();
  const branch = group.logs[0]?.branch ?? "unknown";

  return (
    <div className="rounded-xl border border-[var(--border-2)] bg-[var(--bg-1)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-1)] bg-[var(--bg-2)]">
        <div className="flex items-center gap-3">
          <PiWebhooksLogoBold className="text-[var(--text-3)] shrink-0" size={15} />
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--text-3)] font-mono uppercase tracking-wide">
              Deployment
            </span>
            <code className="text-[12px] font-mono text-[var(--text-2)] bg-[var(--bg-3)] px-2 py-0.5 rounded-md border border-[var(--border-1)]">
              #{short_id}
            </code>
            <span className="flex items-center gap-1 text-[11px] text-[var(--accent)] bg-[var(--accent-tint)] px-2 py-0.5 rounded-full font-mono">
              <PiGitBranchBold size={11} />
              {branch}
            </span>
          </div>
          <span
            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
              overall_failed
                ? "bg-red-500/10 text-red-400"
                : "bg-green-500/10 text-green-400"
            }`}
          >
            {overall_failed ? (
              <PiXCircleFill size={11} />
            ) : (
              <PiCheckCircleFill size={11} />
            )}
            {overall_failed ? "Failed" : "Success"}
          </span>
        </div>

        <button
          onClick={() => router.push(`/deployments/logs/${group.deployment_id}`)}
          className="flex items-center gap-1.5 text-[12px] text-[var(--accent)] hover:text-[var(--accent-hover)] font-medium transition-colors"
        >
          View Deployment Logs
          <PiArrowSquareOutBold size={13} />
        </button>
      </div>

      <div className="divide-y divide-[var(--border-1)]">
        {group.logs.map((log) => (
          <div key={log._id} className="flex items-start gap-3 px-4 py-3">
            <div className="mt-0.5 shrink-0">
              {log.status === 1 ? (
                <PiCheckCircleFill size={15} className="text-green-400" />
              ) : (
                <PiXCircleFill size={15} className="text-red-400" />
              )}
            </div>
            <span
              className={`text-[13px] flex-1 leading-relaxed ${
                log.status === 1 ? "text-[var(--text-2)]" : "text-red-300"
              }`}
            >
              {log.msg}
            </span>
            <div className="flex items-center gap-1.5 shrink-0 text-[11px] text-[var(--text-4)]">
              <PiClockBold size={11} />
              <span>{format_ts(log.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

export default function WebhookLogsComp() {
  const [selected_project, set_selected_project] = useState<{
    label: string;
    value: string;
  } | null>(null);

  const [selected_option, set_selected_option] = useState<{
    label: string;
    value: number;
  } | null>(DATE_OPTIONS[0]);

  const [custom_start, set_custom_start] = useState<Date | null>(null);
  const [custom_end, set_custom_end] = useState<Date | null>(null);

  const is_custom = selected_option?.value === 5;

  const date_error = useMemo(() => {
    if (!is_custom || !custom_start || !custom_end) return null;
    if (custom_start > custom_end) return "Start date must be before end date";
    return null;
  }, [is_custom, custom_start, custom_end]);

  const date_range = useMemo(() => {
    if (is_custom) {
      const end_of_day = custom_end
        ? new Date(new Date(custom_end).setHours(23, 59, 59, 999)).toISOString()
        : "";
      return { start: custom_start?.toISOString() ?? "", end: end_of_day };
    }
    return get_date_range(selected_option?.value ?? 1);
  }, [selected_option?.value, is_custom, custom_start, custom_end]);

  const can_fetch = is_custom
    ? !!custom_start && !!custom_end && !date_error
    : true;

  const { data: projects_data, isLoading: projects_loading } = useQuery({
    queryKey: ["webhook-projects-list"],
    queryFn: get_project_list,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const project_options = useMemo(() => {
    const list: { _id: string; project_name: string }[] =
      projects_data?.projects ?? [];
    return list.map((p) => ({ label: p.project_name, value: p._id }));
  }, [projects_data]);

  const { data: logs_data, isLoading: logs_loading } = useQuery({
    queryKey: [
      "webhook-logs",
      selected_project?.value,
      date_range.start,
      date_range.end,
    ],
    queryFn: () =>
      get_webhook_logs(
        selected_project!.value,
        date_range.start,
        date_range.end,
      ),
    enabled: !!selected_project?.value && can_fetch,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
    staleTime: is_custom ? 0 : 1000 * 60 * 5,
    gcTime: is_custom ? 0 : 1000 * 60 * 10,
    retry: false,
  });

  const groups: WebhookGroup[] = logs_data?.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        {projects_loading ? (
          <Skeleton width={160} height={36} borderRadius={6} />
        ) : (
          <AppSelect
            value={selected_project}
            onChange={(o) => set_selected_project(o)}
            options={project_options}
            isSearchable
            className="w-52 h-9"
            placeholder="Select Project"
          />
        )}

        {is_custom && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <DatePicker
                selected={custom_start}
                onChange={(date: any) => set_custom_start(date)}
                selectsStart
                startDate={custom_start}
                endDate={custom_end}
                maxDate={custom_end ?? new Date()}
                placeholderText="Start date"
                dateFormat="dd MMM yyyy"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
              />
              <DatePicker
                selected={custom_end}
                onChange={(date: any) => set_custom_end(date)}
                selectsEnd
                startDate={custom_start}
                endDate={custom_end}
                minDate={custom_start ?? undefined}
                maxDate={new Date()}
                placeholderText="End date"
                dateFormat="dd MMM yyyy"
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
              />
            </div>
            {date_error && (
              <span className="text-[11px] text-red-400">{date_error}</span>
            )}
          </div>
        )}

        <AppSelect
          value={selected_option}
          onChange={(o) => set_selected_option(o)}
          options={DATE_OPTIONS}
          className="w-40 h-9"
        />
      </div>

      {logs_loading && (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} height={120} borderRadius={12} />
          ))}
        </div>
      )}

      {!logs_loading && !selected_project && (
        <div className="flex items-center justify-center py-16 text-[13px] text-[var(--text-4)]">
          Select a project to view webhook logs
        </div>
      )}

      {!logs_loading && selected_project && groups.length === 0 && (
        <div className="flex items-center justify-center py-16 text-[13px] text-[var(--text-4)]">
          No webhook logs found for this period
        </div>
      )}

      {!logs_loading && groups.length > 0 && (
        <div className="flex flex-col gap-3">
          {groups.map((group) => (
            <DeploymentGroup key={group.deployment_id} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}