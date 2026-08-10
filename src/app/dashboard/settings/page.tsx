"use client";

import dynamic from "next/dynamic";
import { PageLoader } from "@/components/shared/feedback";

const SettingsPage = dynamic(
  () => import("@/components/dashboard/pages/settings").then((m) => m.SettingsPage),
  { loading: () => <PageLoader /> }
);

export default function SettingsRoutePage() {
  return <SettingsPage />;
}
