import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { PercentageCalculatorClient } from "./client";

export const metadata: Metadata = {
  title: "Percentage Calculator Online — Calculate Marks & Subject Percentages",
  description:
    "Free online percentage calculator for students. Calculate total mark percentages, percentage change, and score increases easily.",
  keywords: [
    "percentage calculator",
    "calculate percentage",
    "mark percentage calculator",
    "exam percentage calculator",
    "percentage change calculator",
    "student percentage calculator",
  ],
  alternates: {
    canonical: "/tools/percentage-calculator",
  },
  openGraph: {
    title: "Percentage Calculator Online — Free Academic Utility Tool",
    description:
      "Calculate exam mark percentages, score differences, and grade percentages online for free.",
    url: "/tools/percentage-calculator",
    type: "website",
  },
};

const FAQS = [
  {
    question: "How do you calculate percentage of marks?",
    answer:
      "To calculate your percentage of marks, divide the total marks obtained by the maximum total marks possible, and then multiply the result by 100. Formula: Percentage = (Obtained Marks ÷ Total Marks) × 100.",
  },
  {
    question: "How do I calculate percentage change or increase?",
    answer:
      "Percentage change is calculated by subtracting the old value from the new value, dividing by the old value, and multiplying by 100. Formula: Percentage Change = ((New Value - Old Value) ÷ Old Value) × 100.",
  },
  {
    question: "Why are percentage calculators helpful for students?",
    answer:
      "Percentage calculators allow students to quickly determine exam scores, weight coursework contributions, convert test results into letter grades, and track score improvements across semesters.",
  },
];

export default function PercentageCalculatorPage() {
  return (
    <div className="min-h-screen bg-background">
      <Script
        id="percentage-calculator-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "StudySpark Percentage Calculator",
              url: "https://studysparks.cloud/tools/percentage-calculator",
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              description:
                "Calculate student marks, percentage change, and ratio values online.",
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
            <span className="text-foreground font-medium">Percentage Calculator</span>
          </nav>

          {/* Header */}
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300 mb-4">
              Free Student Tool
            </span>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
              Online <span className="text-gradient">Percentage Calculator</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-base text-muted-foreground leading-relaxed sm:text-lg">
              Quickly calculate test percentages, mark totals, percentage changes, and grade distributions with precision.
            </p>
          </div>

          {/* Calculator Client */}
          <div className="mb-16">
            <PercentageCalculatorClient />
          </div>

          {/* Educational Content */}
          <article className="prose prose-neutral max-w-none dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-violet-600 dark:prose-a:text-violet-400">
            <hr className="my-12 border-violet-500/10" />

            <h2>The Complete Guide to Percentage Calculations in School</h2>
            <p>
              Percentages are used universally in schools, universities, and competitive exams to quantify performance, determine class rankings, evaluate test results, and weight assignments toward final grades. Understanding how percentages are calculated is fundamental to academic planning.
            </p>

            <h3>How to Calculate Exam Percentage</h3>
            <p>
              When you receive your exam marks, converting them into a percentage allows you to compare performance across different tests that had varying maximum scores.
            </p>

            <div className="my-6 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6 text-center font-mono text-sm leading-loose">
              <strong>Percentage (%) = (Marks Obtained ÷ Total Marks) × 100</strong>
            </div>

            <p><strong>Example:</strong> If you scored 42 marks out of 50 on a Midterm Chemistry Exam:</p>
            <p className="font-mono text-sm">Percentage = (42 ÷ 50) × 100 = 0.84 × 100 = 84%</p>

            <h3>Calculating Weighted Assignment Scores</h3>
            <p>
              Course syllabi often assign weight percentages to different types of assignments (for example, Homework = 20%, Midterm = 30%, Final Exam = 50%). To calculate your overall course score:
            </p>
            <ol>
              <li>Multiply your percentage score in each component by its designated syllabus weight.</li>
              <li>Add the weighted products together.</li>
            </ol>
            <p><strong>Example:</strong></p>
            <ul>
              <li>Homework score: 90% (Weight 20%) → 90 × 0.20 = 18.0 points</li>
              <li>Midterm score: 80% (Weight 30%) → 80 × 0.30 = 24.0 points</li>
              <li>Final exam score: 88% (Weight 50%) → 88 × 0.50 = 44.0 points</li>
              <li><strong>Final Weighted Course Grade = 18.0 + 24.0 + 44.0 = 86.0%</strong></li>
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
              <h3 className="text-2xl font-bold">Never Fall Behind on Studies</h3>
              <p className="mt-2 text-sm text-white/90 max-w-xl mx-auto">
                Use StudySpark to schedule your revision blocks, track focus hours, plan upcoming exams, and access study tools in one place.
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
