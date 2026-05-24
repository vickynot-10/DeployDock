import { useQuery } from "@tanstack/react-query";
import api from "@/libs/axios";

interface User {
  id: string;
  email: string;
  name: string;
  provider:string;
  tenant_id:string;
}

export const useMe = () => {
  return useQuery<User>({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return res.data;
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
};