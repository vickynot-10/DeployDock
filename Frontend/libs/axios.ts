import axios from "axios";
import { toast } from "react-toastify";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_API || "http://localhost:3001";

const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.msg ||
      error.response?.data?.message ||
      "Something went wrong";


    toast.error(message);

    return Promise.reject(error);
  },
);

export default api;
