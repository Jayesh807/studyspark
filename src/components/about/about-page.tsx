"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Compass,
  HeartHandshake,
  Lightbulb,
  LineChart,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { SectionHeading } from "@/components/landing/section-heading";
import { AnimatedBlobs } from "@/components/shared/animated-blobs";
import {
  GlassCard,
  StaggerContainer,
  StaggerItem,
} from "@/components/shared/motion";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const BENEFITS: {
  icon: LucideIcon;
  title: string;
  description: string;
  gradient: string;
}[] = [
  {
    icon: CalendarCheck2,
    title: "One student command center",
    description:
      "Tasks, subjects, exams, calendar plans and study sessions stay connected in one calm workspace.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Clock3,
    title: "Focus without friction",
    description:
      "Pomodoro sessions make it easier to start, stay present and turn small study blocks into real momentum.",
    gradient: "from-fuchsia-500 to-pink-500",
  },
  {
    icon: LineChart,
    title: "Progress you can see",
    description:
      "Analytics translate effort into clear trends, so students know where time goes and what to improve next.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: BookOpenCheck,
    title: "Built around subjects",
    description:
      "Organize work by class, deadline and exam so every commitment has context instead of becoming clutter.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Target,
    title: "Planning that feels doable",
    description:
      "Study plans turn big goals into daily next steps that are easy to review, adjust and complete.",
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: ShieldCheck,
    title: "A calmer digital routine",
    description:
      "StudySpark is designed to reduce app-switching, noise and decision fatigue during busy semesters.",
    gradient: "from-rose-500 to-fuchsia-500",
  },
];

const VALUES: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: HeartHandshake,
    title: "Student-first",
    description:
      "Every feature should make student life feel more manageable, not more complicated.",
  },
  {
    icon: Lightbulb,
    title: "Clarity over clutter",
    description:
      "We favor thoughtful defaults, useful hierarchy and tools that are easy to understand at a glance.",
  },
  {
    icon: Brain,
    title: "Sustainable focus",
    description:
      "Productivity should support energy, attention and consistency instead of rewarding burnout.",
  },
  {
    icon: Users,
    title: "Accessible growth",
    description:
      "Powerful study systems should be approachable for every student, from first week to finals week.",
  },
];

const JOURNEY = [
  { label: "Plan", icon: Compass },
  { label: "Focus", icon: Clock3 },
  { label: "Track", icon: BarChart3 },
  { label: "Improve", icon: Rocket },
];

