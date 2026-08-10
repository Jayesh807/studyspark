"use client";

import dynamic from "next/dynamic";
import { PageLoader } from "@/components/shared/feedback";

const TypingChallengePage = dynamic(
  () => import("@/components/dashboard/pages/typing-challenge").then((m) => m.TypingChallengePage),
  { loading: () => <PageLoader />, ssr: false }
);

export default function TypingRoutePage() {
  return <TypingChallengePage />;
}
