"use client";

import dynamic from "next/dynamic";
import { PageLoader } from "@/components/shared/feedback";

const SubjectsPage = dynamic(
  () => import("@/components/dashboard/pages/subjects").then((m) => m.SubjectsPage),
  { loading: () => <PageLoader /> }
);

export default function SubjectsRoutePage() {
  return <SubjectsPage />;
}