export function AboutPage() {
  const setView = useAppStore((s) => s.setView);
  const router = useRouter();

  const startSignup = () => {
    setView("signup");
    router.push("/signup");
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <Navbar />
      <main>
        <section className="relative px-4 pb-20 pt-32 sm:pb-28 sm:pt-40">
          <AnimatedBlobs variant="landing" />
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
            className="mx-auto max-w-6xl"
          >
            <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
              <motion.span
                variants={fadeUp}
                className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300"
              >
                <Sparkles className="size-3.5" />
                About StudySpark
              </motion.span>

              <motion.h1
                variants={fadeUp}
                className="mt-6 text-balance text-4xl font-bold leading-[1.04] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
              >
                Helping students turn busy semesters into{" "}
                <span className="text-gradient">clear study momentum.</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
              >
                StudySpark brings planning, focus, deadlines and productivity
                insights into one beautiful system, so students can spend less
                energy managing school and more energy actually learning.
              </motion.p>
            </div>

            <motion.div
              variants={fadeUp}
              className="mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4"
            >
              {JOURNEY.map(({ label, icon: Icon }, index) => (
                <div
                  key={label}
                  className="glass-strong rounded-2xl px-4 py-4 text-center shadow-lg shadow-violet-500/5"
                >
                  <div
                    className={cn(
                      "mx-auto flex size-10 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg",
                      index === 0 && "from-violet-500 to-purple-500",
                      index === 1 && "from-fuchsia-500 to-pink-500",
                      index === 2 && "from-emerald-500 to-teal-500",
                      index === 3 && "from-amber-500 to-orange-500"
                    )}
                  >
                    <Icon className="size-5" />
                  </div>
                  <p className="mt-2 text-sm font-semibold">{label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        <section className="relative px-4 py-16 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-2">
            <StoryCard
              eyebrow="Our mission"
              title="Make student life feel organized, focused and achievable."
              icon={Target}
            >
              StudySpark was created because students are asked to manage more
              than ever: assignments, exams, revision, clubs, personal goals and
              attention-draining apps. Our mission is to bring that chaos into a
              single, thoughtful workspace that helps students know what matters
              today, what is coming next and how their effort is adding up.
            </StoryCard>

            <StoryCard
              eyebrow="Our vision"
              title="A future where every student has a personal productivity system."
              icon={Rocket}
            >
              We imagine StudySpark becoming the study companion students rely
              on from daily planning to exam season. The vision is a platform
              that learns from each student's rhythm, encourages healthier focus
              habits and turns productivity analytics into confident, practical
              next steps.
            </StoryCard>
          </div>
        </section>

        <section className="relative px-4 py-16 sm:py-24" id="why-studyspark">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Why StudySpark"
              title="Designed for the way"
              highlight="students actually study"
              description="A premium workspace that connects planning, focus and reflection instead of scattering your school life across disconnected tools."
            />

            <StaggerContainer className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {BENEFITS.map((benefit) => (
                <StaggerItem key={benefit.title}>
                  <GlassCard hover className="group relative h-full overflow-hidden p-6 sm:p-7">
                    <div
                      className={`pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-gradient-to-br ${benefit.gradient} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20`}
                    />
                    <div className="relative">
                      <motion.div
                        whileHover={{ rotate: -6, scale: 1.05 }}
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 15,
                        }}
                        className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${benefit.gradient} text-white shadow-lg`}
                      >
                        <benefit.icon className="size-6" strokeWidth={2.2} />
                      </motion.div>
                      <h3 className="mt-5 text-lg font-semibold tracking-tight">
                        {benefit.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {benefit.description}
                      </p>
                    </div>
                  </GlassCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section className="relative px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Core values"
              title="The principles behind"
              highlight="every StudySpark detail"
              description="We build for calm progress: beautiful enough to enjoy, practical enough to use every day and focused enough to help students move forward."
            />

            <StaggerContainer className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              {VALUES.map((value, index) => (
                <StaggerItem key={value.title}>
                  <GlassCard hover className="h-full p-6">
                    <div className="flex h-full flex-col">
                      <div className="relative flex size-12 items-center justify-center rounded-2xl border border-violet-500/15 bg-violet-500/10 text-violet-600 dark:text-violet-300">
                        <value.icon className="size-6" />
                        <span
                          className="absolute -right-1 -top-1 size-3 rounded-full bg-gradient-to-br from-fuchsia-500 to-violet-500 shadow-lg shadow-violet-500/30"
                          style={{ animationDelay: `${index * 0.2}s` }}
                        />
                      </div>
                      <h3 className="mt-5 text-lg font-semibold tracking-tight">
                        {value.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {value.description}
                      </p>
                    </div>
                  </GlassCard>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>

        <section className="relative px-4 py-20 sm:py-28">
          <div className="mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-3xl"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600" />
              <motion.div
                animate={{ x: [0, 40, 0], y: [0, -30, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-20 -top-20 size-72 rounded-full bg-white/20 blur-3xl"
              />
              <motion.div
                animate={{ x: [0, -30, 0], y: [0, 40, 0], scale: [1, 0.9, 1] }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
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
                  Free to start
                </span>
                <h2 className="max-w-2xl text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                  Start Organizing Your Studies Today
                </h2>
                <p className="max-w-xl text-pretty text-base leading-relaxed text-white/85 sm:text-lg">
                  Build your workspace, plan your week and start tracking better
                  study habits in minutes.
                </p>
                <Button
                  size="lg"
                  onClick={startSignup}
                  className="h-12 rounded-xl bg-white px-7 text-base font-semibold text-violet-700 shadow-xl shadow-black/10 transition-all hover:scale-[1.03] hover:bg-white hover:shadow-2xl"
                >
                  Get Started
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function StoryCard({
  eyebrow,
  title,
  icon: Icon,
  children,
}: {
  eyebrow: string;
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <GlassCard className="relative h-full overflow-hidden p-7 sm:p-8">
        <div className="absolute -right-16 -top-16 size-48 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 blur-3xl" />
        <div className="relative">
          <div className="mb-6 flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300">
              <span className="size-1.5 rounded-full bg-violet-500" />
              {eyebrow}
            </span>
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25">
              <Icon className="size-5" />
            </div>
          </div>
          <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h2>
          <p className="mt-4 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            {children}
          </p>
        </div>
      </GlassCard>
    </motion.div>
  );
}
