import type { Metadata } from "next";
import { Mail } from "lucide-react";
import { Footer } from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { createPageMetadata } from "@/lib/seo/metadata";
import { SITE_CONTACT_EMAIL } from "@/lib/seo/site";

export const metadata: Metadata = createPageMetadata({
  title: "Contact StudySpark",
  description:
    "Contact StudySpark for support, privacy questions, editorial corrections, and product feedback.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-28 sm:pt-32">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Contact StudySpark
        </h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          For account support, privacy requests, editorial corrections, or
          product feedback, email the StudySpark team directly.
        </p>
        <a
          href={`mailto:${SITE_CONTACT_EMAIL}`}
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-colors hover:bg-violet-700"
        >
          <Mail className="size-4" />
          {SITE_CONTACT_EMAIL}
        </a>
        <section className="mt-12 rounded-2xl border border-border/50 p-6">
          <h2 className="text-xl font-bold">What to include</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>Your account email if the message is about account support.</li>
            <li>The page URL if you are reporting a correction.</li>
            <li>A short description of the problem or requested change.</li>
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
}
