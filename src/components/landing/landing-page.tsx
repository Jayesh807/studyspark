import dynamic from "next/dynamic";
import { LazyMotion, domAnimation } from "framer-motion";
import { Hero } from "./hero";
import { Navbar } from "./navbar";

const WhyStudySpark = dynamic(() =>
  import("./why-studyspark").then((m) => m.WhyStudySpark)
);
const ProblemsSection = dynamic(() =>
  import("./problems-solutions").then((m) => m.ProblemsSection)
);
const SolutionsSection = dynamic(() =>
  import("./problems-solutions").then((m) => m.SolutionsSection)
);
const DashboardOverview = dynamic(() =>
  import("./dashboard-overview").then((m) => m.DashboardOverview)
);
const Features = dynamic(() => import("./features").then((m) => m.Features));
const FeatureDeepDives = dynamic(() =>
  import("./feature-deep-dives").then((m) => m.FeatureDeepDives)
);
const Benefits = dynamic(() => import("./benefits").then((m) => m.Benefits));
const Pricing = dynamic(() => import("./pricing").then((m) => m.Pricing));
const HowItWorks = dynamic(() => import("./how-it-works").then((m) => m.HowItWorks));
const ProductivityTips = dynamic(() =>
  import("./productivity-tips").then((m) => m.ProductivityTips)
);
const FaqSection = dynamic(() => import("./faq-section").then((m) => m.FaqSection));
const FinalCta = dynamic(() => import("./final-cta").then((m) => m.FinalCta));
const Footer = dynamic(() => import("./footer").then((m) => m.Footer));

export function LandingPage() {
  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen">
        <Navbar />
        <main>
          <Hero />
          <div className="landing-deferred-section">
            <WhyStudySpark />
          </div>
          <div className="landing-deferred-section">
            <ProblemsSection />
          </div>
          <div className="landing-deferred-section">
            <SolutionsSection />
          </div>
          <div className="landing-deferred-section">
            <DashboardOverview />
          </div>
          <div className="landing-deferred-section">
            <Features />
          </div>
          <div className="landing-deferred-section">
            <FeatureDeepDives />
          </div>
          <div className="landing-deferred-section">
            <Benefits />
          </div>
          <div className="landing-deferred-section">
            <Pricing />
          </div>
          <div className="landing-deferred-section">
            <HowItWorks />
          </div>
          <div className="landing-deferred-section">
            <ProductivityTips />
          </div>
          <div className="landing-deferred-section">
            <FaqSection />
          </div>
          <div className="landing-deferred-section">
            <FinalCta />
          </div>
        </main>
        <div className="landing-deferred-section">
          <Footer />
        </div>
      </div>
    </LazyMotion>
  );
}
