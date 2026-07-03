"use client";

import { useEffect, useRef } from "react";
import { celebrateBurst, celebrateTrophy } from "@/lib/confetti";

interface Badge {
  id: string;
  title: string;
  description: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  icon: string;
  category: string;
  earned: boolean;
}

interface AchievementCelebrationArgs {
  badges: Badge[] | undefined;
  enabled: boolean;
}

const STORAGE_KEY = "studyspark:seen-badges";
const EARNED_AT_KEY = "studyspark:badge-earned-at";

/** Backfill age for badges earned before this feature shipped (7 days). */
const BACKFILL_AGE_MS = 1000 * 60 * 60 * 24 * 7;

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

function readEarnedAt(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(EARNED_AT_KEY);
    if (!raw) return {};
    const obj = JSON.parse(raw);
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      const out: Record<string, number> = {};
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        if (typeof v === "number" && Number.isFinite(v)) {
          out[k] = v;
        }
      }
      return out;
    }
    return {};
  } catch {
    return {};
  }
}

function writeEarnedAt(map: Record<string, number>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(EARNED_AT_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/**
 * Reads the persisted `{ badgeId → earnedAt(ms) }` map from localStorage.
 * Returns `{}` on SSR or parse error. Safe to call from anywhere.
 */
export function getEarnedAtMap(): Record<string, number> {
  return readEarnedAt();
}

/**
 * Returns badges earned within the given time window (default 24h), sorted by
 * `earnedAt` descending (most recent first). Badges without a persisted
 * `earnedAt` entry — or not currently earned — are excluded.
 *
 * Generic over the badge shape so callers keep their full badge type on the
 * returned objects.
 */
export function getRecentlyEarned<T extends { id: string; earned: boolean }>(
  badges: T[],
  withinMs: number = 24 * 60 * 60 * 1000
): { badge: T; earnedAt: number }[] {
  const map = getEarnedAtMap();
  const now = Date.now();
  return badges
    .filter(
      (b) => b.earned && map[b.id] != null && now - (map[b.id] as number) <= withinMs
    )
    .map((b) => ({ badge: b, earnedAt: map[b.id] as number }))
    .sort((a, b) => b.earnedAt - a.earnedAt);
}

/**
 * Watches the badges array; when a badge transitions from not-seen-earned →
 * earned for the first time, fires a confetti celebration. Also persists
 * `earnedAt` timestamps so a "Recent Activity" timeline and "NEW" pulse can
 * be derived from them (see `getEarnedAtMap` / `getRecentlyEarned`).
 *
 * Returns nothing — this is a side-effect hook.
 */
export function useAchievementCelebration({
  badges,
  enabled,
}: AchievementCelebrationArgs): void {
  const firstRunRef = useRef(true);

  useEffect(() => {
    if (!enabled || !badges || badges.length === 0) return;

    const seen = readSeen();
    const earnedAt = readEarnedAt();
    const now = Date.now();
    const newlyEarned: Badge[] = [];

    for (const b of badges) {
      if (b.earned && !seen.has(b.id)) {
        newlyEarned.push(b);
        seen.add(b.id);
        // Stamp the moment this badge was first observed as earned. On the
        // initial mount we defer to the backfill below so existing earned
        // badges don't get stamped "just now" (which would incorrectly
        // trigger the NEW pulse and put them at the top of the timeline).
        if (!firstRunRef.current) {
          earnedAt[b.id] = now;
        }
      } else if (b.earned && seen.has(b.id)) {
        // already known — fine
      } else if (!b.earned && seen.has(b.id)) {
        // badge was earned before but no longer — remove from seen so it
        // can re-celebrate if re-earned (rare but safe)
        seen.delete(b.id);
      }
    }

    // On the first load we just record current state without celebrating,
    // so a page refresh doesn't trigger confetti. We also backfill an
    // earnedAt timestamp (7 days ago) for any earned badge that doesn't
    // yet have one — this gives existing badges a sensible "recent" time
    // without marking them as freshly earned (which would show the NEW
    // pulse and place them at the top of the timeline as "just now").
    if (firstRunRef.current) {
      firstRunRef.current = false;
      const backfillAt = now - BACKFILL_AGE_MS;
      for (const b of badges) {
        if (b.earned && earnedAt[b.id] == null) {
          earnedAt[b.id] = backfillAt;
        }
      }
      writeSeen(seen);
      writeEarnedAt(earnedAt);
      return;
    }

    writeSeen(seen);
    if (newlyEarned.length > 0) {
      writeEarnedAt(earnedAt);
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
