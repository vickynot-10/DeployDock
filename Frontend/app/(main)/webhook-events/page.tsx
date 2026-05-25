import WebhookLogsComp from "./webhook-events";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Webhook Events",
};
export default function WebhookLogsPage() {
  return <WebhookLogsComp />;
}
