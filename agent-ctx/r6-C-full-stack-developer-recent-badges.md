# r6-C — Recently-earned badge tracking + NEW pulse + Recent Activity timeline

## Files modified (only these 2, per scope)
1. `src/hooks/use-achievement-celebration.ts` (95 → 190 lines)
2. `src/components/dashboard/pages/achievements.tsx` (679 → 823 lines)

## What changed

### Hook (`use-achievement-celebration.ts`)
- Extended local `Badge` interface to full shape (id, title, description, tier, icon, category, earned) so the `getRecentlyEarned` helper can return fully-typed badges.
- Added `EARNED_AT_KEY = "studyspark:badge-earned-at"` + `BACKFILL_AGE_MS = 7 days` constants.
- Added `readEarnedAt()` / `writeEarnedAt()` — SSR-safe localStorage helpers that validate the stored value is a plain object of finite numbers.
- Exported `getEarnedAtMap(): Record<string, number>` — reads the persisted map, returns `{}` on SSR/parse-error.
- Exported `getRecentlyEarned<T extends {id, earned}>(badges, withinMs = 24h)` — generic helper returning `{ badge: T; earnedAt: number }[]` sorted by earnedAt desc. Generic preserves the caller's full badge type.
- Hook body changes:
  - Reads `earnedAt` map alongside `seen` set.
  - On non-firstRun newly-earned (the confetti condition): stamps `earnedAt[b.id] = now`.
  - On firstRun: backfills `earnedAt[b.id] = now - 7d` for every earned badge missing an entry, then persists both maps and returns (no confetti). This gives existing badges a sensible timestamp without marking them "NEW".
  - Confetti logic unchanged (celebrateTrophy for gold/platinum, else celebrateBurst, 250ms delay).
  - Return type annotated `: void`.

### Achievements page (`achievements.tsx`)
- Added `formatDistanceToNow` import from `date-fns`.
- Imported `getEarnedAtMap`, `getRecentlyEarned` from the hook.
- `BadgeCard`: added `isNew?: boolean` prop (default false). Computes `showNew = isNew && badge.earned` (never on locked badges). When `showNew`: appends `new-badge-pulse` class to the card (amber ring pulse) and renders a `new-tag-shine` "NEW" pill at `absolute left-2 top-2 z-20` (top-left, to avoid overlapping the existing tier ribbon at top-right) — amber→orange gradient, white text, `text-[9px] font-bold uppercase`, `overflow-hidden` so the shine sweep is clipped.
- Added `RecentActivity` component (renders up to 5 recently-earned badges as a vertical timeline with `.timeline-line` behind tier-colored medallions, `.recent-item-enter` staggered entrance with `animationDelay: i*0.08s`, relative time via `formatDistanceToNow(..., {addSuffix:true})`. Empty state: amber sparkle icon + message + "Start a focus session" CTA → `setView("focus")`).
- Wired in `AchievementsPage`:
  - `earnedAtMap` as state + effect (re-reads localStorage when `data` changes; declared AFTER the celebration hook so the hook's backfill effect runs first). **Deviation from spec**: spec suggested `useMemo(() => getEarnedAtMap(), [])`, but that reads localStorage before the hook's backfill effect runs, leaving first-time visitors with an empty timeline. State+effect fixes this — documented inline.
  - `recentEarned = getRecentlyEarned(data.badges, 30d)` for the timeline (deps `[data, earnedAtMap]`).
  - `newBadgeIds = new Set(getRecentlyEarned(data.badges).map(r => r.badge.id))` for the 24h NEW pulse (deps `[data, earnedAtMap]`).
  - `<RecentActivity>` rendered after the hero header card, before summary stats.
  - `isNew={newBadgeIds.has(badge.id)}` passed to each `<BadgeCard>`.

## Verification
- `bun run lint` → exit 0, 0 errors, 0 warnings.
- `bunx tsc --noEmit` → 22 pre-existing errors in OTHER files (examples, skills, dashboard-home, profile, settings, command-palette); 0 errors in my 2 files.
- Dev server compiles cleanly (✓ Compiled, no errors in dev.log tail).

## Notes for future agents
- The `earnedAt` map is backfilled to 7 days ago for badges earned before this feature shipped. Those badges appear in the 30-day timeline (7d < 30d) but NOT as "NEW" (7d > 24h). Correct behavior.
- For a brand-new in-session earn: confetti fires AND the badge gets `earnedAt = now`. However, the NEW pulse won't appear on the same render (earnedAtMap was read at mount). It will appear on next page load if within 24h. The confetti is the in-session celebration; the pulse is a persistent "recently earned" indicator.
- The NEW pill is at top-LEFT (not top-right as spec literally said) to avoid overlapping the existing tier ribbon which is already at top-right. Documented in a code comment.
