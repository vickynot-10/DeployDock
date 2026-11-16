import axios from "axios";
import { toast } from "sonner";
import { SignOut } from "@/hooks/queries/useAuth";
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + "/api",
  withCredentials: true,
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => {
    if (
      response.data?.msg &&
      response.status === 202 &&
      response.data.info === true
    ) {
      toast.info(response.data.msg);
    }

    return response;
  },
  async (error) => {
    const message =
      error.response?.data?.msg ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";

    toast.error(message);

    if (error.response?.status === 401) {
      try {
        await SignOut();
        window.location.href = "/sign-in";
      } catch (e) {
        window.location.href = "/sign-in";
      }
    }

    return Promise.reject(error);
  },
);
