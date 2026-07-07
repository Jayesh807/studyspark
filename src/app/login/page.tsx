import { Metadata } from "next";
import { AuthScreen } from "@/components/auth/auth-screen";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your StudySpark account.",
};

export default function LoginPage() {
  return <AuthScreen initialMode="login" />;
}
