import type { Metadata } from "next";
import { ContactPage } from "@/components/contact/contact-page";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact StudySpark for support, feedback, partnerships, and business inquiries.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact StudySpark",
    description:
      "Contact StudySpark for support, feedback, partnerships, and business inquiries.",
    url: "/contact",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Contact StudySpark",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact StudySpark",
    description:
      "Contact StudySpark for support, feedback, partnerships, and business inquiries.",
    images: ["/og-image.png"],
  },
};

export default function Page() {
  return <ContactPage />;
}
