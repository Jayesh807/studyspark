"use client";

import { m } from "framer-motion";
import { SectionHeading } from "./section-heading";
import { GlassCard } from "@/components/shared/motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Script from "next/script";

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_CATEGORIES: { title: string; items: FaqItem[] }[] = [
  {
    title: "General",
    items: [
      {
        question: "What is StudySpark?",
        answer:
          "StudySpark is a free, all-in-one student productivity platform that brings task management, calendar planning, Pomodoro focus timer, study analytics, exam tracking, and student utilities together in one beautifully designed workspace. It's built specifically for students by students.",
      },
      {
        question: "Is StudySpark really free?",
        answer:
          "Yes, StudySpark is completely free to use. All core features — tasks, calendar, focus timer, analytics, exam tracker, study radio, and student calculators — are included at no cost. No credit card is required, and there are no hidden fees. A premium Pro tier with advanced features like AI study plans and collaboration is planned for the future, but the core platform will always remain free.",
      },
      {
        question: "Who is StudySpark designed for?",
        answer:
          "StudySpark is designed for students at any level — high school, undergraduate, and graduate students. Whether you're managing a few classes or juggling a full course load with extracurriculars, StudySpark helps you stay organized and focused. It's especially useful for students who find themselves using multiple separate apps for planning, timing, and tracking.",
      },
      {
        question: "What makes StudySpark different from Notion or Google Calendar?",
        answer:
          "While Notion is a powerful general-purpose workspace and Google Calendar is a great scheduling tool, neither is purpose-built for students. StudySpark integrates tasks, calendar, focus timer, exam tracking, analytics, and study-specific tools in one unified interface. You don't need to set up templates, connect integrations, or build your own system — everything works together out of the box and is designed around the rhythms of academic life.",
      },
    ],
  },
  {
    title: "Features",
    items: [
      {
        question: "What features are included in StudySpark?",
        answer:
          "StudySpark includes a smart task manager with priorities and categories, a student calendar with event and deadline tracking, a Pomodoro-style focus timer with subject tagging, detailed study analytics with charts and trends, an exam tracker with countdowns, an integrated study radio with lo-fi beats, and a student toolbox with CGPA calculator, percentage calculator, age calculator, and unit converter.",
      },
      {
        question: "How does the Pomodoro focus timer work?",
        answer:
          "The Pomodoro timer divides your study time into focused 25-minute blocks with 5-minute breaks. You can tag each session with a specific subject so your study hours are automatically categorized in your analytics. The timer includes customizable session lengths, ambient sounds, and a focus mode to help you stay in flow. After four Pomodoro cycles, you're prompted to take a longer break.",
      },
      {
        question: "How does the study analytics feature work?",
        answer:
          "StudySpark automatically tracks every focus session, completed task, and study activity. The analytics dashboard displays your data as beautiful charts including weekly study hour trends, subject distribution breakdowns, task completion rates, daily activity patterns, and productivity streaks. These insights help you understand where your time goes and make informed decisions about how to adjust your study strategy.",
      },
      {
        question: "Can I calculate my CGPA with StudySpark?",
        answer:
          "Yes, StudySpark includes a free CGPA/GPA calculator as part of the Student Toolbox. You can enter your subjects, credit hours, and grades to calculate your cumulative grade point average. The calculator supports multiple grading scales and helps you understand what grades you need to achieve your target CGPA.",
      },
    ],
  },
  {
    title: "Privacy & Security",
    items: [
      {
        question: "Is my data private and secure?",
        answer:
          "Absolutely. StudySpark is built with a privacy-first approach. Your study data is stored securely, we don't sell your data to third parties, and we don't use your information for targeted advertising. You have full control over your data and can export or delete it at any time. We use industry-standard encryption to protect your information.",
      },
      {
        question: "Does StudySpark work offline?",
        answer:
          "StudySpark is a progressive web app (PWA) with offline capabilities. Once you've loaded the app, many features continue to work without an internet connection. Your data syncs automatically when you're back online. You can install StudySpark on your device's home screen for an app-like experience.",
      },
      {
        question: "Is StudySpark safe for students under 18?",
        answer:
          "Yes. StudySpark does not collect unnecessary personal information, does not include social features that could expose minors, and does not serve targeted advertising. The platform is designed to be a safe, focused study environment suitable for students of all ages.",
      },
    ],
  },
  {
    title: "Getting Started",
    items: [
      {
        question: "How do I create an account?",
        answer:
          "Click 'Get Started' or 'Sign Up' on the homepage. Enter your name, email address, and a password. Your account is created instantly and you can start setting up your study workspace immediately. The entire process takes less than thirty seconds.",
      },
      {
        question: "Can I use StudySpark on my phone?",
        answer:
          "Yes, StudySpark works on any device with a web browser — laptops, tablets, and smartphones. As a progressive web app, you can also install it on your phone's home screen for quick access. The interface is fully responsive and optimized for touch screens.",
      },
      {
        question: "How do I contact support?",
        answer:
          "You can reach our support team by emailing support@studysparks.cloud, or visit the Contact page on our website. We also offer technical support at tech@studysparks.cloud for bug reports and technical issues. We typically respond within 24 hours on business days.",
      },
      {
        question: "Can I export or delete my data?",
        answer:
          "Yes. StudySpark respects your right to your data. You can export your tasks, subjects, and study data from the settings panel. If you wish to delete your account and all associated data, you can do so from your profile settings or by contacting support.",
      },
    ],
  },
];

// Flatten all FAQ items for schema markup
const ALL_FAQS = FAQ_CATEGORIES.flatMap((cat) => cat.items);

export function FaqSection() {
  return (
    <section
      id="faq"
      className="relative scroll-mt-24 px-4 py-16 sm:py-24"
      aria-label="Frequently asked questions"
    >
      {/* FAQPage structured data */}
      <Script
        id="faq-schema"
        type="application/ld+json"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: ALL_FAQS.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.answer,
              },
            })),
          }),
        }}
      />

      <div className="mx-auto max-w-4xl">
        <SectionHeading
          eyebrow="FAQ"
          title="Frequently Asked"
          highlight="Questions"
          description="Everything you need to know about StudySpark. Can't find your answer? Contact us and we'll be happy to help."
        />

        <div className="mt-10 flex flex-col gap-6">
          {FAQ_CATEGORIES.map((category) => (
            <m.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <GlassCard className="overflow-hidden p-4 sm:p-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-300">
                  {category.title}
                </h3>
                <Accordion type="single" collapsible className="w-full">
                  {category.items.map((faq, index) => (
                    <AccordionItem
                      key={faq.question}
                      value={`${category.title}-${index}`}
                      className="border-violet-500/10"
                    >
                      <AccordionTrigger className="rounded-xl px-2 text-left text-base font-semibold hover:no-underline sm:px-3">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="px-2 text-sm leading-relaxed text-muted-foreground sm:px-3">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </GlassCard>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
