import AddOrEditServer from "../../add-or-edit-server";

export default async function EditServerPage({ params }: any) {
  const { id }  = await params;

  if (!id) {
    return null;
  }

  return <AddOrEditServer id={id} />;
}