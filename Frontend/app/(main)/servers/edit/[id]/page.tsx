import AddOrEditServer from "../../add-or-edit-server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Server",
};
export default async function EditServerPage({ params }: any) {
  const { id }  = await params;

  if (!id) {
    return null;
  }

  return <AddOrEditServer id={id} />;
}