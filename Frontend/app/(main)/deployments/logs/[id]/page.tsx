import DeploymentLogs from "./deployment-logs";


import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deployment Logs",
};

export default async function DeploymentLogsPage({ params }: any) {
   const { id }  = await params;

  if (!id) {
    return null;
  }
  return <DeploymentLogs id={id} />
}