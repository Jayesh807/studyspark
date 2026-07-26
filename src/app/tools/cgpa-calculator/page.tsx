import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { CgpaCalculatorClient } from "./client";

export const metadata: Metadata = {
  title: "CGPA Calculator Online — Free Cumulative Grade Point Average Tool",
  description:
    "Calculate your Cumulative Grade Point Average (CGPA) and GPA quickly with StudySpark's free online CGPA calculator. Convert grades, track semester progress, and estimate required scores.",
  keywords: [
    "cgpa calculator",
    "gpa calculator",
    "calculate cgpa online",
    "cumulative grade point average",
    "college gpa calculator",
    "university grade calculator",
    "cgpa to percentage converter",
    "semester gpa calculator",
  ],
  alternates: {
    canonical: "/tools/cgpa-calculator",
  },
  openGraph: {
    title: "CGPA Calculator Online — Free Grade Calculator for Students",
    description:
      "Free interactive CGPA & GPA calculator with course credits, grading scales, step-by-step formulas, and grade planning tips.",
    url: "/tools/cgpa-calculator",
    type: "website",
  },
};

const FAQS = [
  {
    question: "What is CGPA and how is it calculated?",
    answer:
      "CGPA (Cumulative Grade Point Average) is the overall grade point average obtained by a student across all completed semesters in an academic program. It is calculated by taking the sum of total grade points earned across all courses (Grade Points × Course Credits) and dividing by the total credit hours attempted.",
  },
  {
    question: "What is the difference between GPA and CGPA?",
    answer:
      "GPA (Grade Point Average) typically measures performance in a single semester or term, whereas CGPA (Cumulative Grade Point Average) represents your cumulative performance across all completed semesters throughout your degree program.",
  },
  {
    question: "How do I convert CGPA to percentage?",
    answer:
      "In many university grading systems (such as CBSE or Indian universities), CGPA is converted to percentage by multiplying CGPA by 9.5 (Percentage = CGPA × 9.5). However, some institutions use specific conversion factors like multiplying by 10 or custom percentage charts, so always check your university's official handbook.",
  },
  {
    question: "Can I estimate what grade I need in upcoming semesters to reach my target CGPA?",
    answer:
      "Yes! By multiplying your desired target CGPA by total total degree credits, subtracting your current earned total points, and dividing by remaining credits, you can easily calculate the average GPA you must achieve in remaining semesters.",
  },
];

