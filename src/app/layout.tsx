import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AccentColorApplier } from "@/components/accent-color-applier";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { AdSenseScript } from "@/components/adsense-script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://studysparks.cloud"),

  title: {
    default: "StudySpark – Student Productivity Platform",
    template: "%s | StudySpark",
  },

  description:
    "StudySpark helps students stay organized with task management, focus timer, calendar, study tools (GPA, Age & Unit calculators), Study Radio, and productivity analytics. Plan smarter and achieve your study goals.",

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
    "gpa calculator",
    "cgpa calculator",
    "age calculator",
    "lofi study music",
    "study radio",
    "unit converter",
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
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
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
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {/* Google AdSense — conditional, only on content pages */}
        <AdSenseScript />

        {/* Structured Data — WebApplication */}
        <Script
          id="structured-data"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "StudySpark",
              url: "https://studysparks.cloud",
              applicationCategory: "EducationalApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.9",
                ratingCount: "312",
                bestRating: "5",
              },
              description:
                "StudySpark is a free all-in-one student productivity platform with task management, Pomodoro focus timer, calendar planning, study analytics, exam tracking, CGPA calculator, and study radio. Designed for students by students.",
            }),
          }}
        />

        {/* Structured Data — Organization */}
        <Script
          id="org-schema"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "StudySpark",
              url: "https://studysparks.cloud",
              logo: "https://studysparks.cloud/icon-512.png",
              sameAs: [
                "https://www.instagram.com/studysparks.cloud/",
                "https://x.com/Jayesho1",
                "https://www.linkedin.com/in/jayesh-malviya-b30229318/",
                "https://www.youtube.com/channel/UCpygC2ZTTUE8RKpt9SuA9Ow",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                email: "support@studysparks.cloud",
                contactType: "customer support",
              },
            }),
          }}
        />

        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AccentColorApplier />
          {children}
          <PwaInstallPrompt />
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
