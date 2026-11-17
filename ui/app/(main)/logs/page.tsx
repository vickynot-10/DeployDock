import LogsModule from "./Logs";

export const metadata = {
  title: "Logs | DeployDock",
  description: "View runtime logs for your running services.",
};

export default function LogsPage() {
  return <LogsModule />;
}
