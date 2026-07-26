import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { FaqSection } from "@/components/landing/faq-section";

export const metadata: Metadata = {
  title: "Frequently Asked Questions (FAQ) — StudySpark",
  description:
    "Find answers to common questions about StudySpark features, task management, focus timer, privacy, pricing, and account support.",
  keywords: [
    "studyspark faq",
    "student productivity questions",
    "how to use studyspark",
    "study planner support",
  ],
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "Frequently Asked Questions — StudySpark",
    description: "Get quick answers to all your questions about StudySpark.",
    url: "/faq",
    type: "website",
  },
};

export default function StandaloneFaqPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-28 pb-20 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300 mb-4">
              Help Center
            </span>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-base text-muted-foreground leading-relaxed sm:text-lg">
              Everything you need to know about StudySpark tools, privacy, features, and getting started.
            </p>
          </div>

          <FaqSection />

          <div className="mt-12 text-center rounded-2xl glass p-8 border border-violet-500/15">
            <h2 className="text-xl font-bold">Have a question not listed here?</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Our support team is happy to help you with your account or feedback.
            </p>
            <div className="mt-6">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:brightness-110 transition-all"
              >
                Contact Support Team
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
