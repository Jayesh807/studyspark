"use client";

import { m } from "framer-motion";
import {
  LayoutDashboard,
  Palette,
  Shield,
  Smartphone,
  Target,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  GlassCard,
  StaggerContainer,
  StaggerItem,
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
      "Tasks, calendar planning, focus sessions, exam dates, and study analytics can be managed from one student workspace instead of several disconnected tabs.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Target,
    title: "Built Around Study Workflows",
    description:
      "StudySpark is organized around subjects, deadlines, revision topics, and weekly review so the app structure matches common academic routines.",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    icon: Palette,
    title: "Calm Interface",
    description:
      "The interface uses clear spacing, light and dark themes, and focused views to keep planning approachable during busy study weeks.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Zap,
    title: "Core Tools Currently Free",
    description:
      "Students can start with the core workspace without a credit card. Pricing and feature availability may change as StudySpark develops.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "Privacy-Aware Planning",
    description:
      "Private study records belong in the signed-in workspace, while public guides and feature pages avoid exposing personal study data.",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: Smartphone,
    title: "Works Across Devices",
    description:
      "StudySpark is a progressive web app that can be used on laptops, tablets, and phones through a modern browser.",
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
          title="Why StudySpark Works"
          highlight="For Student Planning"
          description="A thoughtfully designed workspace for the recurring routines students handle every week: tasks, revision, deadlines, focus, and review."
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
