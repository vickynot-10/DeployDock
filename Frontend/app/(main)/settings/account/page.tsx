import AccountComp from "./account";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Profile",
};
export default function Account(){
return <AccountComp />
}