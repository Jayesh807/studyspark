"use client";

/**
 * PricingCTA — tiny client component for the pricing section's CTA button.
 * Isolated here so pricing.tsx can be a Server Component.
 */

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

export function PricingCTA() {
  const setView = useAppStore((s) => s.setView);
  return (
    <Button
      size="lg"
      onClick={() => setView("signup")}
      className="mt-6 h-12 w-full rounded-xl bg-linear-to-br from-violet-500 to-fuchsia-500 text-base font-semibold text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/45 hover:brightness-110"
    >
      Get started free
      <ArrowRight className="size-4" />
    </Button>
  );
}
