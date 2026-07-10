import { Navbar } from "./navbar";
import { Hero } from "./hero";
import dynamic from "next/dynamic";

const Features = dynamic(() => import("./features").then((m) => m.Features));
const Screenshots = dynamic(() => import("./screenshots").then((m) => m.Screenshots));
const Pricing = dynamic(() => import("./pricing").then((m) => m.Pricing));
const Footer = dynamic(() => import("./footer").then((m) => m.Footer));

import { LazyMotion, domAnimation } from "framer-motion";

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
    <LazyMotion features={domAnimation}>
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
    </LazyMotion>
  );
}
