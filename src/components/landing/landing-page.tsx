/**
 * LandingPage — Server Component.
 *
 * Sections above the fold (Navbar, Hero) are imported statically so they are
 * included in the SSR HTML and paint immediately.
 *
 * Sections below the fold (Features, Screenshots, Pricing, CTASection) are
 * loaded via a client-side lazy loader. Since `next/dynamic` with `ssr: false`
 * cannot be called directly in a Server Component (Next.js 16 Turbopack),
 * we use a `<BelowFoldSections>` client wrapper to handle the dynamic imports.
 *
 * Footer has no client state and is a Server Component.
 */

import React from "react";
import { Navbar } from "./navbar";
import { Hero } from "./hero";
import { Footer } from "./footer";
import { BelowFoldSections } from "./below-fold-sections";

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        {/* Below-fold sections loaded lazily after above-fold content paints */}
        <BelowFoldSections />
      </main>
      <Footer />
    </div>
  );
}
