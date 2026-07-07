/**
 * Root page — Server Component.
 *
 * Why no "use client" here?
 * ─────────────────────────
 * The landing page is 100% static HTML and can be server-rendered immediately.
 * Previously this file was "use client" which caused Next.js to skip SSR and
 * ship a blank page to the browser, waiting for React hydration + Zustand auth
 * state before any content was painted. That caused the 3580ms LCP delay.
 *
 * Now:
 *  1. `<LandingPage />` is rendered on the server → HTML arrives in the first
 *     response, LCP text is immediately visible.
 *  2. `<ClientRouterLoader />` is a thin "use client" wrapper that dynamically
 *     loads the auth/routing shell with `ssr: false`. This ensures auth JS
 *     never blocks the first paint.
 *
 * Note: `next/dynamic` with `ssr: false` cannot be used directly in a Server
 * Component (Next.js 16 Turbopack restriction). ClientRouterLoader provides
 * the required Client Component boundary.
 */

import { LandingPage } from "@/components/landing/landing-page";
import { ClientRouterLoader } from "@/components/client-router-loader";

export default function Home() {
  return (
    <>
      {/* Server-rendered landing page — visible on first paint, no JS required */}
      <LandingPage />
      {/* Client-only auth router — takes over when auth state is known */}
      <ClientRouterLoader />
    </>
  );
}
