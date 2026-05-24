import AddOrEditProject from "../../add-or-edit-project";

export default async function EditProjectPage({ params }: any) {
  const { id } = await params;
  if (!id) {
    return null;
  }

  return <AddOrEditProject id={id} />;
}
