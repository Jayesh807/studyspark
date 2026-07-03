"use client";

import { PageTransition } from "@/components/shared/motion";
import { AuthLeftPanel } from "@/components/auth/auth-left-panel";
import { AuthForm } from "@/components/auth/auth-form";

/**
 * Split-screen authentication page.
 * Left (lg+): branded visual panel with gradient, blobs, tagline, benefits & a
 * floating mock stat card.
 * Right: a centered glass card with a segmented Login / Sign Up toggle and the
 * corresponding form.
 *
 * Mode is driven by `useAppStore.currentView` ("login" | "signup"); navigation
 * happens via `setView`. The `useAuth` hook auto-navigates to dashboard on
 * success.
 */
export function AuthScreen() {
  return (
    <PageTransition className="min-h-screen w-full">
      <div className="grid min-h-screen w-full lg:grid-cols-2">
        {/* Left visual panel (hidden on mobile) */}
        <AuthLeftPanel />

        {/* Right form panel */}
        <div className="relative flex items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          {/* Soft radial backdrop for depth */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_30%,rgba(167,139,250,0.12),transparent_55%)]"
          />
          <AuthForm />
        </div>
      </div>
    </PageTransition>
  );
}
