import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { AgeCalculatorClient } from "./client";

export const metadata: Metadata = {
  title: "Age Calculator Online — Calculate Exact Age in Years, Months & Days",
  description:
    "Free online age calculator for students. Calculate exact age in years, months, weeks, days, and hours from date of birth.",
  keywords: [
    "age calculator",
    "calculate age online",
    "date of birth calculator",
    "exact age calculator",
    "student age calculator",
    "age in days calculator",
  ],
  alternates: {
    canonical: "/tools/age-calculator",
  },
  openGraph: {
    title: "Age Calculator Online — Free Student Utility Tool",
    description:
      "Calculate your precise age in years, months, days, and total hours instantly online.",
    url: "/tools/age-calculator",
    type: "website",
  },
};

const FAQS = [
  {
    question: "How does the online age calculator work?",
    answer:
      "The age calculator takes your date of birth and compares it against the target date (or today's date), accurately adjusting for leap years, month lengths, and time differences to compute your exact age in years, months, and days.",
  },
  {
    question: "Why do students use an age calculator for admission forms?",
    answer:
      "Many college applications, university eligibility forms, competitive exams, and government scholarships specify exact age cutoffs (e.g., must be 18 years, 3 months or younger on a specific date). This tool calculates exact eligibility instantly.",
  },
];

export default function AgeCalculatorPage() {
  return (
    <div className="min-h-screen bg-background">
      <Script
        id="age-calculator-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "StudySpark Age Calculator",
              url: "https://studysparks.cloud/tools/age-calculator",
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              description:
                "Calculate exact age in years, months, days, and hours online.",
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
            <span className="text-foreground font-medium">Age Calculator</span>
          </nav>

          {/* Header */}
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300 mb-4">
              Free Student Tool
            </span>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
              Free Online <span className="text-gradient">Age Calculator</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-base text-muted-foreground leading-relaxed sm:text-lg">
              Calculate your exact age in years, months, weeks, days, and hours from your birth date.
            </p>
          </div>

          {/* Calculator Client */}
          <div className="mb-16">
            <AgeCalculatorClient />
          </div>

          {/* Educational Content */}
          <article className="prose prose-neutral max-w-none dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-violet-600 dark:prose-a:text-violet-400">
            <hr className="my-12 border-violet-500/10" />

            <h2>Understanding Age Calculations for Application Requirements</h2>
            <p>
              Whether you are submitting university admission paperwork, applying for study abroad visas, registering for standardized entrance exams, or applying for competitive scholarships, knowing your exact chronological age down to the day is frequently required.
            </p>

            <h3>How Age Calculation Accounting Works</h3>
            <p>
              Calculating age manually can be tricky due to variations in calendar month lengths (28, 30, or 31 days) and leap years (February having 29 days every 4 years). Our algorithm accounts for:
            </p>
            <ul>
              <li><strong>Leap Years:</strong> Adds an extra day for leap years occurring in your lifespan.</li>
              <li><strong>Variable Month Lengths:</strong> Calculates exact day offsets based on the target month in the Gregorian calendar.</li>
              <li><strong>Total Conversions:</strong> Converts total lifespan into total days, total weeks, and total elapsed hours.</li>
            </ul>

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
              <h3 className="text-2xl font-bold">Plan Your Semester with StudySpark</h3>
              <p className="mt-2 text-sm text-white/90 max-w-xl mx-auto">
                Keep your assignments, exams, focus sessions, and study tools organized in one workspace. Core tools are currently free.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/signup"
                  className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-violet-700 shadow-lg hover:bg-white/90 transition-all"
                >
                  Get Started Free
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
