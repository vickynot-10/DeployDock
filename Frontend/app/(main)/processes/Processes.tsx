"use client";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import api from "@/libs/axios";
import Skeleton from "react-loading-skeleton";
import { PiCircleFill, PiArrowClockwise, PiTerminalWindow } from "react-icons/pi";
import AppIconButton from "@/components/ui-elements/AppIconButton";
import TooltipWrapper from "@/helpers/tooltipWrapper";
import { useRouter } from "next/navigation";
const fetchProcessLogs = async () => {
  const res = await api.get("/processes/process-logs");
  return res.data;
};

const formatMemory = (bytes: number) =>
  `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const formatUptime = (timestamp: number) => {
  const s = Math.floor((Date.now() - timestamp) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
};

const columns = ["Name", "Status", "Memory", "CPU", "Restarts", "Uptime" , "Actions"];

export default function ProcessLogsComp() {
    const route =useRouter();

    function Navigate(name : string){
        if(!name) return 

        return route.push(`/processes/${name}`)

    }
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["process-logs"],
    queryFn: fetchProcessLogs,
    refetchOnMount: true,
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const processes: any[] = data?.data ?? [];

  return (
    <div className="rounded-2xl border border-[var(--border-1)] bg-[var(--bg-0)] overflow-hidden">
      <div className="px-5 py-3.5 bg-[var(--bg-2)] border-b border-[var(--border-1)] flex items-center justify-between">
        <p className="text-[13px] font-medium text-[var(--text-2)]">
          PM2 Processes
        </p>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[var(--text-4)]">
            {processes.length} processes
          </span>
          <button
            onClick={() => refetch()}
            className="text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors"
          >
            <PiArrowClockwise
              size={15}
              className={isFetching ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      <table className="min-w-full text-sm">
        <thead className="bg-[var(--bg-2)]">
          <tr>
            {columns.map((h) => (
              <th
                key={h}
                className="px-6 py-3 text-left text-xs font-medium text-[var(--text-3)] whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <tr key={i} className="border-t border-[var(--border-1)]">
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <Skeleton
                      height={14}
                      borderRadius={4}
                      baseColor="var(--bg-2)"
                      highlightColor="var(--bg-3)"
                    />
                  </td>
                ))}
              </tr>
            ))
          ) : processes.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="text-center py-10 text-[var(--text-4)]"
              >
                No processes found
              </td>
            </tr>
          ) : (
            processes.map((p: any, i: number) => (
              <tr
                key={p.id}
                className={`border-t border-[var(--border-1)] ${i % 2 === 0 ? "bg-[var(--bg-0)]" : "bg-[var(--bg-1)]"} hover:bg-[var(--bg-3)] transition-colors`}
              >
                <td className="px-6 py-4 text-[var(--text-2)] font-medium whitespace-nowrap">
                  {p.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium uppercase ${p.status === "online" ? "text-green-400" : "text-red-400"}`}
                  >
                    <PiCircleFill size={7} />
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-[var(--text-3)] font-mono text-xs whitespace-nowrap">
                  {formatMemory(p.memory)}
                </td>
                <td className="px-6 py-4 text-[var(--text-3)] font-mono text-xs whitespace-nowrap">
                  {p.cpu}%
                </td>
                <td className="px-6 py-4 text-[var(--text-3)] whitespace-nowrap">
                  {p.restarts}
                </td>
                <td className="px-6 py-4 text-[var(--text-3)] whitespace-nowrap">
                  {formatUptime(p.uptime)}
                </td>

                <td className="px-6 py-4 text-[var(--text-3)] whitespace-nowrap">
                 <TooltipWrapper content="Process Logs">
                     <AppIconButton  variant="outline" onClick={() => Navigate(p.name)} >
                    <PiTerminalWindow />
                  </AppIconButton>
                 </TooltipWrapper>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
