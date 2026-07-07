import type { Metadata } from "next";
import { AboutPage } from "@/components/about/about-page";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn why StudySpark was created, our mission, vision, values and how our all-in-one student productivity platform helps students plan, focus and grow.",
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About StudySpark",
    description:
      "StudySpark helps students organize tasks, subjects, exams, calendars, focus sessions, study plans and productivity analytics in one calm workspace.",
    url: "/about",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "About StudySpark",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About StudySpark",
    description:
      "Meet the mission, vision and values behind StudySpark, the all-in-one student productivity platform.",
    images: ["/og-image.png"],
  },
  keywords: [
    "About StudySpark",
    "student productivity platform",
    "study planner",
    "student task manager",
    "exam planner",
    "Pomodoro study app",
    "productivity analytics for students",
  ],
};

export default function Page() {
  return <AboutPage />;
}
