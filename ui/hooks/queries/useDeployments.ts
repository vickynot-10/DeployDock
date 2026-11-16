import { api } from "@/utils/axios";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

const QUERY_KEY = "deployments";

type DeployParams = {
  page: number;
  limit: number;
  search?: string;
  service_id: string | null;
};

export function useGetDeployments({
  page,
  limit,
  search,
  service_id,
}: DeployParams) {
  return useQuery({
    queryKey: [QUERY_KEY, page, limit, search, service_id],
    queryFn: async () => {
      const res = await api.get("/deployments/table", {
        params: { page, limit, search, service_id },
      });
      return res.data ?? null;
    },
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  });
}
