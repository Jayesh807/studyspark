"use client";

import dynamic from "next/dynamic";
import { PageLoader } from "@/components/shared/feedback";

const StudySearchPage = dynamic(
  () => import("@/components/dashboard/pages/study-search").then((m) => m.StudySearchPage),
  { loading: () => <PageLoader /> }
);

export default function SparksAIPage() {
  return <StudySearchPage />;
}
