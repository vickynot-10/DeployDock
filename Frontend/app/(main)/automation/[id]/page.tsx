import AddOrEditAutomation from "../add-or-edit-automation";

export default async function EditAutomationPage({ params }: any) {
  const { id }  = await params;

  if (!id) {
    return null;
  }

  return <AddOrEditAutomation id={id} />;
}