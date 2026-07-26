import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Script from "next/script";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { BLOG_POSTS } from "@/lib/blog-data";
import { Clock, ArrowLeft, ArrowRight, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return {};

  return {
    title: `${post.title} — StudySpark Blog`,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `/blog/${post.slug}`,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author.name],
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const otherPosts = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-background">
      {/* Article Schema */}
      <Script
        id={`article-schema-${post.slug}`}
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt,
            author: {
              "@type": "Person",
              name: post.author.name,
              jobTitle: post.author.role,
            },
            publisher: {
              "@type": "Organization",
              name: "StudySpark",
              logo: {
                "@type": "ImageObject",
                url: "https://studysparks.cloud/icon-512.png",
              },
            },
            datePublished: post.publishedAt,
            mainEntityOfPage: `https://studysparks.cloud/blog/${post.slug}`,
          }),
        }}
      />

      <Navbar />

      <main className="pt-24 sm:pt-28 pb-20 px-4">
        <article className="mx-auto max-w-3xl">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
            >
              <ArrowLeft className="size-3.5" /> Back to Blog Journal
            </Link>
          </div>

          {/* Article Header */}
          <header className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-600 dark:text-violet-300">
                {post.category}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="size-3" /> {post.readTime}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-foreground text-balance leading-tight">
              {post.title}
            </h1>

            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>

            <div className="mt-6 flex items-center gap-3 border-y border-border/40 py-4 text-xs text-muted-foreground">
              <div className="flex size-8 items-center justify-center rounded-full bg-violet-500 text-white font-bold text-xs">
                {post.author.avatar}
              </div>
              <div>
                <p className="font-semibold text-foreground">{post.author.name}</p>
                <p className="text-[10px]">{post.author.role} • {post.publishedAt}</p>
              </div>
            </div>
          </header>

          {/* Related Tool Banner if available */}
          {post.relatedTool && (
            <div className="mb-10 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-4 flex items-center justify-between gap-4">
              <div className="text-xs text-violet-700 dark:text-violet-300">
                <span className="font-bold">💡 Recommended Tool for this Guide:</span> Use our interactive student utility.
              </div>
              <Link
                href={post.relatedTool.href}
                className="shrink-0 rounded-xl bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-violet-700 transition-all flex items-center gap-1"
              >
                {post.relatedTool.name} <ArrowRight className="size-3" />
              </Link>
            </div>
          )}

          {/* Markdown Content */}
          <div className="prose prose-neutral max-w-none dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-violet-600 dark:prose-a:text-violet-400 prose-p:leading-relaxed prose-li:leading-relaxed">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          {/* Article Footer CTA */}
          <div className="mt-14 rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-8 text-center text-white shadow-2xl">
            <h3 className="text-2xl font-bold">Try StudySpark Free Today</h3>
            <p className="mt-2 text-sm text-white/90 max-w-lg mx-auto">
              Bring your task planner, study analytics, Pomodoro timer, and course schedule into one calm workspace.
            </p>
            <div className="mt-6">
              <Link
                href="/signup"
                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-violet-700 shadow-lg hover:bg-white/90 transition-all inline-block"
              >
                Create Free Workspace
              </Link>
            </div>
          </div>

          {/* More Articles Section */}
          {otherPosts.length > 0 && (
            <div className="mt-16 pt-10 border-t border-border/40">
              <h3 className="text-xl font-bold mb-6">Read More Articles</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {otherPosts.map((op) => (
                  <div key={op.slug} className="glass-strong rounded-2xl p-5 border border-border/40">
                    <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-300 uppercase tracking-wider">
                      {op.category}
                    </span>
                    <h4 className="text-base font-bold text-foreground mt-1 leading-snug">
                      <Link href={`/blog/${op.slug}`} className="hover:text-violet-600 transition-colors">
                        {op.title}
                      </Link>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{op.excerpt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
}
