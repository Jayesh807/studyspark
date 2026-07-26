import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Terms of Service — StudySpark",
  description:
    "Read StudySpark's Terms of Service. Understand the rules, rights, and responsibilities when using our student productivity platform.",
  alternates: {
    canonical: "/terms",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 pt-24 pb-20 sm:pt-28">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Last updated: July 2026
        </p>

        <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-violet-600 dark:prose-a:text-violet-400">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using StudySpark at studysparks.cloud (the &ldquo;Service&rdquo;), you agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;). If you do not agree to these Terms, you may not access or use the Service. These Terms apply to all visitors, users, and others who access or use the Service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            StudySpark is a free, web-based student productivity platform that provides tools for task management, calendar planning, Pomodoro focus timing, study analytics, exam tracking, student calculators, and ambient study music. The Service is designed to help students organize their academic life and build productive study habits.
          </p>

          <h2>3. User Accounts</h2>
          <h3>3.1 Registration</h3>
          <p>
            To access certain features of the Service, you must create an account by providing accurate, current, and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
          </p>

          <h3>3.2 Account Security</h3>
          <p>
            You agree to immediately notify us of any unauthorized use of your account or any other breach of security. StudySpark will not be liable for any loss or damage arising from your failure to comply with this security obligation.
          </p>

          <h3>3.3 Account Termination</h3>
          <p>
            You may delete your account at any time through your profile settings. We reserve the right to suspend or terminate your account if you violate these Terms or engage in any activity that may harm the Service or other users.
          </p>

          <h2>4. User Content</h2>
          <h3>4.1 Your Data</h3>
          <p>
            You retain all rights to the content and data you create within the Service, including tasks, notes, subjects, events, and study records. By using the Service, you grant StudySpark a limited license to store, process, and display your content solely for the purpose of providing the Service to you.
          </p>

          <h3>4.2 Content Standards</h3>
          <p>
            You agree not to use the Service to store, transmit, or distribute any content that is unlawful, harmful, threatening, abusive, defamatory, obscene, or otherwise objectionable. StudySpark reserves the right to remove any content that violates these standards.
          </p>

          <h2>5. Acceptable Use</h2>
          <p>When using StudySpark, you agree not to:</p>
          <ul>
            <li>Use the Service for any unlawful purpose or in violation of any applicable laws or regulations.</li>
            <li>Attempt to gain unauthorized access to the Service, other user accounts, or any systems or networks connected to the Service.</li>
            <li>Interfere with or disrupt the integrity or performance of the Service or the data contained therein.</li>
            <li>Use automated tools, bots, or scrapers to access the Service without our express written permission.</li>
            <li>Reverse engineer, decompile, or disassemble any aspect of the Service.</li>
            <li>Impersonate any person or entity, or falsely claim an affiliation with any person or entity.</li>
            <li>Use the Service to send unsolicited communications (spam) to other users.</li>
          </ul>

          <h2>6. Intellectual Property</h2>
          <p>
            The Service, including its original content, features, functionality, design, and branding, is and will remain the exclusive property of StudySpark and its licensors. The Service is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
          </p>

          <h2>7. Free Service and Pricing</h2>
          <p>
            StudySpark&apos;s core features are provided free of charge. We reserve the right to introduce premium features or paid tiers in the future. Any such changes will be clearly communicated in advance, and existing free features will continue to be available at no cost as described at the time of your registration.
          </p>

          <h2>8. Third-Party Services</h2>
          <p>
            The Service may contain links to or integrate with third-party websites, services, or content (including YouTube for study radio). StudySpark does not endorse or assume any responsibility for any third-party sites, services, or content. Your use of third-party services is subject to their respective terms of service and privacy policies.
          </p>

          <h2>9. Disclaimers</h2>
          <p>
            The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without any warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement. StudySpark does not warrant that the Service will be uninterrupted, timely, secure, or error-free.
          </p>

          <h2>10. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by applicable law, in no event shall StudySpark, its directors, employees, partners, agents, suppliers, or affiliates be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or use of the Service.
          </p>

          <h2>11. Modifications to Terms</h2>
          <p>
            We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide notice prior to any new terms taking effect. Your continued use of the Service after any changes constitutes acceptance of the new Terms.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
