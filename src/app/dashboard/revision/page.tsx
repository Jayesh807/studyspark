"use client";

import dynamic from "next/dynamic";
import { PageLoader } from "@/components/shared/feedback";

const RevisionPlanPage = dynamic(
  () => import("@/components/dashboard/pages/revision-plan").then((m) => m.RevisionPlanPage),
  { loading: () => <PageLoader /> }
);

export default function RevisionRoutePage() {
  return <RevisionPlanPage />;
}
