import { Metadata } from "next";
import { Suspense } from "react";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  title: "Sign Up | StudySpark",
  description: "Create your StudySpark account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <AuthScreen initialMode="signup" />
    </Suspense>
  );
}
