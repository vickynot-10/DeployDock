"use client";
import { useMemo } from "react";
import api from "@/libs/axios";
import { useQuery } from "@tanstack/react-query";
import { FormatDate } from "@/helpers/formatDate";
import { useRouter } from "next/navigation";
import { FaRegFolderOpen } from "react-icons/fa";
import Skeleton from "react-loading-skeleton";
import ReactECharts from "echarts-for-react";
import "react-loading-skeleton/dist/skeleton.css";
import { TbLayoutGrid, TbPlayerPlay, TbPlayerStop } from "react-icons/tb";

const fetch_dashboard = async (): Promise<any> => {
  const res = await api.get("/dashboard");
  return res.data;
};

const STAT_CARDS = [
  {
    label: "Total Projects",
    key: "total_no_projects",
    icon: TbLayoutGrid,
    icon_color: "#9d9cff",
    icon_bg: "rgba(113,112,255,.12)",
  },
  {
    label: "Running",
    key: "running_projects",
    icon: TbPlayerPlay,
    icon_color: "#4ade80",
    icon_bg: "rgba(34,197,94,.1)",
  },
  {
    label: "New Projects",
    key: "new_projects",
    icon: FaRegFolderOpen,
    icon_color: "#facc15",
    icon_bg: "rgba(234,179,8,.1)",
  },
  {
    label: "Stopped",
    key: "stopped_projects",
    icon: TbPlayerStop,
    icon_color: "#f87171",
    icon_bg: "rgba(248,113,113,.1)",
  },
];

