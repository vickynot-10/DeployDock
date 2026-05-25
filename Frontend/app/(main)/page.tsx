import DashboardComp from "./dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};
export default function DashboardPage() {
  return <DashboardComp />
}