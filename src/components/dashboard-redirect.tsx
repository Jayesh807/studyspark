"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAppStore } from "@/lib/store";
import dynamic from "next/dynamic";
import { PageLoader } from "@/components/shared/feedback";

const DashboardShell = dynamic(
  () =>
    import("@/components/dashboard/dashboard-shell").then(
      (m) => m.DashboardShell,
    ),
  { ssr: false, loading: () => <PageLoader /> },
);

/**
 * DashboardRedirect — overlays the SSR landing page with the
 * dashboard shell when the user is authenticated.
 *
 * The landing page still renders underneath (for SSR / Google),
 * but authenticated users immediately see their dashboard.
 * This preserves the existing SPA dashboard architecture while
 * ensuring the public homepage is fully server-rendered.
 */
export function DashboardRedirect() {
  const { user, handleSessionExpired } = useAuth();
  const authLoading = useAppStore((s) => s.authLoading);
  const setView = useAppStore((s) => s.setView);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      setView("dashboard");
      setShowDashboard(true);
    }
  }, [authLoading, user, setView]);

  useEffect(() => {
    if (!showDashboard) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [showDashboard]);

  // Global listener: when apiFetch detects a 401 on a protected endpoint,
  // it dispatches this event. We log out and redirect to login.
  useEffect(() => {
    const onSessionExpired = () => {
      handleSessionExpired();
      setShowDashboard(false);
    };
    window.addEventListener("studyspark:session-expired", onSessionExpired);
    return () =>
      window.removeEventListener("studyspark:session-expired", onSessionExpired);
  }, [handleSessionExpired]);

  if (!showDashboard) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background">
      <DashboardShell />
    </div>
  );
}
