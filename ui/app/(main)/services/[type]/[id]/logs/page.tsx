import ViewDeploylogs from "../../../components/ViewDeployLogs";

type Props = {
  params: Promise<{
    id: string;
    type: string;
  }>;
};

export default async function ViewDeploylogsPage({ params }: Props) {
  const { id, type } = await params;

  if (!id || !type) return null;

  return <ViewDeploylogs id={id} type={type} />;
}
