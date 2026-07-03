"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("shimmer rounded-xl", className)} />
  );
}

export function CardSkeleton() {
  return (
    <div className="glass rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6",
        className
      )}
    >
      <motion.div
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 ring-1 ring-violet-500/20"
      >
        <Icon className="h-9 w-9 text-violet-500" />
      </motion.div>
      <h3 className="text-lg font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-5">
        {description}
      </p>
      {action}
    </motion.div>
  );
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6">
      {/* Pulsing star icon + rotating ring */}
      <div className="relative flex items-center justify-center">
        {/* Outer rotating ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute h-16 w-16 rounded-full border-[2px] border-violet-500/20 border-t-violet-500/60"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          className="absolute h-20 w-20 rounded-full border-[1.5px] border-fuchsia-500/10 border-b-fuchsia-500/40"
        />
        {/* Pulsing star */}
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex h-10 w-10 items-center justify-center"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-8 w-8 text-violet-500"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L14.09 8.26L20.18 8.63L15.54 12.74L16.91 19.02L12 15.77L7.09 19.02L8.46 12.74L3.82 8.63L9.91 8.26L12 2Z"
              fill="currentColor"
            />
          </svg>
        </motion.div>
      </div>
      {/* Fade-in text */}
      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6, ease: "easeOut" }}
        className="text-sm font-medium text-muted-foreground"
      >
        Loading…
      </motion.p>
    </div>
  );
}
