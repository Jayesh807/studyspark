"use client";

import { m } from "framer-motion";
import { UserPlus, BookOpen, Rocket } from "lucide-react";
import { SectionHeading } from "./section-heading";

const STEPS = [
  {
    step: 1,
    icon: UserPlus,
    title: "Create Your Free Account",
    description:
      "Sign up in under thirty seconds with just your name and email. No credit card required, no lengthy onboarding — you're in your workspace immediately.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    step: 2,
    icon: BookOpen,
    title: "Set Up Your Subjects & Goals",
    description:
      "Add your current semester subjects, upcoming exams, and study goals. StudySpark organizes everything into a clear, color-coded workspace that matches your academic schedule.",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    step: 3,
    icon: Rocket,
    title: "Start Planning, Focusing & Tracking",
    description:
      "Create tasks, schedule study sessions with the Pomodoro timer, and watch your analytics build over time. Within a week, you'll have a clear picture of your study habits and real momentum.",
    gradient: "from-emerald-500 to-teal-500",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-24 px-4 py-16 sm:py-24"
      aria-label="How it works"
    >
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          eyebrow="Getting Started"
          title="Get Started in"
          highlight="3 Simple Steps"
          description="From zero to a fully organized study workspace in under five minutes. Here's how easy it is to begin."
        />

        <div className="relative mt-14">
          {/* Connecting line */}
          <div
            className="absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-violet-500/40 via-fuchsia-500/30 to-emerald-500/40 sm:block"
            aria-hidden="true"
          />

          <div className="flex flex-col gap-8 sm:gap-12">
            {STEPS.map((step, i) => (
              <m.div
                key={step.step}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.55,
                  ease: [0.22, 1, 0.36, 1],
                  delay: i * 0.1,
                }}
                className="relative flex gap-5 sm:gap-8"
              >
                {/* Step number */}
                <div
                  className={`relative z-10 flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${step.gradient} text-white shadow-lg`}
                >
                  <step.icon className="size-6" />
                </div>

                {/* Content */}
                <div className="flex-1 pb-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300">
                    Step {step.step}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold tracking-tight sm:text-xl">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </m.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
