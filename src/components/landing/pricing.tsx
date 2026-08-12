"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check, Crown, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "./section-heading";

const FREE_FEATURES = [
  "Core task & subject manager",
  "Focus timer & study analytics",
  "Unlimited 5-Question AI exams",
  "5 Free 10-Question trial tests",
  "Sparks AI Assistant (Ask Doubts)",
  "Text to PDF Studio",
  "2 Free AI Resume generations",
];

const PREMIUM_PLANS = [
  {
    id: "exam_10q",
    title: "10-Q Exam Mode Pass",
    subtitle: "Unlimited grounded 10-question practice exams with instant evaluation",
    originalPrice: "₹49",
    discountPrice: "₹19",
    period: "lifetime",
    popular: false,
    badge: "60% OFF",
    features: [
      "Unlimited 10-Question grounded exam papers",
      "PDF upload & full chunk indexing",
      "Instant answer evaluation & scoring",
      "Printable & downloadable Exam PDFs",
      "Lifetime unlimited access — No subscriptions",
    ],
  },
  {
    id: "combo",
    title: "All-Access AI Combo",
    subtitle: "Unlocks BOTH 10-Question Exam Simulator + AI Resume Builder",
    originalPrice: "₹98",
    discountPrice: "₹29",
    period: "lifetime",
    popular: true,
    badge: "70% OFF • BEST VALUE",
    features: [
      "Lifetime Unlimited 10-Question AI Exams",
      "Lifetime Unlimited AI Resume Builder",
      "ATS-Optimized recruiter bullet points",
      "Print & Download high-res PDF exports",
      "Priority AI processing & zero monthly fees",
    ],
  },
  {
    id: "resume",
    title: "AI Resume Builder Pass",
    subtitle: "Turn raw experience into honest, recruiter-ready ATS resumes",
    originalPrice: "₹49",
    discountPrice: "₹19",
    period: "lifetime",
    popular: false,
    badge: "60% OFF",
    features: [
      "Unlimited AI Resume generations & exports",
      "Honest ATS bullet point optimization",
      "Live editable split-screen preview",
      "Download PDF & native printing support",
      "Lifetime unlimited access — One-time pay",
    ],
  },
];

export function Pricing() {
  return (
    <section
      id="pricing"
      className="relative scroll-mt-24 px-4 py-16 sm:py-24"
      aria-label="Pricing plans"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="Transparent Pay-As-You-Go"
          title="Simple, lifetime AI pricing."
          highlight="No monthly subscriptions."
          description="Start with our generous free tier, then unlock lifetime AI powers with a tiny one-time payment. Never worry about recurring monthly bills."
        />

        {/* Pricing Cards Grid */}
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PREMIUM_PLANS.map((plan) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className={`relative flex flex-col justify-between rounded-3xl p-6 sm:p-8 transition-all ${
                plan.popular
                  ? "border-2 border-amber-400/80 bg-gradient-to-b from-amber-500/10 via-slate-900/90 to-slate-950 shadow-[0_0_40px_rgba(245,158,11,0.25)]"
                  : "border border-white/10 bg-slate-900/60 backdrop-blur-xl hover:border-white/20"
              }`}
            >
              {/* Badge */}
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider ${
                    plan.popular
                      ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30"
                      : "bg-white/10 text-amber-300 border border-amber-400/30"
                  }`}
                >
                  {plan.popular ? <Crown className="h-3.5 w-3.5 fill-slate-950 text-slate-950" /> : <Zap className="h-3.5 w-3.5" />}
                  {plan.badge}
                </span>
                <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  One-time payment
                </span>
              </div>

              {/* Title & Description */}
              <div className="mt-5 space-y-2">
                <h3 className="text-2xl font-extrabold text-white">{plan.title}</h3>
                <p className="text-xs leading-relaxed text-slate-400">{plan.subtitle}</p>
              </div>

              {/* Price Tag */}
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-lg font-bold text-slate-400 line-through decoration-rose-500 decoration-2">
                  {plan.originalPrice}
                </span>
                <span className="text-4xl font-extrabold text-white sm:text-5xl">{plan.discountPrice}</span>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  / {plan.period}
                </span>
              </div>

              {/* Action CTA */}
              <Button
                size="lg"
                asChild
                className={`mt-6 h-12 w-full rounded-2xl text-sm font-bold shadow-lg transition-all ${
                  plan.popular
                    ? "bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 text-white shadow-amber-500/25 hover:brightness-110 hover:scale-[1.02]"
                    : "bg-white/10 text-white hover:bg-white/20 border border-white/15"
                }`}
              >
                <Link href="/dashboard/study-search">
                  <span>Unlock {plan.title.replace(" Pass", "")}</span>
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Link>
              </Button>

              {/* Features List */}
              <ul className="mt-8 space-y-3 border-t border-white/10 pt-6">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Free Tier Included Strip */}
        <div className="mt-12 rounded-3xl border border-white/10 bg-slate-900/40 p-6 sm:p-8 backdrop-blur-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-extrabold text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
                Always 100% Free Core Plan
              </div>
              <h4 className="mt-2 text-xl font-bold text-white">Free Forever to Start</h4>
              <p className="mt-1 text-xs text-slate-400">Includes core planning, infinite 5-Q exams, doubt solver, and free testing trial quotas.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full md:w-auto text-xs text-slate-300">
              {FREE_FEATURES.map((feat) => (
                <div key={feat} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
