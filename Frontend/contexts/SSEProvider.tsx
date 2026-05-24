"use client";

import { createContext, useContext, useEffect, useRef } from "react";
import { toast } from "react-toastify";
const SSEContext = createContext<{
  subscribe: (cb: (e: any) => void) => () => void;
} | null>(null);

export function SSEProvider({ children }: { children: React.ReactNode }) {
  const BASE_API = process.env.NEXT_PUBLIC_BASE_API || "http://localhost:3001";

  const listeners_ref = useRef<Set<(e: any) => void>>(new Set());

  useEffect(() => {
    const es = new EventSource(`${BASE_API}/events`, { withCredentials: true });

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      const prefix = data.project_name ? `[${data.project_name}] ` : "";

      if (data.type === "status" && data.status === "success")
        // toast.success(`${prefix}${data.message}`);
      if (data.type === "status" && data.status === "failed")
        toast.error(`${prefix}${data.message}`);

      listeners_ref.current.forEach((cb) => cb(data));
    };

    return () => es.close();
  }, []);

  function subscribe(cb: (e: any) => void) {
    listeners_ref.current.add(cb);
    return () => listeners_ref.current.delete(cb);
  }

  return (
    <SSEContext.Provider value={{ subscribe }}>{children}</SSEContext.Provider>
  );
}

export const useSSE = () => {
  const ctx = useContext(SSEContext);
  if (!ctx) throw new Error("useSSE must be inside SSEProvider");
  return ctx;
};
