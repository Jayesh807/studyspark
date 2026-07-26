import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";

export const metadata: Metadata = {
  title: "Privacy Policy — StudySpark",
  description:
    "Read StudySpark's privacy policy. Learn how we collect, use, and protect your personal data when you use our student productivity platform.",
  alternates: {
    canonical: "/privacy-policy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-3xl px-4 pt-24 pb-20 sm:pt-28">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Last updated: July 2026
        </p>

        <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert prose-headings:font-semibold prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-violet-600 dark:prose-a:text-violet-400">
          <h2>1. Introduction</h2>
          <p>
            Welcome to StudySpark (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;). We are committed to protecting your privacy and ensuring you understand how we collect, use, and safeguard your personal information when you use our student productivity platform at studysparks.cloud (the &ldquo;Service&rdquo;).
          </p>
          <p>
            This Privacy Policy describes the types of information we collect from users of our Service, how we use that information, and the choices you have regarding your data. By using StudySpark, you agree to the collection and use of information in accordance with this policy.
          </p>

          <h2>2. Information We Collect</h2>
          <h3>2.1 Account Information</h3>
          <p>
            When you create a StudySpark account, we collect the information you provide during registration, including your name, email address, and password. Your password is securely hashed and never stored in plain text.
          </p>

          <h3>2.2 Usage Data</h3>
          <p>
            When you use StudySpark, we collect data related to your use of the platform, including tasks created, study sessions logged, calendar events, exam information, and analytics data. This data is used to provide you with the core functionality of the Service, including study analytics and progress tracking.
          </p>

          <h3>2.3 Device and Browser Information</h3>
          <p>
            We may automatically collect certain information about your device and browser, including your browser type, operating system, device type, screen resolution, and language preferences. This information helps us optimize the Service for different devices and identify and fix technical issues.
          </p>

          <h3>2.4 Cookies and Local Storage</h3>
          <p>
            StudySpark uses cookies and browser local storage to maintain your session, remember your preferences (such as theme and accent color), and provide a seamless experience across visits. For more details about our cookie practices, please see our <Link href="/cookie-policy">Cookie Policy</Link>.
          </p>

          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect for the following purposes:</p>
          <ul>
            <li><strong>Providing the Service:</strong> To create and manage your account, store your tasks, subjects, exams, calendar events, and study sessions, and to generate study analytics.</li>
            <li><strong>Improving the Service:</strong> To understand how users interact with StudySpark so we can improve features, fix bugs, and enhance the user experience.</li>
            <li><strong>Communication:</strong> To send you important service-related notifications, such as account verification, security alerts, and updates about significant changes to the Service.</li>
            <li><strong>Security:</strong> To detect, prevent, and address technical issues, fraud, and security vulnerabilities.</li>
          </ul>

          <h2>4. Data Sharing and Disclosure</h2>
          <p>
            We do not sell, rent, or trade your personal information to third parties. We may share your information only in the following limited circumstances:
          </p>
          <ul>
            <li><strong>Service Providers:</strong> We may share information with trusted third-party service providers who assist us in operating the Service (e.g., hosting providers, database services). These providers are contractually obligated to protect your data and use it only for the purposes we specify.</li>
            <li><strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency).</li>
            <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you of any such change.</li>
          </ul>

          <h2>5. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. These measures include encrypted data transmission (HTTPS/TLS), secure password hashing (bcrypt), and regular security reviews. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>

          <h2>6. Data Retention</h2>
          <p>
            We retain your personal information for as long as your account is active or as needed to provide you with the Service. If you delete your account, we will delete your personal data within 30 days, except where we are required to retain it for legal or regulatory purposes.
          </p>

          <h2>7. Your Rights and Choices</h2>
          <p>You have the following rights regarding your personal data:</p>
          <ul>
            <li><strong>Access:</strong> You can request a copy of the personal data we hold about you.</li>
            <li><strong>Correction:</strong> You can update or correct your account information at any time through your profile settings.</li>
            <li><strong>Deletion:</strong> You can request deletion of your account and associated data through your account settings.</li>
            <li><strong>Data Export:</strong> You can export your study data from the settings panel in your dashboard.</li>
            <li><strong>Opt-out:</strong> You can opt out of non-essential communications at any time.</li>
          </ul>

          <h2>8. Children&apos;s Privacy</h2>
          <p>
            StudySpark is designed to be used by students of all ages. We do not knowingly collect personally identifiable information from children under the age of 13 without parental consent. If you are a parent or guardian and believe your child has provided us with personal information without your consent, please contact us, and we will take steps to delete that information.
          </p>

          <h2>9. Third-Party Services</h2>
          <p>
            StudySpark may contain links to third-party websites or integrate with third-party services (such as YouTube for the study radio feature). This Privacy Policy does not apply to third-party services, and we encourage you to review their respective privacy policies.
          </p>

          <h2>10. Google AdSense</h2>
          <p>
            StudySpark uses Google AdSense to display advertisements on certain pages of the website. Google AdSense may use cookies and similar technologies to serve ads based on your prior visits to our website or other websites. You can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>. For more information about how Google uses data, please visit <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">Google&apos;s Privacy & Terms page</a>.
          </p>

          <h2>11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &ldquo;Last updated&rdquo; date at the top. We encourage you to review this Privacy Policy periodically for any changes.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
