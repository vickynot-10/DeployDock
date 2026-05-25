import AddOrEditProject from "../../add-or-edit-project";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Project",
};

export default async function EditProjectPage({ params }: any) {
  const { id } = await params;
  if (!id) {
    return null;
  }

  return <AddOrEditProject id={id} />;
}
