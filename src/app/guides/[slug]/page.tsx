import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { JsonLd } from "@/components/seo/json-ld";
import { getFeature } from "@/content/features";
import { getCategory, getGuide, REVIEWED_GUIDES } from "@/content/guides";
import { createPageMetadata } from "@/lib/seo/metadata";
import { articleSchema, breadcrumbSchema } from "@/lib/seo/schema";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return REVIEWED_GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) {
    return {};
  }

  return createPageMetadata({
    title: `${guide.title} - StudySpark Guide`,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    type: "article",
    publishedTime: guide.publishedAt,
    modifiedTime: guide.updatedAt,
    authors: [guide.editor],
  });
}

export default async function GuideArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) {
    notFound();
  }

  const category = getCategory(guide.category);
  const relatedFeatures = guide.relatedFeatures
    .map((featureSlug) => getFeature(featureSlug))
    .filter(Boolean);
  const relatedGuides = guide.relatedGuides
    .map((guideSlug) => getGuide(guideSlug))
    .filter(Boolean);

  const path = `/guides/${guide.slug}`;

  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        id={`article-${guide.slug}`}
        data={articleSchema({
          title: guide.title,
          description: guide.description,
          path,
          publishedAt: guide.publishedAt,
          updatedAt: guide.updatedAt,
          authorName: guide.editor,
        })}
      />
      <JsonLd
        id={`breadcrumb-${guide.slug}`}
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: guide.title, path },
        ])}
      />
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:pt-32">
        <Link
          href="/guides"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:underline dark:text-violet-400"
        >
          <ArrowLeft className="size-3.5" />
          Back to guides
        </Link>

        <article className="mt-8">
          <header>
            {category && (
              <Link
                href={`/guides/category/${category.slug}`}
                className="inline-flex rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-600 dark:text-violet-300"
              >
                {category.title}
              </Link>
            )}
            <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
              {guide.title}
            </h1>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {guide.description}
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" />
                {guide.readTime}
              </span>
              <span>Updated {guide.updatedAt}</span>
              <span>{guide.editor}</span>
            </div>
          </header>

          <section className="mt-10 rounded-2xl border border-violet-500/15 bg-violet-500/5 p-6">
            <h2 className="text-xl font-bold">{guide.question}</h2>
            <ul className="mt-4 space-y-3">
              {guide.checklist.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-10 space-y-10">
            {guide.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-bold tracking-tight">{section.heading}</h2>
                <div className="mt-4 space-y-4">
                  {section.body.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-sm leading-7 text-muted-foreground sm:text-base"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <aside className="mt-12 rounded-2xl border border-border/50 p-5">
            <h2 className="text-lg font-bold">Review note</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {guide.reviewerNote}
            </p>
          </aside>

          {(relatedFeatures.length > 0 || relatedGuides.length > 0) && (
            <section className="mt-12">
              <h2 className="text-2xl font-bold">Next resources</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {relatedFeatures.map((feature) => (
                  <Link
                    key={feature!.slug}
                    href={feature!.status === "indexable" ? feature!.path : "/features"}
                    className="rounded-2xl border border-border/50 p-5 transition-colors hover:border-violet-500/40"
                  >
                    <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                      Feature
                    </span>
                    <h3 className="mt-2 inline-flex items-center gap-2 font-semibold">
                      {feature!.title}
                      <ArrowRight className="size-4" />
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {feature!.description}
                    </p>
                  </Link>
                ))}
                {relatedGuides.map((related) => (
                  <Link
                    key={related!.slug}
                    href={`/guides/${related!.slug}`}
                    className="rounded-2xl border border-border/50 p-5 transition-colors hover:border-violet-500/40"
                  >
                    <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                      Guide
                    </span>
                    <h3 className="mt-2 font-semibold">{related!.title}</h3>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
}
