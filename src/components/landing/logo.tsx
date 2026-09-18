"use client";

import {  m  } from 'framer-motion';
import { cn } from "@/lib/utils";
import Image from "next/image";

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
      <m.div
        whileHover={{ rotate: 12, scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="relative flex size-9 items-center justify-center rounded-xl shadow-lg shadow-violet-500/30"
      >
        <Image 
          src="/logo.png" 
          alt="StudySpark Logo" 
          width={36} 
          height={36} 
          className="rounded-xl object-contain"
        />
      </m.div>
      {showWordmark && (
        <span className="text-lg font-bold tracking-tight">
          Study <span className="text-gradient">Sparks</span>
        </span>
      )}
    </button>
  );
}
