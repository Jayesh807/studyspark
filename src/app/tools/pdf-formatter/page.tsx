import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { PdfFormatterClient } from "./client";

export const metadata: Metadata = {
  title: "Free AI PDF Formatter — Convert Study Notes to Print-Ready PDF",
  description:
    "Instantly convert AI-generated study notes into a beautiful, print-ready PDF. Supports LaTeX math, Hindi text, code blocks, tables, and A4 layout. Free for students.",
  keywords: [
    "pdf formatter",
    "AI notes to PDF",
    "study notes PDF",
    "latex to pdf",
    "hindi pdf formatter",
    "print ready notes",
    "markdown to pdf",
    "study notes formatter",
    "free pdf generator for students",
    "math formula pdf",
  ],
  alternates: {
    canonical: "/tools/pdf-formatter",
  },
  openGraph: {
    title: "Free AI PDF Formatter — Convert Study Notes to Print-Ready PDF",
    description:
      "Paste AI-generated notes, get a professional A4 document with math, Hindi, code, and tables. Download as HTML or PDF.",
    url: "/tools/pdf-formatter",
    type: "website",
  },
};

const FAQS = [
  {
    question: "What types of content can I format into a PDF?",
    answer:
      "You can paste any AI-generated or hand-written study notes. The formatter supports Markdown headings, LaTeX math formulas, Python/JavaScript/C++ code blocks, markdown tables, Hindi (Devanagari) text, bullet lists, numbered lists, and note/warning boxes.",
  },
  {
    question: "How do I add mathematical formulas?",
    answer:
      "Use standard LaTeX syntax. For inline math, wrap in dollar signs: $E = mc^2$. For display (block) math, use double dollar signs on their own line: $$\\vec{F} = ma$$. The formatter renders all formulas using MathJax — no broken symbols.",
  },
  {
    question: "Does it support Hindi and Devanagari script?",
    answer:
      "Yes. Select 'Hindi' or 'Mixed' in the Language dropdown. The formatter loads Noto Sans Devanagari — a Unicode font that renders all Hindi characters, matra, anusvaar, chandrabindu, and conjunct consonants correctly. Hindi text is never converted to garbled symbols.",
  },
  {
    question: "How do I save it as a PDF?",
    answer:
      "Click 'Open & Print', then in the browser print dialog choose 'Save as PDF'. This gives the best quality for math and Hindi fonts. Alternatively, click 'Download PDF' to get a server-generated PDF instantly.",
  },
  {
    question: "Is there a character limit?",
    answer:
      "The formatter supports up to 15,000 characters in a single document. For longer content, split into multiple chapters and format each separately.",
  },
];

