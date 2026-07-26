import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Cookie Policy — StudySpark",
  description:
    "Learn how StudySpark uses cookies and browser local storage to maintain session state, theme preferences, and functional performance.",
  alternates: {
    canonical: "/cookie-policy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 pt-24 pb-20 sm:pt-28">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Cookie Policy
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Last updated: July 2026
        </p>

        <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-violet-600 dark:prose-a:text-violet-400">
          <h2>1. What Are Cookies?</h2>
          <p>
            Cookies are small text files that are stored on your computer or mobile device when you visit a website. They are widely used to make websites work efficiently, remember your preferences, and provide analytical information to site owners.
          </p>

          <h2>2. How StudySpark Uses Cookies & Local Storage</h2>
          <p>
            StudySpark uses cookies and local browser storage strictly to deliver core platform functionalities and maintain user session security:
          </p>
          <ul>
            <li><strong>Essential Session Cookies:</strong> Used to authenticate your login state and secure your user session when accessing your study workspace.</li>
            <li><strong>Preference Local Storage:</strong> Remembers your chosen UI theme (light/dark mode) and accent color preferences across page reloads.</li>
            <li><strong>AdSense Cookies:</strong> Used by Google AdSense on public content pages to serve relevant non-intrusive advertisements.</li>
          </ul>

          <h2>3. Managing Cookie Preferences</h2>
          <p>
            You can control and manage cookies through your web browser settings. Most browsers allow you to refuse or delete cookies. Please note that disabling essential cookies may impact your ability to log in or use certain interactive features of StudySpark.
          </p>

          <h2>4. Contact Us</h2>
          <p>
            If you have any questions regarding our Cookie Policy, please contact us at <a href="mailto:support@studysparks.cloud">support@studysparks.cloud</a>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
