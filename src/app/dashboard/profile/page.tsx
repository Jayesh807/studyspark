"use client";

import dynamic from "next/dynamic";
import { PageLoader } from "@/components/shared/feedback";

const ProfilePage = dynamic(
  () => import("@/components/dashboard/pages/profile").then((m) => m.ProfilePage),
  { loading: () => <PageLoader /> }
);

export default function ProfileRoutePage() {
  return <ProfilePage />;
}
