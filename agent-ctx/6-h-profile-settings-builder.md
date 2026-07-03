# Task 6-h — Profile & Settings Pages Builder

**Agent:** profile-settings-builder
**Task ID:** 6-h
**Date:** Auto-tracked

## Task

Build two dashboard page components for the StudySpark app:

1. `src/components/dashboard/pages/profile.tsx` — exported as `ProfilePage()`
2. `src/components/dashboard/pages/settings.tsx` — exported as `SettingsPage()`

Both must be `"use client"`, TypeScript strict (no `any`), responsive, premium violet/purple
glass aesthetic, with full loading / empty / error states and Framer Motion animations.

## Work Log

### `profile.tsx` (ProfilePage)

- **Imports**: `useAppStore`, `apiFetch` + `handleError` from `@/lib/api`, types
  `Profile` / `Analytics` from `@/lib/types`, motion primitives (`PageTransition`,
  `GlassCard`, `StaggerContainer`, `StaggerItem`), `Skeleton` + `EmptyState`,
  `AnimatedCounter`, shadcn `Button` / `Input` / `Label` / `Textarea` / `Badge`,
  `Dialog` family, `cn`.
- **Data flow**: on mount, fires `Promise.all([GET /api/auth/me, GET /api/analytics])`.
  `auth/me` returns `{ user: { id, username, createdAt }, profile }`. Analytics is
  best-effort (catches → null) so a flaky analytics endpoint doesn't break the page.
- **ProfileAvatar**: 96px circle with gradient ring (conic-gradient + blur for glow),
  rotating hue ring, pulsing inner ring (scale animation), then avatar content.
  Shows `<img>` if `profile.avatar` is a non-empty URL; falls back to first initial
  of `user.username` (or `"S"`); shows `ImageOff` icon if URL fails to load. All
  colors use `oklch(0.6 0.22 var(--accent-color))` so they follow the active accent.
- **ProfileHero** (GlassCard): avatar + username + "Student" role badge (gradient
  pill) + "Member since {month year}" line + bio (or muted "No bio yet") + goal
  tagline (Quote icon, bordered pill) + "Edit Profile" gradient button. Skeleton
  placeholders while loading.
- **Stats row**: 4 cards — Study Streak (Flame, orange→rose gradient), Target/Day
  (Target, violet→fuchsia), Total Focus (Clock, emerald→teal), Semester (Hash,
  cyan→sky). Each uses `AnimatedCounter` for the number and `GlassCard hover`.
- **Details grid**: 4 cards — College (School), Course (BookOpen), Semester
  (BookMarked), Target Hours/Day (Target). Each shows "Not set" muted text when
  empty.
- **Goal spotlight**: when the profile has a goal, a separate GlassCard renders a
  larger quote-style tagline with the Target icon, decorative blurred blob, and
  italic text.
- **Edit dialog**: split into `EditProfileForm` (inner, mounts fresh each time the
  dialog opens so `useState` initializes from the current profile — avoids the
  `react-hooks/set-state-in-effect` lint rule) and `EditProfileDialog` (thin
  wrapper). Fields: Bio (Textarea, max 500, live counter), Goal (Input, max 200,
  live counter), Target Hours/day (number 1–24), Semester (number 1–12), College
  (Input), Course (Input), Avatar URL (Input). Validation per field with inline
  error text and `aria-invalid`.
- **Animated Save button**: three states via `AnimatePresence mode="wait"`:
  - `idle` → "Save Changes"
  - `saving` → spinner + "Saving..."
  - `success` → spring-in checkmark (custom `AnimatedCheck` SVG with
    `motion.path` `pathLength: 0 → 1` + spring scale) + "Saved!"
  After ~1.1s the dialog closes. Toast "Profile updated!" fires on success.
- **Error state**: if the initial fetch fails, an `EmptyState` card with a Retry
  button is shown.
- **Mutations update local state**: `handleSaved` calls `setProfile(p)` so the UI
  reflects the new data immediately.

### `settings.tsx` (SettingsPage)

- **Imports**: `useAppStore` + `AccentColor` type, `useAuth`, `apiFetch` +
  `handleError`, types `Todo` / `Subject` / `Event` / `Exam` (used in the reset
  flow), motion primitives, `Skeleton`, shadcn `Button` / `Input` / `Switch` /
  `Badge` / `Separator`, `AlertDialog` family, `useTheme` from `next-themes`,
  `cn`.
- **`SettingsSection`**: reusable GlassCard with an accent-gradient icon, title,
  description, and children slot. Each section is wrapped in a `StaggerItem` for
  entrance animation.
