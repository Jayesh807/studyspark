"use client";

import { m } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Palette,
  Zap,
  Shield,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import {
  StaggerContainer,
  StaggerItem,
  GlassCard,
} from "@/components/shared/motion";
import { SectionHeading } from "./section-heading";

interface Reason {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
}

const REASONS: Reason[] = [
  {
    icon: LayoutDashboard,
    title: "One Unified Workspace",
    description:
      "Most students juggle between a task app, a calendar, a timer, and a spreadsheet for grades. StudySpark unifies all of these into a single beautifully designed workspace. No more context switching — everything you need for your studies lives in one place, connected and in sync.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Users,
    title: "Built by Students, for Students",
    description:
      "StudySpark isn't a generic productivity app repurposed for education. It was designed from day one around the rhythms of student life — semesters, exams, subjects, deadlines, and study sessions. Every feature exists because a real student needed it.",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    icon: Palette,
    title: "Beautiful & Calming Design",
    description:
      "Study tools should reduce anxiety, not add to it. StudySpark uses gentle gradients, generous spacing, and thoughtful animations to create a workspace that feels calm and inviting. It's a dashboard you'll actually want to open every day.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Zap,
    title: "Free Forever — No Catch",
    description:
      "StudySpark's core experience is completely free. No trial periods, no feature gates, no hidden upsells. Every student deserves access to powerful study tools regardless of their budget. A premium tier is planned for power users, but the essentials will always be free.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "Privacy-First Architecture",
    description:
      "Your study data belongs to you, not advertisers. StudySpark doesn't sell your data, doesn't track your behavior for marketing, and gives you full control over your information. Study with confidence knowing your privacy is respected.",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: Smartphone,
    title: "Works on Every Device",
    description:
      "StudySpark is a progressive web app that works seamlessly on laptops, tablets, and phones. Install it on your home screen for an app-like experience without downloading anything from an app store. Your study data syncs everywhere you go.",
    gradient: "from-rose-500 to-fuchsia-500",
  },
];

export function WhyStudySpark() {
  return (
    <section
      id="why-studyspark"
      className="relative scroll-mt-24 px-4 py-16 sm:py-24"
      aria-label="Why StudySpark"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="Why StudySpark"
          title="Why Students Choose StudySpark"
          highlight="Over Other Apps"
          description="A single, thoughtfully designed workspace that replaces the five disconnected apps you're currently juggling. Here's what makes StudySpark different."
        />

        <StaggerContainer className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map((reason) => (
            <StaggerItem key={reason.title}>
              <GlassCard
                hover
                className="group relative h-full overflow-hidden p-5 sm:p-6"
              >
                <div className="relative flex flex-col gap-4">
                  <m.div
                    whileHover={{ rotate: -6, scale: 1.05 }}
                    transition={{
                      type: "spring",
                      stiffness: 350,
                      damping: 15,
                    }}
                    className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${reason.gradient} text-white shadow-lg`}
                  >
                    <reason.icon className="size-6" strokeWidth={2.2} />
                  </m.div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">
                      {reason.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {reason.description}
                    </p>
                  </div>
                </div>
              </GlassCard>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
