"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "./section-heading";

const INCLUDED = [
  "Tasks, subjects, and calendar events",
  "Analytics dashboard with charts",
  "Focus timer with subject tagging",
  "Exam tracker with countdowns",
  "Calendar with month view",
  "Light and dark themes",
  "Local-first planning data",
  "No credit card required to start",
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="relative scroll-mt-24 px-4 py-16 sm:py-20"
      aria-label="Current plan"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Current Plan"
          title="Core study tools,"
          highlight="currently free"
          description="StudySpark's core workspace is available without a credit card. Pricing and feature availability may change as the product develops."
        />

        <div className="shimmer-border relative mx-auto mt-4 w-full max-w-4xl overflow-hidden rounded-3xl p-6 sm:p-8 glass">
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 rounded-full bg-linear-to-br from-violet-500 to-fuchsia-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md">
                <Sparkles className="size-3.5" />
                Free core
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className="glow-dot inline-block h-1.5 w-1.5 rounded-full bg-violet-500" />
                Current access
              </span>
            </div>

            <div className="mt-5 flex items-end gap-1">
              <span className="text-5xl font-bold tracking-tight">$0</span>
              <span className="mb-1.5 text-sm text-muted-foreground">
                /month for core tools
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Practical planning and focus tools for students getting organized.
            </p>

            <Button
              size="lg"
              asChild
              className="mt-5 h-11 w-full rounded-xl bg-linear-to-br from-violet-500 to-fuchsia-500 text-base font-semibold text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/45 hover:brightness-110"
            >
              <Link href="/signup">
                Get started free
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>

            <ul className="mt-6 space-y-2.5">
              {INCLUDED.map((feat, i) => (
                <m.li
                  key={feat}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-fuchsia-500 text-white">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                  <span className="text-sm text-foreground/90">{feat}</span>
                </m.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
