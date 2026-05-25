import ProcessLogsComp from "./Processes";


import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Processes",
};
export default async function PMLogsPage() {
 
  return <ProcessLogsComp  />
}
