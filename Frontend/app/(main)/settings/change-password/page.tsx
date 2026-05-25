import ChangePasswordComp from "./change-password";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Change Password",
};
export default function ChangePassword(){
return <ChangePasswordComp />
}