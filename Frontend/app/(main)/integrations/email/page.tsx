import EmailIntegrationComp from "./email";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email Integration",
};
export default function Account(){
return <EmailIntegrationComp />
}