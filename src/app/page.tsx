import { LandingPage } from "@/components/landing/landing-page";
import { DashboardRedirect } from "@/components/dashboard-redirect";

/**
 * Homepage — renders the full SSR landing page for crawlers and
 * unauthenticated users. Authenticated users see the dashboard
 * overlaid on top via DashboardRedirect.
 *
 * This architecture ensures Google sees 3,000+ words of real
 * server-rendered HTML while preserving the existing SPA dashboard
 * experience for logged-in users.
 */
export default function Home() {
  return (
    <>
      <DashboardRedirect />
      <LandingPage />
    </>
  );
}