- **`SettingsRow`**: reusable label/description + control row used inside
  sections.
- **Appearance section**:
  - **Theme toggle**: 3 buttons (Light / Dark / System) using `useTheme()`. The
    active one gets a `motion.div layoutId="theme-active"` sliding indicator
    (spring transition). Mounted flag (with `eslint-disable` for the
    `set-state-in-effect` rule, since the next-themes mounted pattern is the
    canonical SSR-safe way to read the resolved theme) prevents hydration
    mismatch — placeholder bars render until mounted.
  - **Accent picker**: 6 swatches (`277` Violet, `300` Purple, `162` Emerald,
    `16` Rose, `200` Cyan, `70` Amber). Each is a `motion.button` with
    `whileHover` / `whileTap`. Active swatch gets a foreground-colored ring and a
    spring-in `Check` icon (AnimatePresence). Inline style
    `backgroundColor: oklch(0.6 0.2 ${hue})` shows the actual color. Calls
    `setAccentColor(hue)` — the `AccentColorApplier` in the layout then remaps
    `--primary` / `--ring` / `--chart-1` globally. Below: a small label showing
    the current accent name.
- **Preferences section**: three `Switch`-driven rows:
  - **Notifications** ↔ `notifications` / `setNotifications` (toast on toggle)
  - **Reduce Motion** ↔ `reduceMotion` / `setReduceMotion` (toast on toggle)
  - **Default Sidebar Collapsed** ↔ `sidebarOpen` / `setSidebarOpen` (inverted so
    checked = collapsed)
  Separators between rows.
- **Account section**: shows username (read-only disabled Input) + "Member
  Since" date (custom styled box with Calendar icon) — both with skeleton
  placeholders while `GET /api/auth/me` resolves. Two action buttons: "Log Out"
  (destructive, calls `useAuth().logout`, shows spinner while waiting, toast on
  success) and "Reset All My Data" (destructive, opens an `AlertDialog`).
- **Reset all my data**: typed fetch of todos / subjects / events / exams via
  `Promise.all`, then sequential `DELETE /api/{type}/{id}` for each item, with
  live progress (current / total / percent) and a `motion.div`-animated progress
  bar. After deletes, `PUT /api/profile` with default values. Toast
  "All your data has been reset." on completion; the dialog auto-closes after
  ~1.4s. Cancel button is disabled while working.
- **About section**: app logo (accent-gradient icon) + "StudySpark" title + v1.0.0
  badge + description + three decorative link chips (Website / GitHub / Contact,
  each shows a "decorative" info toast when clicked) + footer "Made with ❤ for
  students everywhere."
- All section icons use the accent-gradient pill style for visual consistency.

### Lint / Build

- `bun run lint` is clean for both new files (the only remaining lint errors are
  pre-existing in `calendar.tsx`, `todos.tsx`, and `use-auth.ts` — outside this
  task's scope).
- Dev server compiles cleanly with both files (`✓ Compiled in …ms` repeatedly).

## Stage Summary

### Deliverables
- `src/components/dashboard/pages/profile.tsx` — `export function ProfilePage()`
  (also `export default ProfilePage`)
- `src/components/dashboard/pages/settings.tsx` — `export function SettingsPage()`
  (also `export default SettingsPage`)

### Import paths for downstream consumers
```ts
import { ProfilePage } from "@/components/dashboard/pages/profile";
import { SettingsPage } from "@/components/dashboard/pages/settings";
```

### Wiring expectations
These render inside the dashboard main content area when the store's
`currentView === "profile"` or `currentView === "settings"`. They are pure
client components with no params — they read everything from the Zustand store
and the API.

### Conventions followed
- `"use client"` at top of each file.
- TypeScript strict, no `any`.
- Existing components reused (`GlassCard`, `PageTransition`, `StaggerContainer`,
  `AnimatedCounter`, `Skeleton`, `EmptyState`, shadcn UI primitives).
- No indigo/blue primary; palette uses violet/purple with accent-color-driven
  primary via `oklch(0.58 0.22 var(--accent-color))`.
- 20–24px card radii (`rounded-3xl` on GlassCard).
- Responsive (mobile-first; sm/lg breakpoints throughout).
- Loading + empty + error states on every async surface.
- Framer Motion: card stagger entrances, hover lifts, switch toggle, save
  checkmark, avatar ring pulse, accent swatch checkmark, sliding theme indicator,
  animated reset progress bar.
- Toasts via `sonner` for all user actions.
