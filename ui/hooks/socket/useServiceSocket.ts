"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/utils/socket";

type StatusPayload = { deployment_id: string; status: number };

export function useServiceStatusSocket(service_id: string) {
  const queryClient = useQueryClient();

  useEffect(
    function () {
      const socket = getSocket();
      const queryKey = ["service", service_id];

      function joinServiceRoom() {
        socket.emit("join_service", service_id);
      }

      function handleStatus(payload: StatusPayload) {
        let found = false;

        queryClient.setQueryData(queryKey, function (old: any) {
          const list = old?.data?.deployments;
          if (!list) return old;
          return {
            ...old,
            data: {
              ...old.data,
              deployments: list.map(function (item: any) {
                if (item.id !== payload.deployment_id) return item;
                found = true;
                return { ...item, status: payload.status };
              }),
            },
          };
        });

        if (!found) queryClient.invalidateQueries({ queryKey });
      }

      socket.on("connect", joinServiceRoom);
      socket.on("deployment_status", handleStatus);

      if (socket.connected) joinServiceRoom();
      else socket.connect();

      return function () {
        socket.emit("leave", `service:${service_id}`);
        socket.off("connect", joinServiceRoom);
        socket.off("deployment_status", handleStatus);
      };
    },
    [service_id, queryClient],
  );
}
