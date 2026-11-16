import { FormValues } from "@/types/project.types";
import { api } from "@/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const QUERY_KEY = "projects";

export function useGetProjects() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const res = await api.get("/projects");
      return res.data ?? null;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useGetProjectServices(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, "services", id],
    queryFn: async () => {
      const res = await api.get("/projects/services", {
        params: { id },
      });
      return res.data ?? null;
    },
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: true,
  });
}

export function useSaveProjects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await api.post("/projects", data);
      return res.data ?? null;
    },
    onSuccess: (res: any) => {
      if (res?.success) {
        toast.success(res.msg || "Project saved successfully!");
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      }
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/projects/${id}`);
      return res.data ?? null;
    },
    onSuccess: (res: any) => {
      if (res?.success) {
        toast.success(res.msg || "Project deleted successfully!");
        queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      }
    },
  });
}
