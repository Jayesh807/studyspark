import { Navbar } from "./navbar";
import { Hero } from "./hero";
// import { StatsBar } from "./stats-bar";
import { Features } from "./features";
import { Screenshots } from "./screenshots";
import { Pricing } from "./pricing";
// import { Testimonials } from "./testimonials";
import { Footer } from "./footer";

/**
 * LandingPage — the full marketing landing page for StudySpark.
 *
 * Renders: Navbar → Hero → Stats → Features → Screenshots →
 * Pricing → Testimonials → CTA → Footer.
 *
 * Auth navigation is wired via the Zustand store:
 *   setView("login")  /  setView("signup")
 *
 * The root is a `<div className="min-h-screen">` — the app shell
 * handles any sticky-footer concerns. This component is purely
 * the landing surface.
 */
export function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero />
        {/* <StatsBar /> */}
        <Features />
        <Screenshots />
        <Pricing />
        {/* <Testimonials /> */}
      </main>
      <Footer />
    </div>
  );
}
