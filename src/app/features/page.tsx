import { Metadata } from "next";
import { FeaturesPage } from "@/components/features/features-page";

export const metadata: Metadata = {
  title: "Features - StudySpark",
  description:
    "Explore all the features of StudySpark: Smart tasks, focus timer, calendar, subject organization, and deep analytics designed specifically for students.",
  alternates: {
    canonical: "https://studysparks.cloud/features",
  },
  openGraph: {
    title: "Features - StudySpark",
    description: "Explore all the student-focused tools included in StudySpark.",
    url: "https://studysparks.cloud/features",
    siteName: "StudySpark",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "StudySpark Features",
      },
    ],
    locale: "en_US",
    type: "website",
  },
};

export default function FeaturesRoute() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "StudySpark Features",
            description: "Explore all the features of StudySpark.",
            url: "https://studysparks.cloud/features",
          }),
        }}
      />
      <FeaturesPage />
    </>
  );
}
