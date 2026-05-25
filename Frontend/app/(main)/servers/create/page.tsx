import AddOrEditServer from "../add-or-edit-server";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Server",
};
export default async function CreateServerPage() {


  return <AddOrEditServer  />;
}