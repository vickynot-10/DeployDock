"use client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import api from "@/libs/axios";
import AppSelect from "@/components/ui-elements/AppSelect";
import { FormatDate } from "@/helpers/formatDate";
import Skeleton from "react-loading-skeleton";
import BreadCrumbs from "@/components/ui-elements/BreadCrumbs";
import Image from "next/image";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  PiCheckCircle,
  PiXCircle,
  PiCircleFill,
} from "react-icons/pi";
const status_badge: Record<
  number,
  { label: string; className: string; dot: string }
> = {
  0: {
    label: "New",
    className: "bg-[#1a1a1a] text-[#9ca3af] border-[#374151]",
    dot: "bg-[#9ca3af]",
  },
  1: {
    label: "Running",
    className: "bg-[#0c1f3a] text-[#60a5fa] border-[#1e3a5f]",
    dot: "bg-[#60a5fa]",
  },
  2: {
    label: "Stopped",
    className: "bg-[#1a1a1a] text-[#9ca3af] border-[#374151]",
    dot: "bg-[#9ca3af]",
  },
};

const OPTIONS = [
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


const fetchProjectLogs = async (
  id: string,
  start_date?: string,
  end_date?: string,
) => {
  const res = await api.get("/projects/run-time-logs", {
    params: { id, start_date, end_date },
  });
  return res.data;
};

export default function ProjectRunTimeLogsComp( {id} : {id :string} ) {

  const [selected_option, set_selected_option] = useState<{
    label: string;
    value: number;
  } | null>(OPTIONS[0]);

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
    const endOfDay = custom_end
      ? new Date(new Date(custom_end).setHours(23, 59, 59, 999)).toISOString()
      : "";
    return {
      start: custom_start?.toISOString() ?? "",
      end: endOfDay,
    };
  }
  return get_date_range(selected_option?.value ?? 1);
}, [selected_option?.value, is_custom, custom_start, custom_end]);

  const can_fetch = is_custom
    ? !!custom_start && !!custom_end && !date_error
    : true;

  const { data, isLoading } = useQuery({
    queryKey: ["project-runtime-logs", id, date_range.start, date_range.end],
    queryFn: () => fetchProjectLogs(id, date_range.start, date_range.end),
    enabled: !!id && can_fetch,
    refetchOnMount: true,
   
    placeholderData: keepPreviousData,
    staleTime: is_custom ? 0 : 1000 * 60 * 5,
    gcTime: is_custom ? 0 : 1000 * 60 * 10,
    retry: false,
  });

  const project = data?.data?.[0];
  const logs: any[] = project?.runtime_logs ?? [];



  const breadcrumb_items = [
    { label: "Projects", url: "/projects", active: false },
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
                {project?.project_name ?? "Runtime Logs"}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-2">
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
              options={OPTIONS}
              className="w-40 h-9"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <Skeleton key={i} height={60} borderRadius={8} />
            ))
          ) : logs.length <= 0 ? (
            <div className="flex items-center justify-center py-16">
              <Image
                src="/no_results_found.svg"
                alt="No Data"
                width={300}
                height={300}
                loading="eager"
                style={{ objectFit: "contain" }}
              />
            </div>
          ) : (
            logs.map((log: any, i: number) => {
              const is_error = log.type === "error";
              const is_last = i === logs.length - 1;
              const badge = status_badge[log.status ?? 0];
              const date_str = FormatDate(log.timestamp);
              return (
                <div key={log._id} className="flex gap-0 relative">
                  <div className="w-36 flex-shrink-0 pt-1 pr-4 text-right">
                    <span className="text-[11px] font-medium text-[var(--text-1)]">
                      {date_str}
                    </span>
                  </div>

                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 border ${
                        is_error
                          ? "bg-[#1f0d0d] border-[#7f1d1d]"
                          : "bg-[#0f2f1a] border-[#166534]"
                      }`}
                    >
                      {is_error ? (
                        <PiXCircle size={14} className="text-red-400" />
                      ) : (
                        <PiCheckCircle size={14} className="text-emerald-400" />
                      )}
                    </div>
                    {!is_last && (
                      <div className="w-px flex-1 min-h-4 bg-[var(--border-1)]" />
                    )}
                  </div>

                  <div className="flex-1 pb-5 pl-4">
                    <div className="flex flex-col gap-1 px-3.5 py-2.5 rounded-xl border border-[var(--border-1)] bg-[var(--bg-2)]">
                      <span className="text-[13px] font-medium text-[var(--text-1)]">
                        {log.msg}
                      </span>
                      {log.details && (
                        <span className="text-[11px] font-mono text-[var(--text-4)]">
                          {log.details}
                        </span>
                      )}
                      {log.user_name && (
                        <span className="text-[11px] text-[var(--text-4)]">
                          by {log.user_name}
                        </span>
                      )}
                      {badge && (
                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border w-fit mt-1 ${badge.className}`}
                        >
                          <PiCircleFill size={6} className={badge.dot} />
                          {badge.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
