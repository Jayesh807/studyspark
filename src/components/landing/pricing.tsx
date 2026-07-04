"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "./section-heading";
import { useAppStore } from "@/lib/store";

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
  const setView = useAppStore((s) => s.setView);

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

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-14 flex max-w-md justify-center"
        >
          <div className="shimmer-border relative w-full overflow-hidden rounded-3xl p-8 sm:p-10 glass">
            {/* Decorative gradient */}
            <div className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md">
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
                <span className="mb-1.5 text-sm text-muted-foreground">
                  /month
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Everything you need to organize your studies, today.
              </p>

              <Button
                size="lg"
                onClick={() => setView("signup")}
                className="mt-6 h-12 w-full rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-base font-semibold text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/45 hover:brightness-110"
              >
                Get started free
                <ArrowRight className="size-4" />
              </Button>

              <ul className="mt-8 space-y-3">
                {INCLUDED.map((feat, i) => (
                  <motion.li
                    key={feat}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.04 }}
                    className="flex items-start gap-3"
                  >
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
                      <Check className="size-3.5" strokeWidth={3} />
                    </span>
                    <span className="text-sm text-foreground/90">{feat}</span>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-8 rounded-2xl border border-dashed border-violet-500/20 bg-violet-500/5 px-4 py-3 text-center text-xs text-muted-foreground">
                <Sparkles className="mr-1 inline size-3.5 text-violet-500" />
                Pro tier coming soon — AI study plans, sync & collaboration.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
