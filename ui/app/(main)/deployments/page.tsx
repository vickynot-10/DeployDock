import Deployments from "./deployments";

export const metadata = {
  title: "Deployments | DeployDock",
  description: "Browse and manage all deployments across your services.",
};

export default function DeploymentsPage() {
  return <Deployments />;
}