export default function PdfFormatterPage() {
  return (
    <div className="min-h-screen bg-background">
      <Script
        id="pdf-formatter-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "StudySpark PDF Formatter",
              url: "https://studysparks.cloud/tools/pdf-formatter",
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              description:
                "Convert AI-generated study notes into professional print-ready PDFs with full math, Hindi, and code support.",
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQS.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer,
                },
              })),
            },
          ]),
        }}
      />

      <Navbar />

      <main className="pt-24 sm:pt-28 pb-20 px-4">
        <div className="mx-auto max-w-6xl">
          {/* Breadcrumbs */}
          <nav className="mb-4 flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/tools" className="hover:text-foreground transition-colors">
              Tools
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">PDF Formatter</span>
          </nav>

          {/* Page Header */}
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300 mb-4">
              Free Student Tool
            </span>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-balance">
              AI Notes to{" "}
              <span className="text-gradient">PDF Formatter</span>
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-base text-muted-foreground leading-relaxed sm:text-lg">
              Paste any AI-generated study content and instantly get a
              professional, print-ready A4 document — with math formulas, Hindi
              text, syntax-highlighted code, and tables rendered perfectly.
            </p>
            {/* Feature badges */}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                "📐 LaTeX Math via MathJax",
                "🇮🇳 Hindi Devanagari",
                "💻 Code Blocks",
                "📊 Tables",
                "📄 A4 Print Layout",
                "⬇️ Download HTML & PDF",
              ].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-muted border border-border/60 px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* ── The Tool ── */}
          <div className="mb-20">
            <PdfFormatterClient />
          </div>

          {/* ── Educational Article ── */}
          <article className="prose prose-neutral max-w-none dark:prose-invert prose-headings:font-bold prose-headings:tracking-tight prose-a:text-violet-600 dark:prose-a:text-violet-400">
            <hr className="my-12 border-violet-500/10" />

            <h2>Why Professional PDF Formatting Matters for Students</h2>
            <p>
              When you generate study notes with an AI assistant, the raw output is
              rarely ready to share, submit, or print. Mathematical formulas appear
              as raw LaTeX code, Hindi text renders as garbled symbols in basic
              editors, code snippets lose their indentation, and tables collapse
              into unreadable text. StudySpark&apos;s PDF Formatter solves all of
              this with a single click.
            </p>

            <h3>Full MathJax Support — No More Broken Formulas</h3>
            <p>
              Physics, chemistry, mathematics, and engineering notes are full of
              equations. A properly formatted document renders{" "}
              <code>$$\vec{"{F}"} = ma$$</code> as a beautifully typeset
              display equation, not as raw ASCII. Our formatter uses{" "}
              <strong>MathJax 3</strong> — the same engine used by Wikipedia and
              arXiv — to render every LaTeX expression correctly in your browser
              before you print.
            </p>

            <h3>Correct Hindi and Devanagari Rendering</h3>
            <p>
              Students studying in Hindi medium — or subjects like Sanskrit,
              Hindi literature, or regional language papers — often find that PDFs
              break their text into unreadable characters like{" "}
              <code>â€™</code> or <code>Ã</code>. Our formatter uses{" "}
              <strong>Noto Sans Devanagari</strong>, a Unicode font that renders
              every Hindi character, मात्रा, संयुक्त अक्षर, अनुस्वार, और
              चंद्रबिंदु correctly — just as they appear when you type them.
            </p>

            <h3>Code Blocks with Syntax Awareness</h3>
            <p>
              Programming students can paste code inside triple backtick blocks
              (like GitHub Markdown). The formatter wraps each block in a dark
              code panel with <strong>JetBrains Mono</strong> — a professional
              coding font — preserving every space, indent, bracket, and
              operator exactly as written.
            </p>

            <h3>How to Get the Best PDF Quality</h3>
            <ol>
              <li>
                Paste your content in the input panel. Use the <strong>Load sample</strong>{" "}
                button to see an example with math, code, and a table.
              </li>
              <li>
                Set the <strong>document title</strong> and optional subtitle.
              </li>
              <li>
                Choose your <strong>language</strong> (English, Hindi, or Mixed).
                Enable <strong>MathJax</strong> if your content has formulas.
              </li>
              <li>
                Click <strong>Format Document</strong>. The preview iframe shows
                the formatted A4 document immediately.
              </li>
              <li>
                To save as PDF: click <strong>Open &amp; Print</strong>, then in
                Chrome or Edge choose <em>Save as PDF</em> from the print dialog.
                This produces the highest-quality output with all fonts and math
                rendered correctly.
              </li>
            </ol>

            <hr className="my-10 border-violet-500/10" />

            <h2>Frequently Asked Questions</h2>
            <div className="space-y-6 not-prose my-8">
              {FAQS.map((faq) => (
                <div key={faq.question} className="glass-strong rounded-2xl p-5">
                  <h4 className="text-base font-semibold text-foreground">
                    {faq.question}
                  </h4>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="not-prose my-12 rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-8 text-center text-white shadow-2xl">
              <h3 className="text-2xl font-bold">
                Organize All Your Study Notes in One Place
              </h3>
              <p className="mt-2 text-sm text-white/90 max-w-xl mx-auto">
                StudySpark gives you a full productivity dashboard — task
                management, Pomodoro timer, calendar, analytics, and AI study
                tools — all completely free.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/signup"
                  className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-violet-700 shadow-lg hover:bg-white/90 transition-all"
                >
                  Create Free Account
                </Link>
              </div>
            </div>
          </article>
        </div>
      </main>

      <Footer />
    </div>
  );
}
