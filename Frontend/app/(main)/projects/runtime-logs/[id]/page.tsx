import ProjectRunTimeLogsComp from "./project-runtime-logs";
export default async function ProjectRunTimeLogsPage({ params }: any) {
 const { id } = await params;
  if (!id) {
    return null;
  }
  return <ProjectRunTimeLogsComp id={id} />;
}
