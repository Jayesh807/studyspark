"use client";

/**
 * CTAButtons — client-only interactive buttons for the CTA section.
 * Isolated here so cta-section.tsx can be a Server Component.
 */

import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

export function CTAButtons() {
  const setView = useAppStore((s) => s.setView);
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Button
        size="lg"
        onClick={() => setView("signup")}
        className="h-12 rounded-xl bg-white px-7 text-base font-semibold text-violet-700 shadow-xl shadow-black/10 transition-all hover:scale-[1.03] hover:bg-white hover:shadow-2xl"
      >
        Get started — it&apos;s free
        <ArrowRight className="size-4" />
      </Button>
      <Button
        size="lg"
        onClick={() => setView("login")}
        className="h-12 rounded-xl border border-white/30 bg-white/10 px-7 text-base font-semibold text-white backdrop-blur-sm transition-all hover:scale-[1.03] hover:bg-white/20"
      >
        Login
      </Button>
    </div>
  );
}
