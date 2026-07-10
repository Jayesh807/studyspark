"use client";

import { Sparkles } from "lucide-react";
import {  m  } from 'framer-motion';
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
  onClick?: () => void;
}

export function Logo({ className, showWordmark = true, onClick }: LogoProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex items-center gap-2.5 outline-none",
        onClick && "cursor-pointer",
        className
      )}
      aria-label="StudySpark home"
    >
      <m.span
        whileHover={{ rotate: 12, scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/30"
      >
        <Sparkles className="size-5" strokeWidth={2.4} />
        <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/30 to-transparent" />
      </m.span>
      {showWordmark && (
        <span className="text-lg font-bold tracking-tight">
          Study<span className="text-gradient">Spark</span>
        </span>
      )}
    </button>
  );
}
