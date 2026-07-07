import { Metadata } from "next";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your StudySpark account.",
};

export default function SignupPage() {
  return <AuthScreen initialMode="signup" />;
}
