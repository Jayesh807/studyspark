"use client";

/**
 * BelowFoldSections — client component that lazy-loads all below-fold landing
 * page sections.
 *
 * Why a separate client component?
 * ─────────────────────────────────
 * Next.js 16 (Turbopack) does not allow `next/dynamic` with `ssr: false` to be
 * called from a Server Component. By wrapping the dynamic imports here inside
 * a "use client" boundary, we satisfy that constraint while keeping
 * `landing-page.tsx` itself a Server Component.
 *
 * Performance benefit: The Features, Screenshots, Pricing and CTA section JS
 * is code-split away from the main bundle. These chunks are only requested
 * after the browser has painted the above-fold content (Hero + Navbar), so
 * they never compete with LCP.
 */

import React from "react";
import dynamic from "next/dynamic";

// Each section is a separate chunk — loaded in parallel after first paint
const Features = dynamic(
  () => import("./features").then((m) => ({ default: m.Features })),
  { ssr: false }
);

const Screenshots = dynamic(
  () => import("./screenshots").then((m) => ({ default: m.Screenshots })),
  { ssr: false }
);

const Pricing = dynamic(
  () => import("./pricing").then((m) => ({ default: m.Pricing })),
  { ssr: false }
);

const CTASection = dynamic(
  () => import("./cta-section").then((m) => ({ default: m.CTASection })),
  { ssr: false }
);

export function BelowFoldSections() {
  return (
    <>
      <Features />
      <Screenshots />
      <Pricing />
      <CTASection />
    </>
  );
}
