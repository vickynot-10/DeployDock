import Project from "./project";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
};
export default function ProjectPage() {
  return <Project />
}