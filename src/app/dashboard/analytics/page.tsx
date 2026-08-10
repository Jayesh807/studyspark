"use client";

import dynamic from "next/dynamic";
import { PageLoader } from "@/components/shared/feedback";

const AnalyticsPage = dynamic(
  () => import("@/components/dashboard/pages/analytics").then((m) => m.AnalyticsPage),
  { loading: () => <PageLoader />, ssr: false }
);

export default function AnalyticsRoutePage() {
  return <AnalyticsPage />;
}
