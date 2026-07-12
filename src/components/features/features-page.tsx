"use client";

import { motion, LazyMotion, domAnimation } from "framer-motion";
import {
  LayoutDashboard,
  ListTodo,
  Timer,
  BarChart3,
  CalendarDays,
  GraduationCap,
  Music,
  Calculator,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { AnimatedBlobs } from "@/components/shared/animated-blobs";
import {
  GlassCard,
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/motion";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
}

const FEATURES: Feature[] = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description:
      "A calm overview of your day — tasks, focus hours, upcoming exams and events, all in one beautifully organized space.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: ListTodo,
    title: "Smart Tasks",
    description:
      "Capture tasks with priority and category, track completion trends, and let StudySpark surface what matters today.",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    icon: Timer,
    title: "Focus Timer",
    description:
      "Deep work sessions with built-in Pomodoro, ambient sounds, and strict modes to stop you from checking other tabs.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "See where your time actually goes. Weekly heatmaps and subject breakdowns help you balance your effort.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: CalendarDays,
    title: "Calendar",
    description:
      "A student-first calendar that auto-syncs with your tasks, exams, and classes so you never double-book your time.",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: GraduationCap,
    title: "Exam Tracker",
    description:
      "Log your grades, calculate what you need for finals, and track your GPA progression across semesters.",
    gradient: "from-rose-500 to-fuchsia-500",
  },
  {
    icon: Music,
    title: "Study Radio",
    description:
      "Curated lofi, ambient, and focus tracks that play right inside the app, perfectly synced to your study sessions.",
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    icon: Calculator,
    title: "Student Toolbox",
    description:
      "Quick access to grade calculators, citation generators, and unit converters without breaking your workflow.",
    gradient: "from-purple-500 to-pink-500",
  },
];

export function FeaturesPage() {
  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen overflow-hidden bg-background selection:bg-violet-500/30">
        <Navbar />

        <main>
          {/* Hero Section */}
          <section className="relative px-4 pt-32 sm:pt-40 pb-16 sm:pb-24">
            <AnimatedBlobs />
            <div className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-gradient-to-b from-violet-500/15 via-fuchsia-500/10 to-transparent" />
            <div
              className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08]"
              style={{
                backgroundImage:
                  "linear-gradient(oklch(0.55 0.21 277) 1px, transparent 1px), linear-gradient(90deg, oklch(0.55 0.21 277) 1px, transparent 1px)",
                backgroundSize: "36px 36px",
              }}
            />

            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.08, delayChildren: 0.08 },
                },
              }}
              className="mx-auto max-w-6xl text-center"
            >
              <div className="mx-auto flex max-w-4xl flex-col items-center">
                <motion.span
                  variants={fadeUp}
                  className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300"
                >
                  <Sparkles className="size-3.5" />
                  Everything you need
                </motion.span>

                <motion.h1
                  variants={fadeUp}
                  className="mt-6 text-balance text-4xl font-bold leading-[1.04] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
                >
                  Features built for{" "}
                  <span className="text-gradient">student success.</span>
                </motion.h1>

                <motion.p
                  variants={fadeUp}
                  className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
                >
                  From smart task management to deep focus tools, StudySpark
                  provides everything you need to take control of your study
                  sessions in one beautifully organized workspace.
                </motion.p>
              </div>
            </motion.div>
          </section>

          {/* Features Grid Section */}
          <section className="px-4 pb-24 sm:pb-32">
            <div className="mx-auto max-w-6xl">
              <StaggerContainer className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {FEATURES.map((feature, idx) => (
                  <StaggerItem key={feature.title}>
                    <GlassCard
                      className="group flex h-full flex-col p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-500/10"
                    >
                      <div
                        className={cn(
                          "mb-6 inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",
                          feature.gradient
                        )}
                      >
                        <feature.icon className="size-6 transition-transform duration-300 group-hover:scale-110" />
                      </div>
                      <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {feature.description}
                      </p>
                    </GlassCard>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </LazyMotion>
  );
}
