import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import { Suspense } from "react";
import { AccentColorApplier } from "@/components/accent-color-applier";
import { AdSenseScript } from "@/components/adsense-script";
import { PwaInstallPrompt } from "@/components/pwa-install-prompt";
import { TopProgressBar } from "@/components/shared/top-progress-bar";
import { JsonLd } from "@/components/seo/json-ld";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { createDefaultMetadata } from "@/lib/seo/metadata";
import { organizationSchema, websiteSchema } from "@/lib/seo/schema";

const GOOGLE_ANALYTICS_ID = "G-G3PFDZL17W";

const poppins = Poppins({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#090d16" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  ...createDefaultMetadata(),
  metadataBase: new URL("https://studysparks.cloud"),
  title: {
    default: "StudySparks – AI Study Tools & PDF Quiz Generator for Exam Prep",
    template: "%s | Study Sparks",
  },
  description:
    "StudySparks offers AI study tools to turn PDFs, lecture notes, and study materials into quizzes, practice tests, questions, and study guides. Create AI-generated quizzes with different question types and difficulty levels to prepare smarter for exams.",
  applicationName: "Study Sparks",
  keywords: [
    "StudySpark",
    "student planner",
    "student productivity",
    "study planner",
    "revision planner",
    "study tracker",
    "task manager",
    "focus timer",
    "pomodoro timer",
    "exam planner",
    "study analytics",
    "student dashboard",
    "gpa calculator",
    "cgpa calculator",
    "study guides",
  ],
  authors: [
    {
      name: "StudySpark",
      url: "https://studysparks.cloud",
    },
  ],
  creator: "StudySpark",
  publisher: "StudySpark",
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
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className="scroll-smooth">
      <body
        className={`${poppins.variable} font-sans antialiased bg-background text-foreground`}
      >
        <Script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
          strategy="beforeInteractive"
        />
        <Script
          id="google-analytics"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', '${GOOGLE_ANALYTICS_ID}');
            `,
          }}
        />
        <AdSenseScript />
        <JsonLd id="website-schema" data={websiteSchema()} />
        <JsonLd id="organization-schema" data={organizationSchema()} />

        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <TopProgressBar />
          </Suspense>
          <AccentColorApplier />
          {children}
          <PwaInstallPrompt />
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
