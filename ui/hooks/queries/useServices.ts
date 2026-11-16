import { GitHubFormValues, DockerFormValues } from "@/types/services.types";
import { api } from "@/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";

const QUERY_KEY = "services";

export function useGetServicebyID(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => {
      const res = await api.get("/services", {
        params: { id },
      });
      return res.data ?? null;
    },
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: true,
  });
}

export function useGetServicebyIDEdit(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, "edit", id],
    queryFn: async () => {
      const res = await api.get("/services/get-service", {
        params: { id },
      });
      return res.data ?? null;
    },
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: true,
  });
}

export function useDeployService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service_id: string) => {
      const res = await api.post("/services/deploy", {
        service_id,
      });
      return res.data ?? null;
    },
    onSuccess: (res, service_id) => {
      if (res?.success) {
        toast.success(res.msg);
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEY, service_id],
        });
      }
    },
  });
}

export function useSaveService() {
  return useMutation({
    mutationFn: async (data: GitHubFormValues | DockerFormValues) => {
      const res = await api.post("/services", data);
      return res.data ?? null;
    },
    onSuccess: (res: any) => {
      if (res?.success) {
        toast.success(res.msg || "Service Saved successfully!");
      }
    },
  });
}

export function useEditService() {
  return useMutation({
    mutationFn: async (data: GitHubFormValues | DockerFormValues) => {
      const res = await api.put("/services", data);
      return res.data ?? null;
    },
    onSuccess: (res: any, vars) => {
      if (res?.success) {
        toast.success(res.msg || "Service Saved successfully!");
      }
    },
  });
}

// enabled = true then send suspend , enabled false then resume
export type ServicesBulkAction = "suspend" | "delete" | "resume";

export function useServicesBulkAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      ids: string[];
      action: ServicesBulkAction;
      project_id: string;
    }) => {
      const res = await api.post("/services/actions", data);
      return res.data ?? null;
    },
    onSuccess: (res: any, vars) => {
      if (res?.success) {
        const fallback =
          vars.action === "delete"
            ? "Services deleted successfully!"
            : "Services suspended successfully!";
        toast.success(res.msg || fallback);
        queryClient.invalidateQueries({
          queryKey: ["projects", "services", vars.project_id],
        });

        vars.ids.forEach((service_id) =>
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEY, service_id],
          }),
        );
      }
    },
  });
}