export default function CgpaCalculatorPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* FAQ & Tool Schema */}
      <Script
        id="cgpa-calculator-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "StudySpark Free CGPA Calculator",
              url: "https://studysparks.cloud/tools/cgpa-calculator",
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              description:
                "Calculate semester GPA, cumulative CGPA, course credit weightings, and target grade projections online for free.",
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
          {/* Breadcrumb Navigation */}
          <nav className="mb-4 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">CGPA Calculator</span>
          </nav>

          {/* Header */}
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300 mb-4">
              Free Student Tool
            </span>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
              Free Online <span className="text-gradient">CGPA & GPA Calculator</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-base text-muted-foreground leading-relaxed sm:text-lg">
              Calculate your cumulative grade point average, semester GPA, and credit weightings instantly. Designed for high school, college, and university students.
            </p>
          </div>

          {/* Interactive Calculator Component */}
          <div className="mb-16">
            <CgpaCalculatorClient />
          </div>

          {/* Long-form Educational Article Content (AdSense & SEO) */}
          <article className="prose prose-neutral max-w-none dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-violet-600 dark:prose-a:text-violet-400">
            <hr className="my-12 border-violet-500/10" />

            <h2>Understanding CGPA: The Complete Student Guide</h2>
            <p>
              Cumulative Grade Point Average (CGPA) is one of the most critical academic metrics in secondary and higher education worldwide. Whether you are applying for graduate school, scholarships, competitive internships, or entry-level careers, your CGPA serves as a standardized indicator of your academic dedication, consistency, and comprehension across your academic degree.
            </p>

            <h3>What is CGPA?</h3>
            <p>
              CGPA stands for <strong>Cumulative Grade Point Average</strong>. It represents the mean average of all grade points obtained by a student across all subjects and courses taken throughout their entire period of study. Unlike a single-term GPA, which reflects your academic performance in just one semester or trimester, CGPA aggregates your performance across multiple semesters to provide a comprehensive overall score.
            </p>

            <h3>How is CGPA Calculated? (Formula Explained)</h3>
            <p>
              The basic formula for calculating CGPA accounts for both the grade earned in each course and the number of credit hours (weight) allocated to that course:
            </p>
            <div className="my-6 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6 text-center font-mono text-sm leading-loose">
              <strong>CGPA = ∑ (Grade Points × Credit Hours) ÷ ∑ (Total Credit Hours)</strong>
            </div>

            <p>Here is a breakdown of the terms:</p>
            <ul>
              <li><strong>Grade Points:</strong> The numerical value assigned to a letter grade (e.g., A = 4.0, B = 3.0, C = 2.0, D = 1.0, F = 0.0).</li>
              <li><strong>Credit Hours:</strong> The weight or duration of the course (e.g., a core lecture course may be worth 4 credits, while a lab might be worth 1 or 2 credits).</li>
              <li><strong>Quality Points (Total Points):</strong> Calculated by multiplying the grade points earned in a course by its credit hours.</li>
            </ul>

            <div className="my-6 overflow-x-auto rounded-2xl border border-violet-500/15">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/50 text-foreground font-semibold">
                  <tr>
                    <th className="p-3">Letter Grade</th>
                    <th className="p-3">4.0 Scale Grade Point</th>
                    <th className="p-3">Percentage Equivalent (Approx)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 text-muted-foreground">
                  <tr><td className="p-3 font-medium text-foreground">A / A+</td><td className="p-3">4.0</td><td className="p-3">90% - 100%</td></tr>
                  <tr><td className="p-3 font-medium text-foreground">A-</td><td className="p-3">3.7</td><td className="p-3">85% - 89%</td></tr>
                  <tr><td className="p-3 font-medium text-foreground">B+</td><td className="p-3">3.3</td><td className="p-3">80% - 84%</td></tr>
                  <tr><td className="p-3 font-medium text-foreground">B</td><td className="p-3">3.0</td><td className="p-3">75% - 79%</td></tr>
                  <tr><td className="p-3 font-medium text-foreground">B-</td><td className="p-3">2.7</td><td className="p-3">70% - 74%</td></tr>
                  <tr><td className="p-3 font-medium text-foreground">C+</td><td className="p-3">2.3</td><td className="p-3">65% - 69%</td></tr>
                  <tr><td className="p-3 font-medium text-foreground">C</td><td className="p-3">2.0</td><td className="p-3">60% - 64%</td></tr>
                  <tr><td className="p-3 font-medium text-foreground">D</td><td className="p-3">1.0</td><td className="p-3">50% - 59%</td></tr>
                  <tr><td className="p-3 font-medium text-foreground">F</td><td className="p-3">0.0</td><td className="p-3">Below 50%</td></tr>
                </tbody>
              </table>
            </div>

            <h3>Step-by-Step Example Calculation</h3>
            <p>
              Suppose a student completes 4 courses in a semester:
            </p>
            <ol>
              <li><strong>Mathematics (4 Credits):</strong> Grade A (4.0 Points) → 4 × 4.0 = 16 Quality Points</li>
              <li><strong>Physics (3 Credits):</strong> Grade B+ (3.3 Points) → 3 × 3.3 = 9.9 Quality Points</li>
              <li><strong>Computer Science (3 Credits):</strong> Grade A- (3.7 Points) → 3 × 3.7 = 11.1 Quality Points</li>
              <li><strong>English Composition (2 Credits):</strong> Grade B (3.0 Points) → 2 × 3.0 = 6.0 Quality Points</li>
            </ol>
            <p>
              <strong>Total Credits = 4 + 3 + 3 + 2 = 12 Credits</strong><br />
              <strong>Total Quality Points = 16 + 9.9 + 11.1 + 6.0 = 43.0 Points</strong><br />
              <strong>Semester GPA = 43.0 ÷ 12 = 3.58 GPA</strong>
            </p>

            <h3>Why Maintaining a High CGPA Matters</h3>
            <ul>
              <li><strong>Graduate School Admissions:</strong> Master&apos;s and Doctoral programs frequently establish minimum CGPA cutoffs (often 3.0 or 3.5 on a 4.0 scale) for application eligibility.</li>
              <li><strong>Scholarships and Financial Aid:</strong> Academic merit scholarships often require maintaining a specific cumulative GPA to renew funding each academic year.</li>
              <li><strong>Career and Campus Placement:</strong> Top-tier consulting, technology, finance, and engineering firms often use candidate CGPA as an initial filtering criterion during campus recruitments.</li>
              <li><strong>Honors and Distinction:</strong> Graduation honors like <em>Cum Laude</em>, <em>Magna Cum Laude</em>, and <em>Summa Cum Laude</em> are awarded strictly based on final cumulative grade point averages.</li>
            </ul>

            <h3>Practical Strategies to Improve Your CGPA</h3>
            <p>
              If your current CGPA is lower than your target goal, don&apos;t panic. Strategic planning and consistent study habits can make a dramatic difference:
            </p>
            <ol>
              <li><strong>Focus heavily on high-credit courses:</strong> Because courses with 4 or 5 credits carry more statistical weight than 1-credit courses, achieving high grades in heavy-credit subjects has a larger positive impact on your CGPA.</li>
              <li><strong>Use a Focus Timer during study blocks:</strong> Build concentration with the Pomodoro technique. Work for 25 minutes uninterrupted, then take a 5-minute break to prevent burnout.</li>
              <li><strong>Organize your deadlines with a dedicated student planner:</strong> Use <Link href="/">StudySpark</Link> to schedule assignments, track upcoming exams, and set daily task priorities so you never lose marks due to missed deadlines.</li>
              <li><strong>Retake courses if permitted:</strong> Many universities allow students to retake courses where they earned low grades, replacing the original grade in the CGPA calculation.</li>
            </ol>

            <hr className="my-10 border-violet-500/10" />

            <h2>Frequently Asked Questions (FAQ)</h2>
            <div className="space-y-6 not-prose my-8">
              {FAQS.map((faq) => (
                <div key={faq.question} className="glass-strong rounded-2xl p-5">
                  <h4 className="text-base font-semibold text-foreground">{faq.question}</h4>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>

            {/* CTA Box */}
            <div className="not-prose my-12 rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-8 text-center text-white shadow-2xl">
              <h3 className="text-2xl font-bold">Organize Your Studies with StudySpark</h3>
              <p className="mt-2 text-sm text-white/90 max-w-xl mx-auto">
                Track tasks, focus sessions, exam countdowns, study analytics, and tools like this calculator in one calm student workspace. Free forever.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/signup"
                  className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-violet-700 shadow-lg hover:bg-white/90 transition-all"
                >
                  Create Free Workspace
                </Link>
                <Link
                  href="/features"
                  className="rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-all"
                >
                  Explore All Features
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
