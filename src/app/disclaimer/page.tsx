import type { Metadata } from "next";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Disclaimer - StudySpark",
  description: "Read StudySpark's educational and product limitations.",
  path: "/disclaimer",
  index: false,
});

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:pt-32">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Disclaimer
        </h1>
        <div className="mt-8 space-y-5 text-sm leading-7 text-muted-foreground sm:text-base">
          <p>
            StudySpark provides educational productivity tools and study
            guidance. It does not guarantee grades, exam results, admission
            outcomes, scholarships, or professional advice.
          </p>
          <p>
            Students should verify important information with official course
            material, teachers, institutions, and exam authorities. AI-assisted
            outputs, generated practice questions, and extracted PDF answers can
            contain mistakes and should be checked against the source.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
