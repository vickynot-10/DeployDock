import Deployment from "./deployment";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deployments",
};
export default function DeploymentPage() {
  return <Deployment />
}