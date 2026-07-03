# Task 6-de — Exams & Subjects Pages

**Agent**: exams-subjects-builder
**Task ID**: 6-de
**Status**: ✅ Complete

## Task

Build the **Exams Page** and **Subjects Page** for the StudySpark dashboard
(Next.js 16 + TS + Tailwind 4 + shadcn/ui + Framer Motion). Both pages render
inside the dashboard main content area as part of the SPA on `/`.

## Files Delivered

1. **`src/components/dashboard/pages/exams.tsx`**
   - Named export: `export function ExamsPage()` (also default export).
   - Loads exams via `GET /api/exams` and subjects via `GET /api/subjects`
     (subject names power the colored subject picker in the form).

2. **`src/components/dashboard/pages/subjects.tsx`**
   - Named export: `export function SubjectsPage()` (also default export).
   - Loads subjects via `GET /api/subjects`.

## Import Paths Used (verified existing)

- `@/lib/api` → `apiFetch`, `handleError`
- `@/lib/types` → `Exam`, `Subject`, `Priority`, `EventColor`, `PRIORITY_CONFIG`, `COLOR_MAP`, `colorOf`
- `@/lib/store` → `useAppStore` (used for `reduceMotion` in exams page)
- `@/lib/utils` → `cn`
- `@/components/shared/motion` → `PageTransition`, `GlassCard`, `StaggerContainer`, `StaggerItem`
- `@/components/shared/feedback` → `Skeleton`, `EmptyState`
- `@/components/shared/animated-counter` → `AnimatedCounter`
- shadcn/ui: `button`, `badge`, `input`, `label`, `textarea`, `slider`, `dialog`, `alert-dialog`, `dropdown-menu`, `select`, `collapsible`
- `framer-motion`, `sonner` (`toast`), `date-fns`, `lucide-react`

## Exams Page Highlights

- **Header**: "Upcoming Exams" with subtitle, gradient "Add Exam" button (violet → fuchsia).
- **Stats row** (4 GlassCards w/ AnimatedCounter): Total exams · Upcoming · High priority · Avg. progress %.
- **Exam cards** (responsive 1/2/3 grid, GlassCard with hover lift):
  - Colored subject badge (color matched from subjects list — falls back to violet).
  - Exam name (big), formatted date, time, location (MapPin), priority badge from `PRIORITY_CONFIG`.
  - **Live countdown timer** (`FlipDigit` per unit) ticking every second via `setInterval` + `useEffect` cleanup.
    - AnimatePresence flip animation on each digit change.
    - Color-coded urgency: `rose` if <3 days, `amber` if <7 days, `violet` otherwise.
    - "Exam window passed" state when target is in the past.
  - Animated gradient progress bar (color shifts with progress level).
  - Truncated notes preview.
  - Edit/Delete via dropdown menu → dialog / alert dialog.
- **Add/Edit dialog**: subject (Select from /api/subjects when available, else free text), examName (required), date (required), time, location, priority (Select), progress (Slider 0-100), notes (Textarea). Validates required fields. POST/PUT.
- **Past exams section**: Collapsible list of past exams with mini progress bars, animated chevron.
- **Empty / loading / error states**: skeletons, EmptyState with CTA, toast errors.
- **Optimistic mutations**: add, edit, delete update local state immediately and roll back on failure.

## Subjects Page Highlights

- **Header**: "My Subjects" with subtitle, gradient "Add Subject" button.
- **Overview stats row** (4 GlassCards w/ AnimatedCounter): Total subjects · Total credits · Avg. attendance · Avg. progress.
- **Subject cards** (responsive 1/2/3 grid, GlassCard with hover lift):
  - Colored left accent bar + colored dot using subject color.
  - Subject name (big), teacher (User icon), credits badge, progress badge.
  - **Circular SVG attendance ring** (`AttendanceRing`) with `strokeDashoffset` draw animation.
    - Color-coded: emerald ≥75, amber 60-74, rose <60.
    - Status label ("Good" / "At risk" / "Low") next to ring.
  - Linear progress bar with subject color (uses chart hex for crisp color).
  - Notes preview (2 lines, with StickyNote icon).
  - Edit/Delete via dropdown menu.
- **Add/Edit dialog**: name (required), teacher, credits (1-10), attendance (Slider), color (6-swatch picker using EventColor options with check animation), progress (Slider), notes (Textarea). Validates name + credits. POST/PUT.
- **Empty / loading / error states**: skeletons, EmptyState with CTA, toast errors.
- **Optimistic mutations**: add, edit, delete.

## Design Conformance

- `"use client"` at top of both files. TS strict, no `any`.
- Premium glassy look: `.glass` rounded-3xl (24px), soft shadows, violet/purple palette (NO indigo/blue primary).
- Framer Motion everywhere: page transition, card entrance stagger, hover lift, countdown digit flip, progress bar width animation, ring draw, dialog scale/fade (built-in via radix + shadcn).
- Fully responsive (mobile-first; 1/2/3 column grids; safe touch targets).
- Countdown timers genuinely tick every second with cleanup.
- Lint clean on both files (one targeted `eslint-disable-next-line react-hooks/set-state-in-effect` for legitimate countdown resync on target change).

## Stage Summary

Both dashboard feature pages are complete and ready to be wired into the main
`page.tsx` via `currentView === "exams"` / `currentView === "subjects"`.
The pages follow the shared conventions (apiFetch, handleError, GlassCard,
PageTransition, colorOf/PRIORITY_CONFIG/COLOR_MAP, AnimatedCounter) and add
no new dependencies. No API routes, schema, page.tsx, or layout files were
modified.
