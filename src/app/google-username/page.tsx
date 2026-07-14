import type { Metadata } from "next";
import { GoogleUsernameScreen } from "@/components/auth/google-username-screen";

export const metadata: Metadata = {
  title: "Create Username | StudySpark",
  description: "Choose a StudySpark username for your Google account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function GoogleUsernamePage() {
  return <GoogleUsernameScreen />;
}
