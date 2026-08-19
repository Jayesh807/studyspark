"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const container = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0 },
  },
};

const item = {
  hidden: { opacity: 1, y: 0 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function Hero() {
  return (
    <section
      className="relative flex min-h-[calc(100vh-5rem)] items-center overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32"
      aria-label="Hero"
    >
      {/* Floating decorative shapes */}
      <FloatingShapes />

      <div className="relative mx-auto max-w-6xl px-4">
        <m.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="mx-auto flex max-w-6xl flex-col items-center gap-7 text-center"
        >
          <m.div variants={item}>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-5 py-2 text-sm font-semibold text-violet-600 dark:text-violet-300">
              <Sparkles className="size-4" />
              Your all-in-one student workspace
            </span>
          </m.div>

          <m.h1
            variants={item}
            className="mx-auto max-w-6xl text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl lg:text-[4.6rem]"
          >
            <span className="block">AI Study Tools to Create Quizzes</span>
            <span className="text-gradient block">
              Study Guides & Practice Tests
            </span>
          </m.h1>

          <m.p
            variants={item}
            className="mx-auto max-w-4xl text-pretty text-base font-medium leading-8 text-muted-foreground sm:text-lg md:text-xl md:leading-9"
          >
            StudySparks offers AI study tools to turn PDFs, lecture notes, and
            study materials into quizzes, practice tests, questions, and study
            guides. Create AI-generated quizzes with different question types
            and difficulty levels to prepare smarter for exams.
          </m.p>

          <m.div
            variants={item}
            className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center"
          >
            <Button
              size="lg"
              asChild
              className="h-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 px-10 text-lg font-semibold text-white shadow-xl shadow-violet-500/30 transition-all hover:shadow-2xl hover:shadow-violet-500/45 hover:brightness-110"
            >
              <Link href="/signup">
                Start for free
                <ArrowRight className="ml-2 size-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-16 rounded-full border-violet-500/10 bg-background/80 px-10 text-lg font-semibold shadow-lg shadow-slate-900/5 backdrop-blur-sm hover:bg-background"
            >
              <Link href="/features">See features</Link>
            </Button>
          </m.div>
        </m.div>
      </div>
    </section>
  );
}

function FloatingShapes() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="absolute left-[8%] top-[18%] size-16 rounded-3xl bg-gradient-to-br from-violet-400/30 to-fuchsia-400/20 blur-[1px]"
        style={{ animation: "spin 40s linear infinite", willChange: "transform" }}
      />
      <div className="animate-float-rotate-a absolute right-[12%] top-[12%] size-10 rounded-full bg-gradient-to-br from-fuchsia-400/30 to-rose-400/20" />
      <div className="animate-float-rotate-b absolute bottom-[14%] left-[14%] size-12 rotate-12 rounded-2xl bg-gradient-to-br from-purple-400/30 to-violet-400/20" />
      <div className="animate-float-y-slow absolute bottom-[22%] right-[6%] size-8 rounded-full bg-gradient-to-br from-emerald-400/25 to-teal-400/15" />
    </div>
  );
}
