import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { AccentColorApplier } from "@/components/accent-color-applier";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7098669863322522"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {/* Structured Data for Google */}
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
              description:
                "StudySpark is a student productivity platform that helps students manage tasks, events, focus sessions and analytics.",
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
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  );
}
