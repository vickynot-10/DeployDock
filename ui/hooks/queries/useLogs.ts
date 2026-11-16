import { api } from "@/utils/axios";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

export const LOGS_QUERY_KEY = "logs";

export type LogLine = {
  log_id: string;
  ts: string;
  service_id: string;
  service_name: string;
  message: string;
  stream: string;
};

export type LogPage = {
  rows: LogLine[];
  has_more: boolean;
  next_cursor: string | null;
};

type LogParams = {
  limit: number;
  search?: string;
  service_id: string | null;
};

export function useGetLogs({ limit, search, service_id }: LogParams) {
  return useInfiniteQuery({
    queryKey: [LOGS_QUERY_KEY, limit, search, service_id],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      const res = await api.get("/logs", {
        params: { limit, search, service_id, before: pageParam },
      });
      return res.data?.data as LogPage;
    },
    getNextPageParam: (lastPage) =>
      lastPage?.has_more ? lastPage.next_cursor : undefined,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
