"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface AnimatedBlobsProps {
  variant?: "landing" | "dashboard";
}

/**
 * AnimatedBlobs — decorative gradient blobs behind page content.
 *
 * Performance strategy:
 * - On first paint, render 2 static CSS blobs (no JS animation, no Framer Motion)
 *   using a pure CSS `@keyframes` drift for a subtle, GPU-friendly effect.
 * - After hydration + idle, swap in the full animated Framer Motion blobs.
 * - This avoids heavy GPU paint cost (4× blur-3xl + continuous JS animation)
 *   from blocking First Contentful Paint.
 */
export function AnimatedBlobs({ variant = "landing" }: AnimatedBlobsProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Defer heavy animated blobs until after first paint + idle
    if (typeof requestIdleCallback !== "undefined") {
      const id = requestIdleCallback(() => setReady(true), { timeout: 2000 });
      return () => cancelIdleCallback(id);
    } else {
      const timer = setTimeout(() => setReady(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!ready) {
    return <StaticBlobs variant={variant} />;
  }

  return <FullBlobs variant={variant} />;
}

/* ------------------------------------------------------------------ */
/*  Static blobs — lightweight first-paint placeholders               */
/* ------------------------------------------------------------------ */

function StaticBlobs({ variant }: { variant: "landing" | "dashboard" }) {
  const colors =
    variant === "landing"
      ? [
          "from-violet-400/40 via-purple-400/30 to-fuchsia-400/20",
          "from-indigo-400/40 via-blue-400/30 to-cyan-400/20",
        ]
      : [
          "from-violet-500/20 via-purple-500/15 to-fuchsia-500/10",
          "from-indigo-500/20 via-blue-500/15 to-cyan-500/10",
        ];

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className={`absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br ${colors[0]} blur-3xl`}
        style={{ animation: "blobDriftA 22s ease-in-out infinite" }}
      />
      <div
        className={`absolute top-1/3 -right-40 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br ${colors[1]} blur-3xl`}
        style={{ animation: "blobDriftB 26s ease-in-out infinite" }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Full animated blobs — deferred after first paint                  */
/* ------------------------------------------------------------------ */

function FullBlobs({ variant }: { variant: "landing" | "dashboard" }) {
  const colors =
    variant === "landing"
      ? [
          "from-violet-400/40 via-purple-400/30 to-fuchsia-400/20",
          "from-indigo-400/40 via-blue-400/30 to-cyan-400/20",
          "from-rose-400/30 via-pink-400/20 to-orange-300/20",
          "from-emerald-400/30 via-teal-400/20 to-cyan-400/20",
        ]
      : [
          "from-violet-500/20 via-purple-500/15 to-fuchsia-500/10",
          "from-indigo-500/20 via-blue-500/15 to-cyan-500/10",
          "from-rose-500/15 via-pink-500/10 to-orange-400/10",
        ];

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className={`absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br ${colors[0]} blur-3xl`}
        initial={{ x: 0, y: 0, scale: 1 }}
        animate={{
          x: [0, 60, -30, 0],
          y: [0, 40, -20, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={`absolute top-1/3 -right-40 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br ${colors[1]} blur-3xl`}
        initial={{ x: 0, y: 0, scale: 1 }}
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 30, -40, 0],
          scale: [1, 0.9, 1.15, 1],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className={`absolute -bottom-40 left-1/4 h-[26rem] w-[26rem] rounded-full bg-gradient-to-br ${colors[2]} blur-3xl`}
        initial={{ x: 0, y: 0, scale: 1 }}
        animate={{
          x: [0, 40, -50, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.08, 0.92, 1],
        }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
      {variant === "landing" && (
        <motion.div
          className={`absolute top-1/2 left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br ${colors[3]} blur-3xl`}
          initial={{ x: -100, y: -60, scale: 1 }}
          animate={{
            x: [-100, 80, -50, -100],
            y: [-60, 40, 80, -60],
            scale: [1, 1.12, 0.9, 1],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}
