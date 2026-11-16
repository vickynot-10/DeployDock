import ProjectServices from "../components/ProjectServices";

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
