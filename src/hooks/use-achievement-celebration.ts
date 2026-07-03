"use client";

import { useEffect, useRef } from "react";
import { celebrateBurst, celebrateTrophy } from "@/lib/confetti";

interface Badge {
  id: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  earned: boolean;
  title: string;
}

interface AchievementCelebrationArgs {
  badges: Badge[] | undefined;
  enabled: boolean;
}

const STORAGE_KEY = "studyspark:seen-badges";

function readSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function writeSeen(set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    /* ignore */
  }
}

/**
 * Watches the badges array; when a badge transitions from not-seen-earned →
 * earned for the first time, fires a confetti celebration and toasts.
 * Returns nothing — this is a side-effect hook.
 */
export function useAchievementCelebration({
  badges,
  enabled,
}: AchievementCelebrationArgs) {
  const firstRunRef = useRef(true);

  useEffect(() => {
    if (!enabled || !badges || badges.length === 0) return;

    const seen = readSeen();
    const newlyEarned: Badge[] = [];

    for (const b of badges) {
      if (b.earned && !seen.has(b.id)) {
        newlyEarned.push(b);
        seen.add(b.id);
      } else if (b.earned && seen.has(b.id)) {
        // already known — fine
      } else if (!b.earned && seen.has(b.id)) {
        // badge was earned before but no longer — remove from seen so it
        // can re-celebrate if re-earned (rare but safe)
        seen.delete(b.id);
      }
    }

    // On first load we just record current state without celebrating,
    // so a page refresh doesn't trigger confetti.
    if (firstRunRef.current) {
      firstRunRef.current = false;
      writeSeen(seen);
      return;
    }

    if (newlyEarned.length > 0) {
      writeSeen(seen);
      const hasHighTier = newlyEarned.some(
        (b) => b.tier === "gold" || b.tier === "platinum"
      );
      // Slight delay so the toast renders before confetti
      setTimeout(() => {
        if (hasHighTier) {
          celebrateTrophy();
        } else {
          celebrateBurst();
        }
      }, 250);
    }
  }, [badges, enabled]);
}
