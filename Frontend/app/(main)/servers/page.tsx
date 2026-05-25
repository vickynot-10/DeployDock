import ServerComp from "./ServerComp";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Servers",
};
export default function ServersPage() {
  return <ServerComp />
}