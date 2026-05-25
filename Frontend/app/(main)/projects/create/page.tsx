import AddOrEditProject from "../add-or-edit-project";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Project",
};
export default async function CreateProjectPage() {


  return <AddOrEditProject  />;
}