export default function DashboardComp() {
  const router = useRouter();

  const { data, isLoading } = useQuery<any>({
    queryKey: ["dashboard"],
    queryFn: fetch_dashboard,
    refetchOnMount: true,
    retry: false,
  });

  const deployments = data?.recent_deployments_20_limit || [];
  const webhooks = data?.recent_webhooks_20_limit || [];

  const bar_option = {
    backgroundColor: "transparent",

    tooltip: {
      trigger: "axis",

      axisPointer: {
        type: "shadow",
      },

      backgroundColor: "#1a1a2e",
      borderColor: "rgba(255,255,255,0.08)",

      textStyle: {
        color: "#e2e2e2",
        fontSize: 12,
      },

      formatter: (params: any) => {
        const row = deployments[params[0].dataIndex];

        return `
        <div style="font-size:12px;line-height:1.9;min-width:160px">
          <div style="font-weight:600;margin-bottom:4px">
            ${row._id}
          </div>

          <div style="color:#888">
            Total:
            <span style="color:#ccc">
              ${row.total_deployments}
            </span>
          </div>

          <div style="color:#888">
            Success:
            <span style="color:#4ade80">
              ${row.success_count}
            </span>
          </div>

          <div style="color:#888">
            Failed:
            <span style="color:#f87171">
              ${row.failed_count}
            </span>
          </div>

        
        </div>
      `;
      },
    },

    legend: {
      bottom: 0,
      icon: "circle",

      itemWidth: 8,
      itemHeight: 8,

      textStyle: {
        color: "#666",
        fontSize: 11,
      },

      data: ["Success", "Failed"],
    },

    grid: {
      left: 12,
      right: 12,
      top: 16,
      bottom: 40,
      containLabel: true,
    },

    xAxis: {
      type: "category",

      data: deployments.map((d: any) => d._id),

      axisLabel: {
        color: "#555",
        fontSize: 10,
      },

      axisLine: {
        lineStyle: {
          color: "rgba(255,255,255,0.06)",
        },
      },

      axisTick: {
        show: false,
      },
    },

    yAxis: {
      type: "value",

      axisLabel: {
        color: "#555",
        fontSize: 10,
      },

      splitLine: {
        lineStyle: {
          color: "rgba(255,255,255,0.05)",
          type: "dashed",
        },
      },
    },

    series: [
      {
        name: "Success",
        type: "bar",

        barWidth: 18,

        itemStyle: {
          color: "#4ade80",
          borderRadius: [6, 6, 0, 0],
        },

        emphasis: {
          focus: "series",
        },

        data: deployments.map((d: any) => d.success_count || 0),
      },

      {
        name: "Failed",
        type: "bar",

        barWidth: 18,

        itemStyle: {
          color: "#f87171",
          borderRadius: [6, 6, 0, 0],
        },

        emphasis: {
          focus: "series",
        },

        data: deployments.map((d: any) => d.failed_count || 0),
      },
    ],
  };

  const webhook_columns = [
    { key: "project_name", label: "Project Name" },
    { key: "environment", label: "Environment" },
    { key: "msg", label: "Message" },
    {
      key: "timestamp",
      label: "Timestamp",
      render: (_: any, row: any) => <span>{FormatDate(row.timestamp)}</span>,
    },
  ];

  if (isLoading && !data) {
    return (
      <div className="flex flex-col gap-[18px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-[14px] border border-[var(--border-1)] bg-[var(--bg-1)] p-5"
              style={{ boxShadow: "0 4px 24px rgba(0,0,0,.4)" }}
            >
              <Skeleton
                height={10}
                width={80}
                baseColor="var(--bg-2)"
                highlightColor="var(--bg-3)"
                className="mb-4"
              />
              <Skeleton
                height={28}
                width={50}
                baseColor="var(--bg-2)"
                highlightColor="var(--bg-3)"
              />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--bg-0)] overflow-hidden">
          <Skeleton
            height={44}
            baseColor="var(--bg-2)"
            highlightColor="var(--bg-3)"
            borderRadius={0}
          />
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="px-6 py-4 border-t border-[var(--border-1)]"
            >
              <Skeleton
                height={14}
                baseColor="var(--bg-2)"
                highlightColor="var(--bg-3)"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[18px] mb-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_CARDS.map(({ label, key, icon: Icon, icon_color, icon_bg }) => (
          <div
            key={key}
            className="flex flex-col gap-3 rounded-[14px] border border-[var(--border-1)] bg-[var(--bg-1)] p-5"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,.4)" }}
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] uppercase mb-3 text-[var(--text-4)]">
                  {label}
                </p>
                <p className="text-[24px] font-medium leading-none text-[var(--text-1)]">
                  {data?.[key] ?? 0}
                </p>
              </div>
              <div
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px]"
                style={{ background: icon_bg, color: icon_color }}
              >
                <Icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {deployments && deployments.length > 0 && (
        <>
          <p className="text-[13px] font-medium text-[var(--text-1)]">
            Recent Deployment Logs
          </p>

          <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--bg-0)] overflow-hidden">
            <ReactECharts
              style={{ height: 300, width: "100%" }}
              option={bar_option}
            />
          </div>
        </>
      )}

      <div className="w-full overflow-x-auto rounded-2xl border border-[var(--border-1)] bg-[var(--bg-0)]">
        <div className="px-5 py-3.5 bg-[var(--bg-2)] border-b border-[var(--border-1)]">
          <p className="text-[13px] font-medium text-[var(--text-1)]">
            Recent WebHook Events
          </p>
          <p className="text-[11px] text-[var(--text-4)] mt-0.5">
            Last {webhooks.length} events
          </p>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--bg-2)]">
            <tr>
              {webhook_columns.map((col: any) => (
                <th
                  key={col.key}
                  className="px-6 py-3 text-left text-xs font-medium text-[var(--text-3)] whitespace-nowrap"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {webhooks.length > 0 ? (
              webhooks.map((row: any, i: number) => (
                <tr
                  key={row._id || i}
                  className={`border-t border-[var(--border-1)] ${i % 2 === 0 ? "bg-[var(--bg-0)]" : "bg-[var(--bg-1)]"} hover:bg-[var(--bg-3)] transition-colors`}
                >
                  {webhook_columns.map((col: any) => (
                    <td
                      key={col.key}
                      className="px-6 py-4 text-[var(--text-2)] whitespace-nowrap"
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : row[col.key] || "-"}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={webhook_columns.length}
                  className="text-center py-10 text-[var(--text-4)]"
                >
                  No data found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
