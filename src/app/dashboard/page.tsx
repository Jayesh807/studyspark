"use client";

import dynamic from "next/dynamic";
import { PageLoader } from "@/components/shared/feedback";

const DashboardHome = dynamic(
  () => import("@/components/dashboard/pages/dashboard-home").then((m) => m.DashboardHome),
  { loading: () => <PageLoader /> }
);

export default function DashboardPage() {
  return <DashboardHome />;
}
