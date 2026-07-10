"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
// CommandPalette is now handled inside DashboardShell (dashboard/command-palette.tsx)
// The shared version used Command.Input syntax which is not exported by cmdk — caused Ctrl+K crash
import { PageLoader } from "@/components/shared/feedback";

import { LandingPage } from "@/components/landing/landing-page";
const AuthScreen = dynamic(
  () => import("@/components/auth/auth-screen").then((m) => m.AuthScreen),
  { ssr: false },
);

const DashboardShell = dynamic(
  () =>
    import("@/components/dashboard/dashboard-shell").then(
      (m) => m.DashboardShell,
    ),
  { ssr: false, loading: () => <PageLoader /> },
);

export function ClientShell() {
  const currentView = useAppStore((s) => s.currentView);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const authLoading = useAppStore((s) => s.authLoading);
  const setView = useAppStore((s) => s.setView);
  const { user, handleSessionExpired } = useAuth();
  // Guard: if not authenticated and trying to view a dashboard page, bounce to landing
  useEffect(() => {
    if (!authLoading && !user) {
      if (
        currentView !== "landing" &&
        currentView !== "login" &&
        currentView !== "signup"
      ) {
        setView("landing");
      }
    }
    if (!authLoading && user) {
      if (currentView === "landing" || currentView === "login" || currentView === "signup") {
        setView("dashboard");
      }
    }
  }, [authLoading, user, currentView, setView]);

  // Global listener: when apiFetch detects a 401 on a protected endpoint,
  // it dispatches this event. We log out and redirect to login.
  useEffect(() => {
    const onSessionExpired = () => {
      handleSessionExpired();
    };
    window.addEventListener("studyspark:session-expired", onSessionExpired);
    return () =>
      window.removeEventListener("studyspark:session-expired", onSessionExpired);
  }, [handleSessionExpired]);

  // No blocking spinner — landing/auth pages render immediately while
  // useAuth() resolves /api/auth/me in the background.

  const isAuthView = currentView === "login" || currentView === "signup";
  const isDashboardView =
    user &&
    !isAuthView &&
    currentView !== "landing";

  return (
    <>
      {/* Optional non-blocking auth indicator */}
      {authLoading && (
        <div className="fixed top-0 left-0 right-0 z-[100]">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
            className="h-0.5 origin-left bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500"
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        {isDashboardView ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DashboardShell />
          </motion.div>
        ) : isAuthView ? (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AuthScreen />
          </motion.div>
        ) : (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LandingPage />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
