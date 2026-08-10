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
import { useRouter } from "next/navigation";

export function DashboardRedirect() {
  const router = useRouter();
  const { user, handleSessionExpired } = useAuth();
  const authLoading = useAppStore((s) => s.authLoading);
  const setView = useAppStore((s) => s.setView);
  const [showDashboard, setShowDashboard] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      setView("dashboard");
      router.replace("/dashboard");
    }
  }, [authLoading, user, setView, router]);

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

  const isNavigatingToDashboard = authLoading || (user && !showDashboard);

  return (
    <>
      {/* Top Progress Loading Line & Glass Redirect Badge */}
      {isNavigatingToDashboard && (
        <div className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none select-none">
          <div className="h-1 w-full bg-slate-900/60 overflow-hidden relative">
            <div className="h-full w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 shadow-[0_0_12px_rgba(52,211,153,0.9)] animate-pulse" />
          </div>
          {user && (
            <div className="flex justify-center pt-3">
              <div className="bg-slate-900/90 backdrop-blur-xl border border-emerald-500/40 text-emerald-300 px-4 py-1.5 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Welcome back! Navigating to Dashboard...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {showDashboard && (
        <div className="fixed inset-0 z-[100] bg-background">
          <DashboardShell />
        </div>
      )}
    </>
  );
}
