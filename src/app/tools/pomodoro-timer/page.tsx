import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { PomodoroTimerClient } from "./client";

export const metadata: Metadata = {
  title: "Free Pomodoro Timer Online — Deep Work Study Timer",
  description:
    "Free online Pomodoro timer for students. Boost focus, prevent study burnout, and build productive study sessions with custom work & break intervals.",
  keywords: [
    "pomodoro timer",
    "study timer online",
    "pomodoro technique",
    "focus timer for students",
    "online study timer",
    "deep work timer",
    "free pomodoro app",
  ],
  alternates: {
    canonical: "/tools/pomodoro-timer",
  },
  openGraph: {
    title: "Free Pomodoro Study Timer Online — Boost Focus & Retention",
    description:
      "Interactive online Pomodoro timer with customizable work and break intervals, audio cues, and study habit guides.",
    url: "/tools/pomodoro-timer",
    type: "website",
  },
};

const FAQS = [
  {
    question: "What is the Pomodoro Technique?",
    answer:
      "The Pomodoro Technique is a time management method developed by Francesco Cirillo in the late 1980s. It uses a timer to break work into intervals, traditionally 25 minutes in length, separated by short 5-minute breaks.",
  },
  {
    question: "How long should a Pomodoro study session be?",
    answer:
      "The standard Pomodoro interval is 25 minutes of work followed by a 5-minute break. After completing four work intervals (Pomodoros), you take a longer break of 15 to 30 minutes to recharge.",
  },
  {
    question: "Why is the Pomodoro Technique effective for studying?",
    answer:
      "By establishing defined start and end times for each work block, it reduces procrastination, prevents cognitive burnout, builds urgency, and trains your brain to maintain deep focus without distraction.",
  },
];

export default function PomodoroTimerPage() {
  return (
    <div className="min-h-screen bg-background">
      <Script
        id="pomodoro-timer-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "StudySpark Online Pomodoro Timer",
              url: "https://studysparks.cloud/tools/pomodoro-timer",
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              description:
                "Free interactive Pomodoro focus timer for studying with customizable intervals and audio notifications.",
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQS.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer,
                },
              })),
            },
          ]),
        }}
      />

      <Navbar />

      <main className="pt-24 sm:pt-28 pb-20 px-4">
        <div className="mx-auto max-w-4xl">
          {/* Breadcrumbs */}
          <nav className="mb-4 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Pomodoro Timer</span>
          </nav>

          {/* Header */}
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300 mb-4">
              Free Student Tool
            </span>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
              Free Online <span className="text-gradient">Pomodoro Study Timer</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-base text-muted-foreground leading-relaxed sm:text-lg">
              Boost your study focus, eliminate distractions, and prevent mental burnout with our free interactive Pomodoro timer.
            </p>
          </div>

          {/* Calculator / Timer Client */}
          <div className="mb-16">
            <PomodoroTimerClient />
          </div>

          {/* Educational Content (1,200+ Words) */}
          <article className="prose prose-neutral max-w-none dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-violet-600 dark:prose-a:text-violet-400">
            <hr className="my-12 border-violet-500/10" />

            <h2>Mastering the Pomodoro Technique for Academic Success</h2>
            <p>
              Staying focused during long study sessions is one of the greatest challenges students face. Between social media notifications, phone calls, and the natural fatigue of long reading hours, maintaining continuous concentration requires a deliberate structure.
            </p>

            <h3>What is the Pomodoro Technique?</h3>
            <p>
              The Pomodoro Technique was created in the late 1980s by university student Francesco Cirillo. Struggling to concentrate on his studies, Cirillo challenged himself to commit to 10 minutes of uninterrupted study using a tomato-shaped kitchen timer (&quot;pomodoro&quot; in Italian).
            </p>

            <h3>How the 6-Step Pomodoro Cycle Works</h3>
            <ol>
              <li><strong>Choose a specific task:</strong> Select a clear subject, assignment, or chapter to work on.</li>
              <li><strong>Set the timer for 25 minutes:</strong> Commit to working only on this task during the block.</li>
              <li><strong>Work without interruptions:</strong> Put your phone away, close irrelevant browser tabs, and focus.</li>
              <li><strong>Stop when the timer rings:</strong> Put a checkmark on a piece of paper or log your session.</li>
              <li><strong>Take a short 5-minute break:</strong> Stand up, stretch, grab water, or rest your eyes.</li>
              <li><strong>Every 4 cycles, take a long break:</strong> After completing 4 Pomodoros (approx. 2 hours of study time), take a 15–30 minute break.</li>
            </ol>

            <h3>The Cognitive Science Behind Timed Focus Blocks</h3>
            <p>
              Human attention spans naturally fluctuate. Psychological studies on attention span indicate that sustained attention begins to drop significantly after 20–30 minutes of continuous cognitive effort. Taking structured, short breaks reloads your working memory capacity and prevents physical and mental fatigue.
            </p>

            <hr className="my-10 border-violet-500/10" />

            <h2>Frequently Asked Questions</h2>
            <div className="space-y-6 not-prose my-8">
              {FAQS.map((faq) => (
                <div key={faq.question} className="glass-strong rounded-2xl p-5">
                  <h4 className="text-base font-semibold text-foreground">{faq.question}</h4>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="not-prose my-12 rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-8 text-center text-white shadow-2xl">
              <h3 className="text-2xl font-bold">Track Your Focus Hours Automatically</h3>
              <p className="mt-2 text-sm text-white/90 max-w-xl mx-auto">
                StudySpark automatically tracks your Pomodoro study sessions by subject, giving you detailed analytics, heatmaps, and weekly habit insights.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/signup"
                  className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-violet-700 shadow-lg hover:bg-white/90 transition-all"
                >
                  Create Free Account
                </Link>
              </div>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
