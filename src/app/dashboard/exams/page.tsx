"use client";

import dynamic from "next/dynamic";
import { PageLoader } from "@/components/shared/feedback";

const ExamsPage = dynamic(
  () => import("@/components/dashboard/pages/exams").then((m) => m.ExamsPage),
  { loading: () => <PageLoader /> }
);

export default function ExamsRoutePage() {
  return <ExamsPage />;
}
