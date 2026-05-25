import AddOrEditAutomation from "../add-or-edit-automation";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Automation",
};

export default async function EditAutomationPage({ params }: any) {
  const { id }  = await params;

  if (!id) {
    return null;
  }

  

  return <AddOrEditAutomation id={id} />;
}