"use client";

import dynamic from "next/dynamic";
import { PageLoader } from "@/components/shared/feedback";

const PlannerPage = dynamic(
  () => import("@/components/dashboard/pages/planner").then((m) => m.PlannerPage),
  { loading: () => <PageLoader /> }
);

export default function PlannerRoutePage() {
  return <PlannerPage />;
}
