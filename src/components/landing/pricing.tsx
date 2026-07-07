/**
 * Pricing — Server Component (no "use client").
 *
 * Changes:
 * - Removed "use client" so this section server-renders.
 * - `motion.li` items with `whileInView` replaced with CSS stagger animation
 *   using `animation-delay` — zero Framer Motion JS needed for this section.
 * - CTA button extracted to `<PricingCTA>` (client component) — the only
 *   interactive element here.
 * - `useAppStore` call removed from this file.
 *
 * Lighthouse benefit: Framer Motion runtime not needed for pricing section.
 * The CSS stagger animates using `@keyframes` on the compositor thread.
 */

import { Check, Sparkles } from "lucide-react";
import { SectionHeading } from "./section-heading";
import { PricingCTA } from "./pricing-cta";

const INCLUDED = [
  "Unlimited tasks, subjects & events",
  "Full analytics dashboard with charts",
  "Focus timer with subject tagging",
  "Exam tracker with countdowns",
  "Calendar with month view",
  "Beautiful light & dark themes",
  "Local-first storage — your data stays yours",
  "No credit card, no ads, no nag screens",
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="relative scroll-mt-24 px-4 py-20 sm:py-28"
      aria-label="Pricing"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Pricing"
          title="Free today,"
          highlight="free forever"
          description="StudySpark is built by students, for students. The full experience is — and will remain — free. A premium Pro tier is on the way for power users."
        />

        <div className="shimmer-border relative w-full overflow-hidden rounded-3xl p-8 sm:p-10 glass">
          {/* Decorative gradient */}
          <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-linear-to-br from-violet-500/20 to-fuchsia-500/10 blur-3xl" />

          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-linear-to-br from-violet-500 to-fuchsia-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md">
                <Sparkles className="size-3.5" />
                Free
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className="glow-dot inline-block h-1.5 w-1.5 rounded-full bg-violet-500" />
                Forever
              </span>
            </div>

            <div className="mt-6 flex items-end gap-1">
              <span className="text-5xl font-bold tracking-tight">$0</span>
              <span className="mb-1.5 text-sm text-muted-foreground">/month</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Everything you need to organize your studies, today.
            </p>

            {/* Interactive CTA — client component */}
            <PricingCTA />

            <ul className="mt-8 space-y-3">
              {INCLUDED.map((feat, i) => (
                <li
                  key={feat}
                  className="flex items-start gap-3 opacity-0"
                  style={{
                    animation: "statPillIn 0.4s ease-out both",
                    animationDelay: `${i * 0.05}s`,
                  }}
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-fuchsia-500 text-white">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  <span className="text-sm text-foreground/90">{feat}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-2xl border border-dashed border-violet-500/20 bg-violet-500/5 px-4 py-3 text-center text-xs text-muted-foreground">
              <Sparkles className="mr-1 inline size-3.5 text-violet-500" />
              Pro tier coming soon — AI study plans, sync & collaboration.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
