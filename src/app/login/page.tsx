import { Metadata } from "next";
import { Suspense } from "react";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  title: "Login | StudySpark",
  description: "Sign in to your StudySpark account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthScreen initialMode="login" />
    </Suspense>
  );
}
