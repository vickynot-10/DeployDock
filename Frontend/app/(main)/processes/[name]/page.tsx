import SeparateProcessLogsComp from "./ProcessLogs";
export default async function ProjectPMLogsPage({ params }: any) {
  const { name } = await params;
  if (!name) {
    return null;
  }
  return <SeparateProcessLogsComp process_name={name} />
}
