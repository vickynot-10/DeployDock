import MetricsModule from "./Metrics";

export const metadata = {
  title: "Metrics | DeployDock",
  description: "Monitor CPU, memory, and network usage for your containers.",
};

export default function MetricsPage() {
  return <MetricsModule />;
}
