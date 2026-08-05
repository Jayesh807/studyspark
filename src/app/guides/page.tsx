import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { createPageMetadata } from "@/lib/seo/metadata";
import { GUIDE_CATEGORIES, REVIEWED_GUIDES, getGuidesByCategory } from "@/content/guides";

export const metadata: Metadata = createPageMetadata({
  title: "Study Guides - StudySpark",
  description:
    "Practical study guides for revision planning, exam preparation, focus routines, typing practice, and responsible PDF study tools.",
  path: "/guides",
});

export default function GuidesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-28 sm:pt-32">
        <header className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-600 dark:text-violet-300">
            <BookOpen className="size-3.5" />
            Reviewed student resources
          </span>
          <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            Study guides for planning, revision, and focused work
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Each guide is written for a specific student question and links back
            to the StudySpark feature or tool that can support the workflow.
          </p>
        </header>

        <section className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {GUIDE_CATEGORIES.map((category) => {
            const count = getGuidesByCategory(category.slug).length;
            return (
              <Link
                key={category.slug}
                href={`/guides/category/${category.slug}`}
                className="rounded-2xl border border-border/50 p-5 transition-colors hover:border-violet-500/40"
              >
                <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                  {count} guides
                </span>
                <h2 className="mt-2 text-xl font-bold">{category.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {category.description}
                </p>
              </Link>
            );
          })}
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold">All reviewed guides</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {REVIEWED_GUIDES.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="rounded-2xl border border-border/50 p-5 transition-colors hover:border-violet-500/40"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                  {guide.readTime}
                </span>
                <h3 className="mt-2 text-lg font-bold">{guide.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {guide.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
                  Read guide
                  <ArrowRight className="size-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
