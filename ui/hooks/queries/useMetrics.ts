import { api } from "@/utils/axios";
import { useQuery } from "@tanstack/react-query";

export type ServiceMetric = {
  service_id: string;
  service_name: string;
  cpu_percent: number;
  memory_bytes: number;
  memory_limit: number;
  rx_bytes: number;
  tx_bytes: number;
  started_at: string | null;
  restart_count: number;
};

export type DeploymentDate = {
  deployment_date: string;
  count: string | number;
};

export type MetricsResponse = {
  deployments: {
    total_deployments: number;
    failed: number;
    queued: number;
    running: number;
    cancelled: number;
    stopped: number;
    superseded: number;
    suspended: number;
    avg_duration_seconds: string | null;
  };
  containers: ServiceMetric[];
  deploymentsOverDays: DeploymentDate[];
};

export function useGetMetrics(service_id: string | null) {
  return useQuery({
    queryKey: ["metrics", service_id],
    queryFn: async () => {
      const res = await api.get("/metrics", { params: { service_id } });
      return (res.data?.data ?? null) as MetricsResponse | null;
    },
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}
