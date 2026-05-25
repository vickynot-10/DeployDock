import ProjectRunTimeLogsComp from "./project-runtime-logs";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "RunTime Logs",
};
export default async function ProjectRunTimeLogsPage({ params }: any) {
 const { id } = await params;
  if (!id) {
    return null;
  }
  return <ProjectRunTimeLogsComp id={id} />;
}
