import EditService from "./Editservice";

export const metadata = {
  title: "Edit Service | DeployDock",
  description: "Edit the configuration of your DeployDock service.",
};

type Props = {
  params: Promise<{
    id: string;
    service_id: string;
  }>;
};

export default async function EditProjectServicesPage({ params }: Props) {
  const { id, service_id } = await params;

  if (!id || !service_id) return null;

  return <EditService service_id={service_id} id={id} />;
}
