import { GitHubFormValues, DockerFormValues } from "@/types/services.types";
import { api } from "@/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const QUERY_KEY = "deploy-logs";

export function useGetDeployLogsByID(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      const res = await api.get("/deployments", {
        params: { id },
      });
      return res.data ?? null;
    },
    enabled: !!id,
    staleTime: Infinity,
  });
}

export function useRollbackDeploy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { deployment_id: string; service_id: string }) => {
      const res = await api.post("/deployments/rollback", data);
      return res.data ?? null;
    },
    onSuccess: (res, vars) => {
      if (res?.success) {
        toast.success(res.msg);

        queryClient.invalidateQueries({
          queryKey: ["services", vars.service_id],
        });
      }
    },
  });
}
