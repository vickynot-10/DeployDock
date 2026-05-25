import SeparateProcessLogsComp from "./ProcessLogs";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Process Logs",
};
export default async function ProjectPMLogsPage({ params }: any) {
  const { name } = await params;
  if (!name) {
    return null;
  }
  return <SeparateProcessLogsComp process_name={name} />
}
