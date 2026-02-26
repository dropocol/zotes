import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jobs",
  description: "Track your job search progress",
};

export default function JobsPage() {
  redirect("/jobs/list");
}
