import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AccentColorApplier } from "@/components/accent-color-applier";

/**
 * Font optimization:
 * - `display: "swap"` prevents invisible text (FOIT) while the font loads.
 *   Lighthouse penalizes FOIT as it blocks LCP text rendering.
 * - `preload: true` on the primary font (Geist Sans) ensures it's fetched
 *   early via a <link rel="preload"> in the document head.
 * - `preload: false` on Geist Mono — this is a monospace font used only in
 *   code blocks inside the dashboard, never above the fold. Not preloading it
 *   saves a network round trip on the landing page.
 */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://studysparks.cloud"),

  title: {
    default: "StudySpark – Student Productivity Platform",
    template: "%s | StudySpark",
  },

  description:
    "StudySpark helps students stay organized with task management, focus timer, calendar, events, and productivity analytics. Plan smarter and achieve your study goals.",

  applicationName: "StudySpark",

  keywords: [
    "StudySpark",
    "student planner",
    "student productivity",
    "study planner",
    "study tracker",
    "task manager",
    "focus timer",
    "pomodoro timer",
    "calendar",
    "exam planner",
    "assignment tracker",
    "study analytics",
    "student dashboard",
    "online planner",
  ],

  authors: [
    {
      name: "StudySpark",
      url: "https://studysparks.cloud",
    },
  ],

  creator: "StudySpark",

  publisher: "StudySpark",

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    url: "https://studysparks.cloud",
    title: "StudySpark – Student Productivity Platform",
    description:
      "Manage tasks, events, focus sessions and study analytics in one beautiful dashboard.",
    siteName: "StudySpark",
    locale: "en_US",

    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "StudySpark",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "StudySpark – Student Productivity Platform",
    description:
      "Organize tasks, focus better and track study progress with StudySpark.",
    images: ["/og-image.png"],
  },

  icons: {
    icon: [
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  manifest: "/site.webmanifest",

  category: "education",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {/*
         * Structured Data (JSON-LD) — strategy="beforeInteractive"
         *
         * JSON-LD is parsed by Google's crawler during the initial HTML parse,
         * not during JavaScript execution. Using "beforeInteractive" ensures it
         * is inlined in the page HTML immediately — visible to crawlers without
         * any JavaScript execution delay. This guarantees SEO structured data
         * is always present regardless of JS status.
         *
         * Previously "afterInteractive" meant crawlers might not see it if they
         * don't execute JS fully.
         */}
        <Script
          id="structured-data"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "StudySpark",
              url: "https://studysparks.cloud",
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web",
              description:
                "StudySpark is a student productivity platform that helps students manage tasks, events, focus sessions and analytics.",
            }),
          }}
        />

        {/*
         * Google AdSense — strategy="lazyOnload"
         *
         * Previously "afterInteractive" loaded AdSense as soon as the page
         * became interactive, which competed with LCP and TBT metrics.
         *
         * "lazyOnload" defers AdSense until the browser is fully idle after
         * all other page content has loaded. This prevents ads from blocking
         * or delaying the Largest Contentful Paint and Time to Interactive.
         *
         * Trade-off: Ads may appear slightly later on first load (~1-2s).
         * Ad revenue impact on a landing page is minimal since non-users
         * are unlikely to interact with ads before signing up.
         */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7098669863322522"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />

        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AccentColorApplier />
          {children}
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
