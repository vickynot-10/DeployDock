import { api } from "@/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const QUERY_KEY = "settings";

export type SettingsResponse = {
  account: {
    id: string;
    email: string;
    name: string | null;
    created_on: string;
  };
  github: {
    connected: boolean;
    valid: boolean;
    login: string | null;
    avatar_url: string | null;
    scopes: string[];
  };
  platform: {
    public_api_url: string | null;
    webhook_ready: boolean;
    services: { total: number; auto_deploy: number; webhooks: number };
  };
};

export function useGetSettings() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const res = await api.get("/settings");
      return (res.data?.data ?? null) as SettingsResponse | null;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useDisconnectGithub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post("/settings/github/disconnect");
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useResyncWebhooks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.post("/settings/webhooks/resync");
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
