import { DashboardRedirect } from "@/components/dashboard-redirect";
import { LandingPage } from "@/components/landing/landing-page";

export default function Home() {
  return (
    <>
      <DashboardRedirect />
      <LandingPage />
    </>
  );
}
