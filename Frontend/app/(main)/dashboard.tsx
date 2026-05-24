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

const STATUS_CONFIG: any = {
  1: { text: "Success", className: "text-green-400" },
  2: { text: "Running", className: "text-yellow-400" },
  3: { text: "Failed", className: "text-red-400" },
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

  const deployments = useMemo(
    () => data?.recent_deployments_20_limit ?? [],
    [data],
  );

  const webhooks = useMemo(() => data?.recent_webhooks_20_limit ?? [], [data]);

  const donut_data = useMemo(() => {
    const counts = { Success: 0, Running: 0, Failed: 0 };
    deployments.forEach((d: any) => {
      if (d.status === 1) counts.Success++;
      else if (d.status === 2) counts.Running++;
      else if (d.status === 3) counts.Failed++;
    });
    return [
      { value: counts.Success, name: "Success", color: "#4ade80" },
      { value: counts.Running, name: "Running", color: "#facc15" },
      { value: counts.Failed, name: "Failed", color: "#f87171" },
    ].filter((d) => d.value > 0);
  }, [deployments]);

  const bar_option = useMemo(
    () => ({
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "#1a1a2e",
        borderColor: "rgba(255,255,255,0.08)",
        textStyle: { color: "#e2e2e2", fontSize: 12 },
        formatter: (params: any) => {
          const p = params[0];
          const row: any = deployments[p.dataIndex];
          const status = STATUS_CONFIG[row.status];
          const dotColor =
            row.status === 1
              ? "#4ade80"
              : row.status === 2
                ? "#facc15"
                : "#f87171";
          return `
          <div style="font-size:12px;line-height:1.9;min-width:160px">
            <div style="font-weight:600;margin-bottom:4px">${row.project_name}</div>
            <div style="color:#888">ID: <span style="color:#ccc">${row.deployment_id}</span></div>
            <div style="color:#888">Duration: <span style="color:#ccc">${row.duration_seconds ?? "-"}s</span></div>
            <div style="color:#888">Status: <span style="color:${dotColor}">${status?.text ?? "Unknown"}</span></div>
            <div style="color:#666;font-size:11px;margin-top:2px">Click to view logs</div>
          </div>`;
        },
      },
      legend: {
        bottom: 0,
        icon: "circle",
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: "#666", fontSize: 11 },
        data: [
          { name: "Success", itemStyle: { color: "#4ade80" } },
          { name: "Running", itemStyle: { color: "#facc15" } },
          { name: "Failed", itemStyle: { color: "#f87171" } },
        ],
      },
      grid: { left: 12, right: 12, top: 16, bottom: 40, containLabel: true },
      xAxis: {
        type: "category",
        data: deployments.map((d: any) => {
          const date = new Date(d.deployed_at);
          return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
        }),
        axisLabel: { color: "#555", fontSize: 10, rotate: 35, interval: 0 },
        axisLine: { lineStyle: { color: "rgba(255,255,255,0.06)" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        name: "sec",
        nameTextStyle: { color: "#555", fontSize: 10 },
        axisLabel: { color: "#555", fontSize: 10 },
        splitLine: {
          lineStyle: { color: "rgba(255,255,255,0.05)", type: "dashed" },
        },
      },
      series: [
        {
          type: "bar",
          barMaxWidth: 32,
          itemStyle: { borderRadius: [6, 6, 0, 0] },
          cursor: "pointer",
          data: deployments.map((d: any) => ({
            value: d.duration_seconds ?? 0,
            name:
              d.status === 1
                ? "Success"
                : d.status === 2
                  ? "Running"
                  : "Failed",
            itemStyle: {
              color:
                d.status === 1
                  ? "#4ade80"
                  : d.status === 2
                    ? "#facc15"
                    : "#f87171",
            },
          })),
        },
      ],
    }),
    [deployments],
  );

  const donut_option = useMemo(
    () => ({
      backgroundColor: "transparent",
      
      tooltip: {
        trigger: "item",
        backgroundColor: "#1a1a2e",
        borderColor: "rgba(255,255,255,0.08)",
        textStyle: { color: "#e2e2e2", fontSize: 12 },
        formatter: (p: any) =>
          `<div style="font-size:12px;line-height:1.8">
          <span style="color:${p.color}">●</span>
          <b style="margin-left:6px">${p.name}</b>
          <div style="color:#888;margin-top:2px">
            Count: <span style="color:#ccc">${p.value}</span>
            &nbsp;·&nbsp;
            <span style="color:#ccc">${p.percent}%</span>
          </div>
        </div>`,
      },
      legend: {
        bottom: 0,
        icon: "circle",
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: "#666", fontSize: 11 },
        formatter: (name: string) => {
          const item = donut_data.find((d) => d.name === name);
          const total = donut_data.reduce((s, d) => s + d.value, 0);
          const pct =
            item && total ? Math.round((item.value / total) * 100) : 0;
          return `${name}  ${item?.value ?? 0}  (${pct}%)`;
        },
      },
      series: [
        {
          type: "pie",
          radius: ["52%", "75%"],
          center: ["50%", "46%"],
          avoidLabelOverlap: false,
          label: {
            show: true,
            position: "center",
            formatter: () => `{total|${deployments.length}}\n{sub|total}`,
            rich: {
              total: {
                fontSize: 26,
                fontWeight: 700,
                color: "#e2e2e2",
                lineHeight: 32,
              },
              sub: { fontSize: 11, color: "#666", lineHeight: 18 },
            },
          },
          emphasis: {
            label: { show: true },
            itemStyle: {
              shadowBlur: 12,
              shadowOffsetX: 0,
              shadowColor: "rgba(0,0,0,0.4)",
            },
          },
          labelLine: { show: false },
          data: donut_data.map((d) => ({
            value: d.value,
            name: d.name,
            itemStyle: { color: d.color },
          })),
        },
      ],
    }),
    [donut_data, deployments],
  );

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

          <div
            className={`grid gap-3 ${donut_data.length > 0 ? "grid-cols-1 lg:grid-cols-[1fr_300px]" : "grid-cols-1"}`}
          >
            <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--bg-0)] overflow-hidden">
              <ReactECharts
                style={{ height: 300, width: "100%" }}
                option={bar_option}
                onEvents={{
                  click: (params: any) => {
                    const row = deployments[params.dataIndex];
                    if (row?._id) router.push(`/deployments/logs/${row._id}`);
                  },
                }}
              />
            </div>

            {donut_data && donut_data.length > 0 && (
              <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--bg-0)] overflow-hidden">
                <ReactECharts
                  style={{ height: 300, width: "100%" }}
                  option={donut_option}
                />
              </div>
            )}
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
