import { Navbar } from "./navbar";
import { Hero } from "./hero";
import dynamic from "next/dynamic";

import { LazyMotion, domAnimation } from "framer-motion";

/* Eagerly loaded sections (above the fold + critical for SEO) */
const WhyStudySpark = dynamic(() => import("./why-studyspark").then((m) => m.WhyStudySpark));

/* Lazily loaded sections (below the fold) */
const ProblemsSection = dynamic(() => import("./problems-solutions").then((m) => m.ProblemsSection));
const SolutionsSection = dynamic(() => import("./problems-solutions").then((m) => m.SolutionsSection));
const DashboardOverview = dynamic(() => import("./dashboard-overview").then((m) => m.DashboardOverview));
const Features = dynamic(() => import("./features").then((m) => m.Features));
const FeatureDeepDives = dynamic(() => import("./feature-deep-dives").then((m) => m.FeatureDeepDives));
const Benefits = dynamic(() => import("./benefits").then((m) => m.Benefits));
const HowItWorks = dynamic(() => import("./how-it-works").then((m) => m.HowItWorks));
const ProductivityTips = dynamic(() => import("./productivity-tips").then((m) => m.ProductivityTips));
const Testimonials = dynamic(() => import("./testimonials").then((m) => m.Testimonials));
const FaqSection = dynamic(() => import("./faq-section").then((m) => m.FaqSection));
const FinalCta = dynamic(() => import("./final-cta").then((m) => m.FinalCta));
const Pricing = dynamic(() => import("./pricing").then((m) => m.Pricing));
const Footer = dynamic(() => import("./footer").then((m) => m.Footer));

/**
 * LandingPage — the full marketing + content landing page for StudySpark.
 *
 * Renders a long-scroll homepage with 23 sections designed to:
 *  1. Provide genuine value (educational content, productivity tips)
 *  2. Build trust (social proof, testimonials, FAQ)
 *  3. Demonstrate the product (dashboard preview, feature deep-dives)
 *  4. Convert visitors (strategically placed CTAs)
 *  5. Satisfy Google AdSense content requirements (3,000+ words)
 *  6. Capture long-tail SEO keywords
 *
 * Section order follows a narrative arc:
 *   Attention → Interest → Understanding → Trust → Action
 */
export function LandingPage() {
  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen">
        <Navbar />
        <main>
          {/* 1. Hero — First impression + primary CTA */}
          <Hero />

          {/* 3. Why StudySpark — Value proposition */}
          <WhyStudySpark />

          {/* 4. Problems — Create empathy */}
          <ProblemsSection />

          {/* 5. Solutions — Position StudySpark as the answer */}
          <SolutionsSection />

          {/* 6. Dashboard Overview — Show the product */}
          <DashboardOverview />

          {/* 7. Features Overview — Quick summary grid */}
          <Features />

          {/* 8–16. Feature Deep-Dives — Detailed feature explanations */}
          <FeatureDeepDives />

          {/* 17. Benefits — Outcome-focused value */}
          <Benefits />

          {/* Pricing — Free tier details */}
          <Pricing />

          {/* 18. How It Works — Reduce friction */}
          <HowItWorks />

          {/* 19. Productivity Tips — CRITICAL for AdSense (educational content) */}
          <ProductivityTips />

          {/* 20. Testimonials — Social proof from real students */}
          <Testimonials />

          {/* 21. FAQ — Content depth + schema markup */}
          <FaqSection />

          {/* 22. Final CTA — Closing conversion */}
          <FinalCta />
        </main>

        {/* 23. Footer — Navigation hub + legal links */}
        <Footer />
      </div>
    </LazyMotion>
  );
}
