import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { BLOG_POSTS } from "@/lib/blog-data";
import {
  Sparkles,
  Clock,
  ArrowRight,
  BookOpen,
  Heart,
  CheckCircle2,
  Calendar,
  Timer,
  BarChart3,
  Calculator,
  Music,
  Code2,
} from "lucide-react";
import { GlassCard } from "@/components/shared/motion";

export const metadata: Metadata = {
  title: "Student Productivity Blog & Founder Story — StudySpark",
  description:
    "Discover why StudySpark was built by a student developer to solve study organization, plus read science-backed productivity articles and exam prep guides.",
  keywords: [
    "studyspark story",
    "why studyspark was built",
    "student productivity blog",
    "study tips blog",
    "college time management articles",
    "exam preparation guides",
  ],
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Student Productivity Blog & Founder Story — StudySpark",
    description:
      "The story behind StudySpark, plus science-backed study guides and time-management articles.",
    url: "/blog",
    type: "website",
  },
};

export default function BlogListingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Script
        id="blog-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "StudySpark Student Productivity Blog",
            url: "https://studysparks.cloud/blog",
            description:
              "Evidence-based study advice, founder story, productivity guides, and exam preparation tips for students.",
          }),
        }}
      />

      <Navbar />

      <main className="pt-24 sm:pt-28 pb-20 px-4">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300 mb-4">
              <BookOpen className="size-3.5" /> StudySpark Journal
            </span>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl md:text-6xl text-balance">
              Student Productivity & <span className="text-gradient">Study Advice</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-base text-muted-foreground leading-relaxed sm:text-lg">
              Science-backed study techniques, time-management frameworks, and practical guides to help you study smarter and stress less.
            </p>
          </div>

          {/* Founder Story Feature Section (Top of Blog) */}
          <div className="mb-14">
            <GlassCard className="p-6 sm:p-10 border-violet-500/25 shadow-2xl relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-bold text-sm shadow-md">
                    JM
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-violet-600 dark:text-violet-300">
                      <Sparkles className="size-3" /> Founder&apos;s Story
                    </span>
                    <h2 className="text-xs text-muted-foreground mt-0.5">
                      Why I Built StudySpark • By Jayesh Malviya
                    </h2>
                  </div>
                </div>

                <div className="prose prose-neutral max-w-none dark:prose-invert text-sm sm:text-base leading-relaxed text-foreground/90 space-y-4">
                  <p className="text-base sm:text-lg font-medium text-foreground italic border-l-4 border-violet-500 pl-4 py-1">
                    &ldquo;Whenever I sat down to study, I never had a proper plan. I would randomly start with whichever subject came to mind. I didn&apos;t have a clear list of tasks for the day, so I kept switching between topics. After a while, I realized that this approach was hurting my productivity.&rdquo;
                  </p>

                  <p>
                    To solve this, I downloaded a to-do app. It helped me organize my daily tasks, but I soon realized it still wasn&apos;t enough. I needed to track my subjects, analyze my study progress, monitor upcoming exams, and manage events. For every feature, I had to use a different application.
                  </p>

                  <div className="my-6 rounded-2xl bg-gradient-to-r from-violet-500/15 via-fuchsia-500/10 to-purple-500/15 p-6 border border-violet-500/20 text-center font-bold text-lg text-foreground">
                    That&apos;s when I thought: <br className="hidden sm:inline" />
                    <span className="text-gradient text-xl sm:text-2xl font-extrabold mt-1 block">
                      &ldquo;Why not bring everything together on one platform?&rdquo;
                    </span>
                    <span className="text-sm font-normal text-muted-foreground block mt-1">
                      So I built StudySpark. ✨
                    </span>
                  </div>

                  <p>
                    StudySpark is an all-in-one web application designed to help students stay organized and productive. It includes:
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3 not-prose my-4">
                    <div className="flex items-center gap-2.5 rounded-xl bg-violet-500/10 p-3 text-xs font-medium text-foreground border border-violet-500/15">
                      <CheckCircle2 className="size-4 text-violet-500 shrink-0" />
                      <span>Task Management</span>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-xl bg-fuchsia-500/10 p-3 text-xs font-medium text-foreground border border-fuchsia-500/15">
                      <BarChart3 className="size-4 text-fuchsia-500 shrink-0" />
                      <span>Subject Analysis</span>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-xl bg-amber-500/10 p-3 text-xs font-medium text-foreground border border-amber-500/15">
                      <Calendar className="size-4 text-amber-500 shrink-0" />
                      <span>Upcoming Exams & Events</span>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-xl bg-emerald-500/10 p-3 text-xs font-medium text-foreground border border-emerald-500/15">
                      <Timer className="size-4 text-emerald-500 shrink-0" />
                      <span>Focus Timer (Pomodoro)</span>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-xl bg-cyan-500/10 p-3 text-xs font-medium text-foreground border border-cyan-500/15">
                      <BarChart3 className="size-4 text-cyan-500 shrink-0" />
                      <span>Personal Dashboard & Study Analytics</span>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-xl bg-purple-500/10 p-3 text-xs font-medium text-foreground border border-purple-500/15">
                      <Calculator className="size-4 text-purple-500 shrink-0" />
                      <span>Utilities: CGPA, Marks %, Age Calculator</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 my-4">
                    <p className="text-sm leading-relaxed text-foreground">
                      🎵 <strong>One of my favorite features is the built-in Lo-fi Music Player.</strong> As a programmer, I often listen to lo-fi music while solving problems because it helps me stay calm and focused. I wanted students to have that same distraction-free environment without needing another app.
                    </p>
                  </div>

                  <p className="text-base font-semibold text-foreground">
                    The goal of StudySpark is simple: <span className="text-violet-600 dark:text-violet-400">Everything a student needs, in one place.</span>
                  </p>

                  <p className="text-sm text-muted-foreground">
                    Building this project taught me much more than just coding. It taught me how solving your own problems can lead to creating something valuable for others.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-violet-500/15 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Code2 className="size-4 text-violet-500" />
                    <span>Crafted for students, by students</span>
                  </div>
                  <div className="flex gap-3">
                    <Link
                      href="/tools/pomodoro-timer"
                      className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-violet-700 transition-all"
                    >
                      Try Focus Timer
                    </Link>
                    <Link
                      href="/signup"
                      className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-500/20 transition-all"
                    >
                      Get Started Free
                    </Link>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Section Divider Header for Articles */}
          <div className="flex items-center justify-between border-b border-border/40 pb-4 mb-8">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Latest Articles & Guides
            </h2>
            <span className="text-xs text-muted-foreground">
              {BLOG_POSTS.length} Articles Published
            </span>
          </div>

          {/* Featured First Article Banner */}
          {BLOG_POSTS.length > 0 && (
            <div className="mb-10">
              <GlassCard className="p-6 sm:p-8 border-border/40 shadow-xl relative overflow-hidden group">
                <div className="flex flex-col lg:flex-row gap-6 items-start justify-between">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-600 dark:text-violet-300">
                        {BLOG_POSTS[0].category}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" /> {BLOG_POSTS[0].readTime}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      <Link href={`/blog/${BLOG_POSTS[0].slug}`}>
                        {BLOG_POSTS[0].title}
                      </Link>
                    </h3>
                    <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {BLOG_POSTS[0].excerpt}
                    </p>
                    <div className="mt-5">
                      <Link
                        href={`/blog/${BLOG_POSTS[0].slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                      >
                        Read Pillar Guide <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </div>
          )}

          {/* Grid of Remaining Articles */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BLOG_POSTS.slice(1).map((post) => (
              <GlassCard
                key={post.slug}
                hover
                className="p-6 flex flex-col justify-between h-full border-border/40 shadow-lg group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-300">
                      {post.category}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" /> {post.readTime}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors leading-snug">
                    <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{post.publishedAt}</span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-xs font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1 hover:underline"
                  >
                    Read <ArrowRight className="size-3" />
                  </Link>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Free Tools Banner */}
          <div className="mt-16 rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-8 text-center text-white shadow-2xl">
            <h2 className="text-2xl font-bold">Put These Tips Into Practice</h2>
            <p className="mt-2 text-sm text-white/85 max-w-lg mx-auto">
              Use StudySpark&apos;s Pomodoro timer, CGPA calculator, task planner, and study radio — free for all students.
            </p>
            <div className="mt-6 flex justify-center gap-3 flex-wrap">
              <Link
                href="/tools/pomodoro-timer"
                className="rounded-xl bg-white px-5 py-2.5 text-xs font-semibold text-violet-700 shadow-md hover:bg-white/90 transition-all"
              >
                Pomodoro Timer
              </Link>
              <Link
                href="/tools/cgpa-calculator"
                className="rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-all"
              >
                CGPA Calculator
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
