"use client";

import dynamic from "next/dynamic";
import { PageLoader } from "@/components/shared/feedback";

const FocusTimerPage = dynamic(
  () => import("@/components/dashboard/pages/focus-timer").then((m) => m.FocusTimerPage),
  { loading: () => <PageLoader />, ssr: false }
);

export default function FocusPage() {
  return <FocusTimerPage />;
}
