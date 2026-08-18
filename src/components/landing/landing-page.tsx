import dynamic from "next/dynamic";
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
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <WhyStudySpark />
        <ProblemsSection />
        <SolutionsSection />
        <DashboardOverview />
        <Features />
        <FeatureDeepDives />
        <Benefits />
        <Pricing />
        <HowItWorks />
        <ProductivityTips />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
