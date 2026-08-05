import type { Metadata } from "next";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Editorial Policy - StudySpark",
  description:
    "StudySpark's editorial standards for student guides, feature explanations, review notes, and corrections.",
  path: "/editorial-policy",
});

export default function EditorialPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:pt-32">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Editorial Policy
        </h1>
        <div className="mt-8 space-y-8">
          {[
            {
              title: "Student usefulness first",
              body: "Guides must answer a real student question with practical steps, examples, limits, and internal links to relevant tools or features.",
            },
            {
              title: "No unsupported proof",
              body: "StudySpark does not publish invented testimonials, fake review scores, unverifiable usage numbers, or guaranteed academic outcomes.",
            },
            {
              title: "Review and corrections",
              body: "Public guides are reviewed for clarity, claim discipline, and alignment with current StudySpark features. Corrections can be requested through the contact page.",
            },
            {
              title: "Tool limitations",
              body: "Planning, timers, analytics, and AI-assisted workflows can support study habits, but they do not replace official material, teacher feedback, or student judgment.",
            },
          ].map((section) => (
            <section key={section.title}>
              <h2 className="text-2xl font-bold">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
