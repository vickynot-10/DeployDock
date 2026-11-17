import CreateNewService from "./CreateService";

export const metadata = {
  title: "New Service | DeployDock",
  description: "Add a new service to your DeployDock project.",
};

type Props = {
  params: Promise<{
    id: string;
    type: string;
  }>;
};

export default async function ProjectCreateServicesPage({ params }: Props) {
  const { id, type } = await params;

  if (!id || !type) return null;

  return <CreateNewService type={type} id={id} />;
}
