"use client";

import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { getSocket } from "@/utils/socket";

export type LiveLogLine = { stream: string; line: string; ts: string };

export function useDeployLogsSocket(
  deployment_id: string,
  setLogs: Dispatch<SetStateAction<LiveLogLine[]>>,
) {
  useEffect(() => {
    if (!deployment_id) return;
    const socket = getSocket();

    function joinDeployRoom() {
      socket.emit("join_deployment", deployment_id);
    }

    function handleLogs(lines: LiveLogLine[]) {
      setLogs((prev) => [...prev, ...lines]);
    }

    socket.on("connect", joinDeployRoom);
    socket.on("deploy_logs", handleLogs);

    if (socket.connected) joinDeployRoom();
    else socket.connect();

    return function () {
      socket.emit("leave", `deployment:${deployment_id}`);
      socket.off("connect", joinDeployRoom);
      socket.off("deploy_logs", handleLogs);
    };
  }, [deployment_id, setLogs]);
}
