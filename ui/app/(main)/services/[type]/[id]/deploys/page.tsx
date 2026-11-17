import ViewService from "../../../ViewServices";

export const metadata = {
  title: "Service Deployments | DeployDock",
  description: "View all deployments for this service.",
};

type Props = {
  params: Promise<{
    id: string;
    type: string;
  }>;
};

export default async function ViewServicesPage({ params }: Props) {
  const { id, type } = await params;

  if (!id || !type) return null;

  return <ViewService id={id} type={type} />;
}
