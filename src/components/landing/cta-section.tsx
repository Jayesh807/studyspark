/**
 * CTASection — Server Component (no "use client").
 *
 * Changes:
 * - Removed "use client". The section content is static HTML.
 * - `motion.div` animations replaced with CSS animations:
 *   - Outer section entry: CSS `scroll-reveal` class + Intersection Observer
 *     (or simpler: CSS animation-fill-mode since it's near bottom)
 *   - Two infinite blob animations: replaced with CSS `blob` keyframes
 * - Interactive buttons extracted to `<CTAButtons>` client component.
 *
 * Lighthouse benefit: Framer Motion runtime not pulled in for this section.
 * Infinite JS animation timers on the two blobs are eliminated.
 */

import { Sparkles } from "lucide-react";
import { CTAButtons } from "./cta-buttons";

export function CTASection() {
  return (
    <section className="relative px-4 py-20 sm:py-28" aria-label="Call to action">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600" />

          {/*
           * Animated glow blobs — CSS keyframes instead of Framer Motion.
           * Uses the existing `blob` @keyframes from globals.css with
           * different durations/delays for variation.
           */}
          <div
            className="absolute -left-20 -top-20 size-72 rounded-full bg-white/20 blur-3xl blob"
            style={{ animationDuration: "14s" }}
          />
          <div
            className="absolute -bottom-20 -right-20 size-80 rounded-full bg-fuchsia-300/30 blur-3xl blob"
            style={{ animationDuration: "16s", animationDelay: "-6s" }}
          />

          {/* Decorative grid */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />

          <div className="relative flex flex-col items-center gap-6 px-6 py-16 text-center sm:px-12 sm:py-20">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
              <Sparkles className="size-3.5" />
              Join 10,000+ students today
            </span>

            <h2 className="max-w-2xl text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Ready to transform your study life?
            </h2>

            <p className="max-w-xl text-pretty text-base leading-relaxed text-white/85 sm:text-lg">
              Set up your workspace in under a minute. Free forever, no credit
              card, no friction — just a calmer way to study.
            </p>

            {/* Interactive buttons — client component */}
            <CTAButtons />
          </div>
        </div>
      </div>
    </section>
  );
}
