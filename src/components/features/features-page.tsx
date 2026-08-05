"use client";

import Link from "next/link";
import { motion, LazyMotion, domAnimation } from "framer-motion";
import {
  LayoutDashboard,
  ListTodo,
  Timer,
  BarChart3,
  CalendarDays,
  BookOpenCheck,
  GraduationCap,
  Keyboard,
  Music,
  Calculator,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Shield,
  Zap,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { AnimatedBlobs } from "@/components/shared/animated-blobs";
import { GlassCard, StaggerContainer, StaggerItem } from "@/components/shared/motion";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

interface FeatureDetail {
  id: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  summary: string;
  gradient: string;
  keyPoints: string[];
  useCases: string[];
}

const FEATURE_DETAILS: FeatureDetail[] = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    title: "Unified Student Dashboard",
    subtitle: "Your complete academic control center in one glance",
    summary:
      "The StudySpark dashboard aggregates your daily tasks, focus timer stats, upcoming exam countdowns, subject lists, and weekly activity charts into a calm, distraction-free command center. No more opening five browser tabs to check your homework, schedule, and study timer.",
    gradient: "from-violet-500 to-purple-500",
    keyPoints: [
      "Glanceable morning welcome widget with daily summary",
      "Instant quick-add launcher for tasks, events, and exams",
      "Real-time productivity heatmaps and streak counters",
      "Integrated audio controls for background lo-fi beats",
    ],
    useCases: [
      "Reviewing your daily priorities over morning coffee",
      "Checking upcoming assignment due dates before starting study blocks",
      "Tracking overall weekly focus progress at a glance",
    ],
  },
  {
    id: "tasks",
    icon: ListTodo,
    title: "Smart Task Management",
    subtitle: "Organize coursework by priority, due date, and subject",
    summary:
      "Stay ahead of assignments, readings, and projects. StudySpark's task planner is built around academic needs: assign custom subjects, flag high-priority deadlines, add subtasks, and watch completed items feed directly into your weekly productivity analytics.",
    gradient: "from-fuchsia-500 to-pink-500",
    keyPoints: [
      "Custom subject categories matching your current semester schedule",
      "Priority badges (High, Medium, Low) to prevent last-minute cramming",
      "Automatic archiving of completed items with completion history",
      "Seamless synchronization with calendar deadline indicators",
    ],
    useCases: [
      "Breaking large semester papers into small 30-minute writing tasks",
      "Filtering tasks by subject during exam prep week",
      "Prioritizing urgent lab submissions due within 24 hours",
    ],
  },
  {
    id: "focus-timer",
    icon: Timer,
    title: "Pomodoro Focus Timer",
    subtitle: "Build deep concentration habits without cognitive fatigue",
    summary:
      "Boost your study stamina with an integrated Pomodoro focus timer. Work in structured 25-minute or custom focus blocks, take automated short and long breaks, tag focus time to specific courses, and eliminate distractions during study hours.",
    gradient: "from-emerald-500 to-teal-500",
    keyPoints: [
      "Customizable work (15–60 min) and break (5–30 min) durations",
      "Subject tagging — log exact hours spent studying Math vs. Physics",
      "Audio cues and visual progress indicators",
      "Streak tracking to maintain daily focus habits",
    ],
    useCases: [
      "Studying for difficult STEM exams in 25-minute intense blocks",
      "Tracking actual hours spent writing research literature reviews",
      "Maintaining focus during long evening study sessions",
    ],
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Study Analytics & Heatmaps",
    subtitle: "Data-driven insights to optimize how you learn",
    summary:
      "Turn your study effort into visible progress. StudySpark automatically compiles your completed tasks, focus session logs, and daily study hours into intuitive charts, subject performance breakdowns, and GitHub-style contribution heatmaps.",
    gradient: "from-amber-500 to-orange-500",
    keyPoints: [
      "Weekly and monthly study hour bar charts",
      "Subject distribution pie charts highlighting time allocation",
      "Task completion rate analytics and productivity scores",
      "Yearly activity contribution heatmaps to reward consistency",
    ],
    useCases: [
      "Identifying which courses are receiving insufficient study time",
      "Verifying if your study hours correlate with improved exam grades",
      "Building confidence by viewing total logged hours over time",
    ],
  },
  {
    id: "calendar",
    icon: CalendarDays,
    title: "Student Calendar System",
    subtitle: "Unify class schedules, assignment dates, and exams",
    summary:
      "A calendar designed for academic life. View month-at-a-glance schedules, color-coded subjects, exam countdown dates, and lecture times. Everything stays synchronized with your task list so deadlines never take you by surprise.",
    gradient: "from-cyan-500 to-blue-500",
    keyPoints: [
      "Color-coded events by subject for easy visual grouping",
      "Integrated deadline markers synced from your task planner",
      "Month and daily schedule views",
      "Drag-and-drop planning for upcoming assignments",
    ],
    useCases: [
      "Planning out your entire semester syllabus on day one",
      "Visualizing upcoming exam clusters to start prep early",
      "Balancing university commitments with personal events",
    ],
  },
  {
    id: "exam-tracker",
    icon: GraduationCap,
    title: "Exam & Grade Tracker",
    subtitle: "Countdown to midterms, finals, and track grade goals",
    summary:
      "Never be caught unprepared for an exam again. The Exam Tracker provides prominent countdown timers for every upcoming midterm and final exam, allows you to record scores, and calculates target grades needed for academic honors.",
    gradient: "from-rose-500 to-fuchsia-500",
    keyPoints: [
      "Prominent days-left countdown badges for upcoming tests",
      "Target score estimation for final exams",
      "Grade log history categorized by subject and semester",
      "Preparation status tracking (Not Started, In Progress, Ready)",
    ],
    useCases: [
      "Keeping track of 4 upcoming midterm dates simultaneously",
      "Calculating what mark you need on a final exam to maintain an A grade",
      "Structuring a 2-week exam revision timetable",
    ],
  },
  {
    id: "revision-plan",
    icon: BookOpenCheck,
    title: "Revision Plan",
    subtitle: "Turn exam prep into a clear topic-by-topic roadmap",
    summary:
      "Revision Plan helps students prepare for exams without guesswork. Add topics for each exam, set priorities, track progress, and keep weak chapters visible until they are ready.",
    gradient: "from-blue-500 to-indigo-500",
    keyPoints: [
      "Create revision topics connected to exams and subjects",
      "Track progress states for each chapter or concept",
      "Prioritize weak topics before exam week pressure builds",
      "Use one roadmap to decide what to revise next",
    ],
    useCases: [
      "Breaking a large syllabus into manageable revision topics",
      "Checking which chapters are still weak before a final exam",
      "Planning focused review sessions across multiple subjects",
    ],
  },
  {
    id: "study-radio",
    icon: Music,
    title: "Study Radio & Lo-Fi Player",
    subtitle: "Curated focus beats and ambient sounds built into your app",
    summary:
      "Music is proven to enhance concentration during study sessions. StudySpark includes a built-in study radio streaming lo-fi beats, ambient sounds, and customizable YouTube playlists without needing to switch tabs to Spotify or YouTube.",
    gradient: "from-blue-500 to-indigo-500",
    keyPoints: [
      "Curated lo-fi channels and ambient noise generators",
      "Custom YouTube URL playlist player integration",
      "Minimalist audio controls accessible from any dashboard page",
      "Zero pop-ups or external ads interrupting your study flow",
    ],
    useCases: [
      "Listening to relaxing lo-fi beats during late-night essay writing",
      "Playing rain soundscapes during intense problem-solving sessions",
      "Streaming custom study playlists directly inside your planner",
    ],
  },
  {
    id: "speed-typing",
    icon: Keyboard,
    title: "Speed Typing Practice",
    subtitle: "Improve WPM, accuracy, and keyboard confidence",
    summary:
      "Speed Typing gives students a focused typing challenge for notes, assignments, coding, and exam prep. Practice by difficulty, get instant WPM and accuracy feedback, hear responsive key sounds, and compete through a total-score leaderboard.",
    gradient: "from-violet-500 to-cyan-500",
    keyPoints: [
      "Easy, medium, and hard typing paragraphs",
      "Live WPM, accuracy, mistakes, time, and score tracking",
      "Soft mechanical keypress sounds with a negative wrong-key alert",
      "Leaderboard ranking based on total accumulated score",
    ],
    useCases: [
      "Improving typing speed for long notes and assignments",
      "Practicing accuracy before coding or online tests",
      "Competing with classmates through total score rankings",
    ],
  },
  {
    id: "toolbox",
    icon: Calculator,
    title: "Student Utility Toolbox",
    subtitle: "Free tools: CGPA calculator, percentage tool, age tool",
    summary:
      "Eliminate time spent searching for basic calculations online. StudySpark includes a complete suite of student utility calculators directly inside your workspace sidebar.",
    gradient: "from-purple-500 to-pink-500",
    keyPoints: [
      "CGPA & GPA calculator supporting 4.0 and 10.0 grading scales",
      "Percentage calculator for marks, grade weightings, and score changes",
      "Age calculator for admission forms and eligibility cutoffs",
      "Unit converter for physics, chemistry, and engineering units",
    ],
    useCases: [
      "Calculating your cumulative GPA after semester results are released",
      "Converting test scores out of 75 into exact percentage marks",
      "Checking exact age in days for college entrance registration",
    ],
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
                  Detailed Feature Breakdown
                </motion.span>

                <motion.h1
                  variants={fadeUp}
                  className="mt-6 text-balance text-4xl font-bold leading-[1.04] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
                >
                  Tools Designed Specifically for{" "}
                  <span className="text-gradient">Student Success.</span>
                </motion.h1>

                <motion.p
                  variants={fadeUp}
                  className="mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
                >
                  Explore every integrated tool inside StudySpark. Replacing scattered apps with a single, elegant workspace designed around academic life.
                </motion.p>
              </div>
            </motion.div>
          </section>

          {/* Detailed Feature Sections */}
          <section className="px-4 pb-24 sm:pb-32">
            <div className="mx-auto max-w-6xl space-y-20">
              {FEATURE_DETAILS.map((feature, idx) => {
                const reverse = idx % 2 === 1;
                return (
                  <div
                    key={feature.id}
                    id={feature.id}
                    className="scroll-mt-28 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center"
                  >
                    <div
                      className={`lg:col-span-7 ${
                        reverse ? "lg:order-2" : "lg:order-1"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div
                          className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg`}
                        >
                          <feature.icon className="size-6" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                            Feature #{idx + 1}
                          </span>
                          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            {feature.title}
                          </h2>
                        </div>
                      </div>

                      <p className="text-base text-muted-foreground leading-relaxed mb-6">
                        {feature.summary}
                      </p>

                      <div className="grid sm:grid-cols-2 gap-4 my-6">
                        <div className="rounded-2xl border border-violet-500/15 bg-violet-500/5 p-4">
                          <h3 className="text-sm font-semibold text-foreground mb-2">Key Capabilities</h3>
                          <ul className="space-y-1.5 text-xs text-muted-foreground">
                            {feature.keyPoints.map((pt) => (
                              <li key={pt} className="flex items-start gap-2">
                                <CheckCircle2 className="size-3.5 text-violet-500 shrink-0 mt-0.5" />
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                          <h3 className="text-sm font-semibold text-foreground mb-2">Ideal Student Use Cases</h3>
                          <ul className="space-y-1.5 text-xs text-muted-foreground">
                            {feature.useCases.map((uc) => (
                              <li key={uc} className="flex items-start gap-2">
                                <span className="size-1.5 rounded-full bg-violet-500 shrink-0 mt-1.5" />
                                <span>{uc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`lg:col-span-5 ${
                        reverse ? "lg:order-1" : "lg:order-2"
                      }`}
                    >
                      <GlassCard className="p-8 text-center flex flex-col items-center justify-center min-h-[280px] shadow-xl border-violet-500/15">
                        <div
                          className={`size-20 rounded-3xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white shadow-xl mb-4`}
                        >
                          <feature.icon className="size-10" />
                        </div>
                        <h3 className="text-lg font-bold">{feature.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                          {feature.subtitle}
                        </p>
                        <Link
                          href="/signup"
                          className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400"
                        >
                          Try this in your workspace <ArrowRight className="size-3.5" />
                        </Link>
                      </GlassCard>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Tool Comparison Table Section */}
          <section className="px-4 pb-24 border-t border-violet-500/10 pt-16">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl mb-4">
                StudySpark vs. Disconnected App Setup
              </h2>
              <p className="text-muted-foreground text-sm max-w-xl mx-auto mb-10">
                Compare using an all-in-one student workspace against maintaining multiple separate apps.
              </p>

              <div className="overflow-x-auto rounded-3xl border border-violet-500/15 glass">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-foreground">
                    <tr>
                      <th className="p-4">Capability</th>
                      <th className="p-4 text-violet-600 dark:text-violet-400 font-bold">StudySpark</th>
                      <th className="p-4 text-muted-foreground">Scattered Apps Setup</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 text-muted-foreground text-xs">
                    <tr>
                      <td className="p-4 font-medium text-foreground">Task & Calendar Sync</td>
                      <td className="p-4 text-emerald-600 dark:text-emerald-400 font-semibold">Automatic</td>
                      <td className="p-4">Manual cross-entry</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-foreground">Study Hours Analytics</td>
                      <td className="p-4 text-emerald-600 dark:text-emerald-400 font-semibold">Automatic per subject</td>
                      <td className="p-4">Requires manual spreadsheets</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-foreground">Exam Countdown & Grade Tools</td>
                      <td className="p-4 text-emerald-600 dark:text-emerald-400 font-semibold">Built-in</td>
                      <td className="p-4">Requires third-party websites</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-foreground">Revision Planning & Typing Practice</td>
                      <td className="p-4 text-emerald-600 dark:text-emerald-400 font-semibold">Built-in roadmap and WPM game</td>
                      <td className="p-4">Requires separate apps or manual tracking</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-foreground">Integrated Focus Music</td>
                      <td className="p-4 text-emerald-600 dark:text-emerald-400 font-semibold">Built-in Study Radio</td>
                      <td className="p-4">Requires YouTube/Spotify tabs</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-foreground">Pricing</td>
                      <td className="p-4 text-emerald-600 dark:text-emerald-400 font-semibold">Core tools currently free</td>
                      <td className="p-4">Multiple paid subscriptions</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="px-4 pb-24">
            <div className="mx-auto max-w-4xl rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-8 sm:p-12 text-center text-white shadow-2xl">
              <h2 className="text-3xl font-bold tracking-tight">Ready to Organize Your Studies?</h2>
              <p className="mt-3 text-sm sm:text-base text-white/85 max-w-xl mx-auto">
                Create a StudySpark workspace to plan tasks, focus sessions, and study progress with core tools that are currently free.
              </p>
              <div className="mt-8 flex justify-center">
                <Button
                  size="lg"
                  asChild
                  className="rounded-xl bg-white px-8 text-base font-semibold text-violet-700 hover:bg-white/90 shadow-xl"
                >
                  <Link href="/signup">
                    Start Your Free Workspace <ArrowRight className="size-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </LazyMotion>
  );
}
