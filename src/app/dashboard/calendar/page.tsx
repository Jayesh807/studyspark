"use client";

import dynamic from "next/dynamic";
import { PageLoader } from "@/components/shared/feedback";

const CalendarPage = dynamic(
  () => import("@/components/dashboard/pages/calendar").then((m) => m.CalendarPage),
  { loading: () => <PageLoader /> }
);

export default function CalendarRoutePage() {
  return <CalendarPage />;
}
