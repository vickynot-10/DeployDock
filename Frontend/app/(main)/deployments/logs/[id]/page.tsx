import DeploymentLogs from "./deployment-logs";
export default async function DeploymentLogsPage({ params }: any) {
   const { id }  = await params;

  if (!id) {
    return null;
  }
  return <DeploymentLogs id={id} />
}