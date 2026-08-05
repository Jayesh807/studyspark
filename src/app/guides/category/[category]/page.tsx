import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import {
  GUIDE_CATEGORIES,
  type GuideCategorySlug,
  getCategory,
  getGuidesByCategory,
} from "@/content/guides";
import { createPageMetadata } from "@/lib/seo/metadata";

interface PageProps {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return GUIDE_CATEGORIES.map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    return {};
  }

  return createPageMetadata({
    title: `${category.title} Guides - StudySpark`,
    description: category.description,
    path: `/guides/category/${category.slug}`,
  });
}

export default async function GuideCategoryPage({ params }: PageProps) {
  const { category: slug } = await params;
  const category = getCategory(slug);

  if (!category) {
    notFound();
  }

  const guides = getGuidesByCategory(category.slug as GuideCategorySlug);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pb-20 pt-28 sm:pt-32">
        <Link
          href="/guides"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:underline dark:text-violet-400"
        >
          <ArrowLeft className="size-3.5" />
          Back to guides
        </Link>

        <header className="mt-8 max-w-3xl">
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            {category.title} Guides
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {category.description}
          </p>
        </header>

        <section className="mt-10 grid gap-4 md:grid-cols-2">
          {guides.map((guide) => (
            <Link
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="rounded-2xl border border-border/50 p-5 transition-colors hover:border-violet-500/40"
            >
              <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                {guide.readTime}
              </span>
              <h2 className="mt-2 text-xl font-bold">{guide.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {guide.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
                Read guide
                <ArrowRight className="size-3.5" />
              </span>
            </Link>
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
