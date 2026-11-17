import ProjectServices from "../components/ProjectServices";

export const metadata = {
  title: "Project | DeployDock",
  description: "View and manage services within your project.",
};

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectServicesPage({ params }: Props) {
  const { id } = await params;

  if (!id) return null;

  return <ProjectServices id={id} />;
}
