import { FormValues } from "@/types/project.types";
import { api } from "@/utils/axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const QUERY_KEY = "github";

export function useGetUserRepos() {
  return useQuery({
    queryKey: [QUERY_KEY + "repos"],
    queryFn: async () => {
      const res = await api.get("/github/repos");
      return res.data ?? null;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useGetUserBranch(owner: string, repo: string) {
  return useQuery({
    queryKey: [QUERY_KEY + "branch", owner, repo],
    queryFn: async () => {
      const res = await api.get("/github/branch", { params: { owner, repo } });
      return res.data ?? null;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!owner && !!repo,
  });
}

export function useGetRepoTree(owner: string, repo: string, branch: string) {
  return useQuery({
    queryKey: [QUERY_KEY + "tree", owner, repo, branch],
    queryFn: async () => {
      const res = await api.get("/github/tree", {
        params: { owner, repo, branch },
      });
      return res.data ?? null;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!owner && !!repo && !!branch,
  });
}

export function useGetDetect(
  owner: string,
  repo: string,
  branch: string,
  rootDirectory: string,
) {
  return useQuery({
    queryKey: [QUERY_KEY + "detect", owner, repo, branch, rootDirectory],
    queryFn: async () => {
      const res = await api.get("/github/detect", {
        params: { owner, repo, branch, root_directory: rootDirectory },
      });
      return res.data ?? null;
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!owner && !!repo && !!branch && !!rootDirectory,
  });
}
