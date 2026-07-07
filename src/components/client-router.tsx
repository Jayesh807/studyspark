"use client";

/**
 * ClientRouter — loaded with `next/dynamic` + `ssr: false` so it never blocks
 * the server render of the landing page. Once mounted on the client, it reads
 * auth state and swaps the visible view (landing → dashboard or auth screens).
 *
 * Why this pattern?
 * - The root page.tsx can be a Server Component, which lets Next.js stream the
 *   landing page HTML immediately — fixing the 3580ms LCP delay.
 * - Auth-aware routing still works exactly as before; it just happens *after*
 *   the first paint instead of *blocking* it.
 */

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { LandingPage } from "@/components/landing/landing-page";
import { AuthScreen } from "@/components/auth/auth-screen";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PageLoader } from "@/components/shared/feedback";

const fadeVariant = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 },
};

export default function ClientRouter() {
  const { currentView, isAuthenticated, authLoading, setView } = useAppStore();
  const { user, handleSessionExpired } = useAuth();
  const mountedRef = useRef(false);

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
      if (
        currentView === "landing" ||
        currentView === "login" ||
        currentView === "signup"
      ) {
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

  // Track mounting so we know when the client shell has taken over
  useEffect(() => {
    mountedRef.current = true;
  }, []);

  // While auth is loading, show the spinner overlay (landing page is already
  // visible underneath as static HTML, so this is just a brief overlay)
  if (authLoading) {
    return (
      <div className="fixed inset-0 z-[999] flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/30"
          >
            <svg
              className="h-7 w-7 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" />
            </svg>
          </motion.div>
          <p className="text-sm font-medium text-muted-foreground">
            Loading StudySpark…
          </p>
        </motion.div>
      </div>
    );
  }

  const isAuthView = currentView === "login" || currentView === "signup";
  const isDashboardView = user && !isAuthView && currentView !== "landing";

  // If landing: ClientRouter renders nothing (the SSR landing page is already
  // visible from the Server Component in page.tsx)
  if (!isAuthView && !isDashboardView) {
    return null;
  }

  // For auth/dashboard views, overlay on top of (or replace) the static landing HTML
  return (
    <div className="fixed inset-0 z-[998] bg-background">
      <AnimatePresence mode="wait">
        {isDashboardView ? (
          <motion.div
            key="dashboard"
            {...fadeVariant}
          >
            <DashboardShell />
          </motion.div>
        ) : (
          <motion.div
            key="auth"
            {...fadeVariant}
          >
            <AuthScreen />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
