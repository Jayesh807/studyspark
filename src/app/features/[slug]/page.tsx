import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { JsonLd } from "@/components/seo/json-ld";
import { createPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema } from "@/lib/seo/schema";
import { INDEXABLE_FEATURES, getFeature } from "@/content/features";
import { getGuide } from "@/content/guides";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return INDEXABLE_FEATURES.map((feature) => ({ slug: feature.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const feature = getFeature(slug);

  if (!feature || feature.status !== "indexable") {
    return {};
  }

  return createPageMetadata({
    title: `${feature.title} - StudySpark Features`,
    description: feature.description,
    path: feature.path,
  });
}

export default async function FeatureDetailRoute({ params }: PageProps) {
  const { slug } = await params;
  const feature = getFeature(slug);

  if (!feature || feature.status !== "indexable") {
    notFound();
  }

  const Icon = feature.icon;
  const relatedGuides = feature.relatedGuides
    .map((guideSlug) => getGuide(guideSlug))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <JsonLd
        id={`breadcrumb-${feature.slug}`}
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Features", path: "/features" },
          { name: feature.title, path: feature.path },
        ])}
      />
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 pb-20 pt-28 sm:pt-32">
        <Link
          href="/features"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:underline dark:text-violet-400"
        >
          <ArrowLeft className="size-3.5" />
          Back to features
        </Link>

        <header className="mt-8 grid gap-8 lg:grid-cols-[1fr_18rem] lg:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-600 dark:text-violet-300">
              <Icon className="size-3.5" />
              Student feature guide
            </div>
            <h1 className="mt-5 text-balance text-4xl font-bold tracking-tight sm:text-5xl">
              {feature.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {feature.description}
            </p>
          </div>

          <aside className="rounded-2xl border border-violet-500/15 bg-violet-500/5 p-5">
            <h2 className="text-sm font-semibold">Best for</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {feature.audience}
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Updated {feature.updatedAt}
            </p>
          </aside>
        </header>

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border/50 p-6">
            <h2 className="text-xl font-bold">Problem it solves</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {feature.problem}
            </p>
          </div>
          <div className="rounded-2xl border border-border/50 p-6">
            <h2 className="text-xl font-bold">Student example</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {feature.example}
            </p>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold">How to use it well</h2>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2">
            {feature.steps.map((step, index) => (
              <li
                key={step}
                className="rounded-2xl border border-border/50 bg-muted/20 p-5 text-sm"
              >
                <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                  Step {index + 1}
                </span>
                <p className="mt-2 text-muted-foreground">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold">Good practices</h2>
            <ul className="mt-4 space-y-3">
              {feature.practices.map((practice) => (
                <li key={practice} className="flex gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <span>{practice}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <ShieldAlert className="size-5 text-amber-600" />
              Limits to know
            </h2>
            <ul className="mt-4 space-y-3">
              {feature.limitations.map((limit) => (
                <li key={limit} className="text-sm leading-relaxed text-muted-foreground">
                  {limit}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-violet-500/15 bg-violet-500/5 p-6">
          <h2 className="text-2xl font-bold">Privacy note</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {feature.privacy}
          </p>
        </section>

        {feature.faq.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold">Questions students ask</h2>
            <div className="mt-5 grid gap-4">
              {feature.faq.map((item) => (
                <div key={item.question} className="rounded-2xl border border-border/50 p-5">
                  <h3 className="font-semibold">{item.question}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {(relatedGuides.length > 0 || feature.relatedTools?.length) && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold">Related resources</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {relatedGuides.map((guide) => (
                <Link
                  key={guide!.slug}
                  href={`/guides/${guide!.slug}`}
                  className="rounded-2xl border border-border/50 p-5 transition-colors hover:border-violet-500/40"
                >
                  <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                    Guide
                  </span>
                  <h3 className="mt-2 font-semibold">{guide!.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {guide!.description}
                  </p>
                </Link>
              ))}
              {feature.relatedTools?.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="rounded-2xl border border-border/50 p-5 transition-colors hover:border-violet-500/40"
                >
                  <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
                    Tool
                  </span>
                  <h3 className="mt-2 inline-flex items-center gap-2 font-semibold">
                    {tool.label}
                    <ArrowRight className="size-4" />
                  </h3>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
