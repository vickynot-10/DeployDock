import { api } from "@/utils/axios";
import { useQuery } from "@tanstack/react-query";

export function useGetServices() {
  return useQuery({
    queryKey: ["services-list"],
    queryFn: async () => {
      const res = await api.get("/services/list");
      return res.data ?? null;
    },
    staleTime: Infinity,
  });
}
