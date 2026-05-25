import Automation from "./automation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Automation",
};
export default function DeploymentPage() {
  return <Automation />
}