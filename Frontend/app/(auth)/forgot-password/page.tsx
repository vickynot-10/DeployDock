import ForgotPassword from "./forget-password";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forgot Password",
};
export default function SignUpPage(){
    return <ForgotPassword />
}