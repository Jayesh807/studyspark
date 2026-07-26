"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function FinalCta() {
  const router = useRouter();

  return (
    <section
      className="relative px-4 py-20 sm:py-28"
      aria-label="Call to action"
    >
      <div className="mx-auto max-w-5xl">
        <m.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600" />
          <m.div
            animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 14,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -left-20 -top-20 size-72 rounded-full bg-white/20 blur-3xl"
          />
          <m.div
            animate={{ x: [0, -30, 0], y: [0, 40, 0], scale: [1, 0.9, 1] }}
            transition={{
              duration: 16,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute -bottom-20 -right-20 size-80 rounded-full bg-fuchsia-300/30 blur-3xl"
          />
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
              <CheckCircle2 className="size-3.5" />
              Free forever — no credit card required
            </span>
            <h2 className="max-w-2xl text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
              Ready to Transform Your Study Habits?
            </h2>
            <p className="max-w-xl text-pretty text-base leading-relaxed text-white/85 sm:text-lg">
              Join thousands of students who've already organized their academic
              life with StudySpark. One workspace for tasks, focus sessions,
              analytics, and everything in between.
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button
                size="lg"
                asChild
                className="h-12 rounded-xl bg-white px-7 text-base font-semibold text-violet-700 shadow-xl shadow-black/10 transition-all hover:scale-[1.03] hover:bg-white hover:shadow-2xl"
              >
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="size-4 ml-1" />
                </Link>
              </Button>
              <Button
                size="lg"
                asChild
                className="h-12 rounded-xl border border-white/30 bg-white/10 px-7 text-base font-semibold text-white backdrop-blur-sm transition-all hover:scale-[1.03] hover:bg-white/20"
              >
                <Link href="/features">
                  <Sparkles className="size-4 mr-1" />
                  Explore Features
                </Link>
              </Button>
            </div>
          </div>
        </m.div>
      </div>
    </section>
  );
}
