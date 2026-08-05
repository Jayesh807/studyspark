import type { Metadata } from "next";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Terms and Conditions - StudySpark",
  description: "Read StudySpark's terms and conditions for using the service.",
  path: "/terms-and-conditions",
  index: false,
});

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:pt-32">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Terms and Conditions
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Last updated: August 5, 2026
        </p>
        <div className="mt-8 space-y-7 text-sm leading-7 text-muted-foreground sm:text-base">
          <section>
            <h2 className="text-2xl font-bold text-foreground">Use of StudySpark</h2>
            <p className="mt-3">
              StudySpark is provided as a student productivity service for task
              planning, revision organization, focus sessions, analytics, and
              study tools. You are responsible for the information you enter and
              how you use the service.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-foreground">Accounts</h2>
            <p className="mt-3">
              Keep your account credentials secure and contact StudySpark if you
              believe your account has been accessed without permission.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-foreground">Educational limits</h2>
            <p className="mt-3">
              StudySpark can support organization and review, but it does not
              guarantee academic results or replace official instructions from
              your school, college, teacher, or exam authority.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-bold text-foreground">Changes</h2>
            <p className="mt-3">
              StudySpark may update features, availability, pricing, and these
              terms as the product develops. Continued use after an update means
              you accept the updated terms.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
