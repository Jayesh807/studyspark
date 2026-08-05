import type { Metadata } from "next";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { createPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "About StudySpark",
  description:
    "Learn what StudySpark is, who it is for, and how the student productivity workspace is maintained.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:pt-32">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          About StudySpark
        </h1>
        <div className="mt-8 space-y-6 text-sm leading-7 text-muted-foreground sm:text-base">
          <p>
            StudySpark is a student productivity workspace for planning tasks,
            organizing exam revision, running focus sessions, and reviewing
            study activity in one place.
          </p>
          <p>
            The public site is maintained as a practical resource library. Its
            guides focus on study planning, active recall, focus routines,
            typing practice, and responsible use of PDF-based study tools.
          </p>
          <p>
            StudySpark does not promise grades or exam results. The tools are
            meant to support better organization and reflection; students should
            still use teacher guidance, official materials, feedback, practice
            questions, sleep, and honest review.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
