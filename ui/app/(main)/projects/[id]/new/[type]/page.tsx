import CreateNewService from "./CreateService";

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
