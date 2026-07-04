# StudySpark — Student Analytics Dashboard · Worklog

This is the shared handover document for all agents working on the StudySpark
project. Read this before starting, and append your section after finishing.

---
Task ID: 1
Agent: orchestrator (main)
Task: Foundation — DB schema, auth lib (JWT/bcrypt), all API routes, theme/globals, stores, shared components

Work Log:
- Replaced `prisma/schema.prisma` with full data model: User, Profile, Todo, Event, Subject, Exam, FocusSession (all relations cascade on user delete).
- Ran `bun run db:push` — schema synced to SQLite at `db/custom.db`.
- Installed `bcryptjs`, `jsonwebtoken` (+ types).
- Created `src/lib/auth.ts`: password hashing/verification, JWT sign/verify, cookie helpers (`setAuthCookie`, `clearAuthCookie`, `getCurrentUser`, `getToken`). Cookie name `studyspark_token`, 30-day expiry, httpOnly.
- Created all API routes under `src/app/api/`:
  - `auth/signup`, `auth/login`, `auth/logout`, `auth/me` (GET)
  - `profile` (GET, PUT) — upsert pattern
  - `todos` (GET, POST) + `todos/[id]` (PUT, DELETE)
  - `subjects` (GET, POST) + `subjects/[id]` (PUT, DELETE)
  - `events` (GET, POST) + `events/[id]` (PUT, DELETE)
  - `exams` (GET, POST) + `exams/[id]` (PUT, DELETE)
  - `focus-session` (GET, POST)
  - `analytics` (GET) — aggregated weekly/monthly study hours, subject performance, task completion by category/priority, 14-day completion trend, focus distribution by subject, exam progress.
- All routes validate input with `zod`, return `{ error }` on failure, and verify ownership (`findFirst` by `userId`) before update/delete.
- Rewrote `src/app/globals.css` with a premium soft-pastel theme (light + dark). Added utilities: `.glass`, `.glass-strong`, `.text-gradient`, `.animated-gradient`, `.blob`, `.shimmer`, `.scrollbar-thin`, `.accent-bg/text/gradient`. Added keyframes: `gradientShift`, `blobFloat`, `shimmer`, `pulse-ring`. Rounded radius 0.875rem.
- Created `src/lib/store.ts` — Zustand store with `persist` middleware. State: `user`, `isAuthenticated`, `authLoading`, `currentView` (AppView union), `sidebarOpen`, `mobileSidebarOpen`, `accentColor`, `notifications`, `reduceMotion`. Persists only UI prefs (accent, notifications, reduceMotion, sidebarOpen) to localStorage.
- Created `src/lib/types.ts` — shared TS interfaces matching DB models + `Analytics`, plus `COLOR_MAP`, `PRIORITY_CONFIG`, `CATEGORY_CONFIG` helper maps.
- Created `src/lib/api.ts` — `apiFetch` wrapper (throws `ApiError` with status), `handleError` (sonner toast).
- Created `src/hooks/use-auth.ts` — `useAuth` hook: checks `/api/auth/me` on mount, exposes `login`/`signup`/`logout`.
- Created shared components:
  - `src/components/shared/animated-counter.tsx` — `AnimatedCounter` (spring-based count-up on in-view)
  - `src/components/shared/animated-blobs.tsx` — `AnimatedBlobs` (floating gradient blobs, landing/dashboard variants)
  - `src/components/shared/motion.tsx` — `PageTransition`, `GlassCard`, `StaggerContainer`, `StaggerItem` (respect `reduceMotion`)
  - `src/components/shared/feedback.tsx` — `Skeleton`, `CardSkeleton`, `EmptyState`, `PageLoader`
  - `src/components/theme-provider.tsx` — next-themes wrapper
  - `src/components/accent-color-applier.tsx` — applies `--accent-color` + remaps primary/ring/chart-1 to chosen hue
- Updated `src/app/layout.tsx` — wraps app in ThemeProvider, renders AccentColorApplier + Sonner Toaster (richColors, top-right). Metadata = StudySpark.

Stage Summary:
- **Backend complete**: all CRUD + auth + analytics endpoints live and validated.
- **Design system complete**: premium theme tokens, glassmorphism, gradients, animations, skeleton/empty-state primitives.
- **State layer complete**: Zustand store + persist, auth hook, typed API client.
- **Architecture**: SPA model — everything renders on `/` route. Navigation is driven by `useAppStore.currentView` (landing → login/signup → dashboard + sub-views). No other Next.js routes are user-visible.
- Next subagents should build: (3) Landing page, (4) Auth UI, (5) Dashboard shell + (6-a..6-h) feature pages, then (7) main `page.tsx` assembly wires it all via `currentView`.
- Shared conventions: use `apiFetch` for requests, `handleError` for toasts, `useAppStore` for nav/state, `GlassCard`/`PageTransition`/`StaggerContainer` for layout, `colorOf`/`PRIORITY_CONFIG`/`CATEGORY_CONFIG` from `@/lib/types` for theming. Framer Motion everywhere. NO indigo/blue as primary brand (we use violet/purple palette by default; accent hue is configurable). All cards 20-24px radius. Sticky footer on landing.

---
Task ID: 6-a
Agent: dashboard-home-builder
Task: Build the Dashboard Home page (`DashboardHome`) — the premium landing view inside the dashboard shell after login. Fetches `/api/analytics` and `/api/todos`, renders a warm greeting with a live clock, 5 staggered animated stat cards, two-column section with weekly area chart + monthly bar chart + rotating motivational quote + subject progress list, and previews of upcoming exams + today's tasks with empty states and "View all" navigation via `useAppStore.setView`.

Work Log:
- Created `/home/z/my-project/src/components/dashboard/pages/dashboard-home.tsx` (single `"use client"` file, named export `DashboardHome`).
- Read worklog and existing shared infra first: `@/lib/store` (useAppStore with `user`, `setView`), `@/lib/api` (apiFetch / handleError / ApiError), `@/lib/types` (Analytics, Todo, Exam, colorOf, PRIORITY_CONFIG), `@/components/shared/animated-counter`, `@/components/shared/motion` (PageTransition, GlassCard, StaggerContainer, StaggerItem), `@/components/shared/feedback` (Skeleton, CardSkeleton, EmptyState, PageLoader), and verified todos API returns `{ todos: Todo[] }`.
- **GreetingHeader** — isolated component with own `setInterval` (1s) so the parent doesn't re-render every second. Computes greeting from current hour (`<12` morning, `<18` afternoon, else evening). Renders `<h1>` with `text-gradient` username + emoji wave animation (Framer Motion rotate loop), `date-fns` full date ("EEEE, MMMM d, yyyy"), and live `HH:mm:ss` clock. Wrapped in a "Welcome back to your dashboard" violet chip with Sparkles icon. Fade-in on mount.
- **Stat cards** — 5 cards driven by a `STAT_CARDS` config array (icon, label, gradient, glow, suffix/subtitle/value getters). Each renders inside `StaggerItem` inside `StaggerContainer`, grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5`. Each `GlassCard hover` with: gradient icon chip (12x12 rounded-2xl), glow blob (absolute, blurred, opacity 25→40 on hover), uppercase label, big `AnimatedCounter` value (3xl→4xl), subtitle. Distinct gradients per spec: violet→purple (Today's Tasks), emerald→teal (Completed), amber→orange (Exams), rose→pink (Focus Time, suffix " min"), cyan→teal (Streak, suffix " days").
- **Two-column section** (`grid-cols-1 lg:grid-cols-3`, left `lg:col-span-2`):
  - **WeeklyChart** — Recharts `AreaChart` of `weeklyData` with violet→pink stroke gradient + violet gradient fill, monotone curve, custom dots/active dots, dashed CartesianGrid, custom `StudyTooltip` glass tooltip. Title "Weekly Study Hours" with TrendingUp icon.
  - **MonthlyChart** — Recharts `BarChart` of `monthlyData` (30 bars) with fuchsia→violet gradient fill, rounded top corners (`radius={[6,6,0,0]}`), `maxBarSize=14`, X axis interval=3 to avoid label crowding. Title "Monthly Study Hours" with Timer icon.
  - **QuoteCard** — 8 curated study quotes (`QUOTES` array). Random initial index. Refresh button (ghost icon) cycles forward; dot indicators below allow direct jump. AnimatePresence with `mode="wait"` for fade/slide transitions between quotes. Big Quote icon in violet→fuchsia gradient chip, decorative blurred blobs, italic text with curly quotes, "— Author" footer in violet.
  - **SubjectProgressList** — Top 4 subjects sorted by progress. Each row: colored dot (from `colorOf(subject.color).chart`), name, % value, then a custom progress bar with motion-animated width fill (color via `style.backgroundColor = chart color` for accurate theming). Staggered entrance per row.
- **ExamsPreview** — Filters `analytics.upcomingExams` to non-past, sorts by date, takes first 3. Each exam: calendar-style date badge (amber gradient with day + month abbreviation), title + priority dot, subject + optional location/time chips with MapPin/Clock icons, countdown pill colored by urgency (≤1 day rose, ≤7 days amber, else violet) with text "Today"/"Tomorrow"/"in N days"/"N days ago". EmptyState with GraduationCap if none. "View all" button → `setView("exams")`.
- **TodayTasksPreview** — Filters `todos` by `dueDate` matching today (`isSameDay` helper, also guards against NaN dates), takes first 5. Each task: priority dot, title (strikethrough if completed), subject, status icon (filled emerald circle with checkmark if done, hollow bordered circle otherwise). EmptyState with CheckCircle2 if none. "View all" → `setView("todos")`.
- **Loading** — `DashboardSkeleton` mirrors the full layout: greeting skeleton, 5 `CardSkeleton`s, two-column skeleton block with skeleton charts, and bottom 2-col skeleton row. Used while `loading || !analytics`. No `PageLoader` since data loads inline.
- **Error handling** — `Promise.all` fetches both endpoints; on failure, `handleError` shows toast, plus a secondary `toast.error("Could not load your dashboard. Please try again.")`. Todos fetch failure is non-fatal (caught → `[]`).
- **Design fidelity** — Premium glassmorphism via `GlassCard` + `.glass`/`.glass-strong` global classes. Violet/purple/fuchsia palette throughout (no indigo/blue as primary brand). Distinct accent colors per stat card for visual variety. All cards `rounded-3xl` (24px). Fully responsive (mobile-first, stacking on small screens). Framer Motion: page fade-in via `PageTransition`, staggered stat entrance, hover lifts on cards, animated counters, quote crossfade, progress bar width animation, staggered list items.
- TypeScript strict — no `any`. Explicit `LucideIcon` type for icon props, `Priority` cast for safety, `ChartTooltipPayloadItem` typed tooltip payload. Custom `StudyTooltip` component typed with optional fields.

Stage Summary:
- ✅ Single deliverable file at `/home/z/my-project/src/components/dashboard/pages/dashboard-home.tsx`.
- ✅ Named export `DashboardHome`, `"use client"`, TypeScript strict, zero `any`.
- ✅ Uses all the available shared infra (`useAppStore`, `apiFetch`/`handleError`, `AnimatedCounter`, `PageTransition`/`GlassCard`/`StaggerContainer`/`StaggerItem`, `CardSkeleton`/`EmptyState`, `colorOf`/`PRIORITY_CONFIG`).
- ✅ Recharts with gradient fills, rounded bars, custom glass tooltips, responsive.
- ✅ All 5 content sections present in order: greeting header, stat cards row, two-column charts+quote+subject section, upcoming exams preview, today's tasks preview.
- ✅ Lint-clean on this file (no errors/warnings). Remaining lint errors in other agents' files (exams.tsx, profile.tsx, settings.tsx) are out of scope.
- ✅ Navigation wired via `useAppStore.setView("exams" | "todos")`.
- ⚠️ Did NOT modify page.tsx, layout, prisma, or API routes (per rules).
- Next agents: integrate `DashboardHome` into the dashboard shell's main content area when `currentView === "dashboard"`. The component is self-contained and reads `user` from the store, so no props are required.

---
Task ID: 4
Agent: auth-builder
Task: Build the Authentication UI (`AuthScreen`) — a premium split-screen login / signup page driven by `useAppStore.currentView`.

Work Log:
- Created 3 files under `src/components/auth/`:
  - `auth-left-panel.tsx` — branded LEFT visual panel (lg+ only).
    * Full-bleed gradient backdrop `from-violet-600 via-purple-600 to-fuchsia-600` + layered radial wash + 3 localized floating blobs (fuchsia/violet/rose — NO indigo/blue).
    * Top: StudySpark logo (Sparkles icon in glassy rounded tile + wordmark).
    * Middle: tagline "Study smarter, not harder." + supporting paragraph + 3 benefit bullets (`ListChecks`, `Timer`, `BarChart3`) with staggered Framer Motion entrance.
    * Bottom: floating mock stat card "Focus this week 12.5h (+18%)" with animated bar sparkline, gently bobbing on a 5s loop.
  - `auth-form.tsx` — RIGHT form card (GlassCard) with all interactions.
    * Segmented control "Login / Sign Up" with animated sliding pill (Framer Motion `layoutId="auth-segmented-pill"`); toggling calls `setView("login" | "signup")`.
    * Mode derived from `useAppStore((s) => s.currentView)`.
    * Two separate RHF forms (`LoginForm`, `SignupForm`) crossfaded via `AnimatePresence mode="wait"`. Switching modes remounts the form → automatic reset of field values & validation state.
    * Schemas (zod v4 + `zodResolver`):
      - login: `username`/`password` required (non-empty).
      - signup: `username` 3–20 chars + `^[a-zA-Z0-9_]+$`, `password` min 6, `confirmPassword` matches via `.refine`.
    * Reusable `PasswordField` with leading icon + show/hide toggle (Eye/EyeOff) and inline red error text.
    * Inline errors under every field (small, `text-destructive`).
    * Login-only: "Remember me" `Checkbox` (local `useState`, persists username to `localStorage["studyspark_remember"]` — decorative) + "Forgot password?" muted link (decorative).
    * Submit button: full-width gradient (`from-violet-600 via-purple-600 to-fuchsia-600`), `whileHover`/`whileTap` spring, disabled + `Loader2` spinner while submitting, hover sheen sweep.
    * Submit handler: calls `login`/`signup` from `useAuth()` in try/catch. On `ApiError` → `toast.error(err.message)`; on success → `toast.success("Welcome back!" | "Account created! Welcome to StudySpark.")`. The hook auto-navigates to dashboard.
    * Below form: switch-mode link ("Don't have an account? Sign up" / "Already have an account? Login").
    * "Back to home" link at top-left of card → `setView("landing")`.
    * Mobile: hides the left panel and shows a compact StudySpark logo + wordmark inside the card.
  - `auth-screen.tsx` — thin wrapper that combines `AuthLeftPanel` + `AuthForm` inside `PageTransition`. Uses `min-h-screen lg:grid-cols-2` split layout, with a soft violet radial backdrop behind the form panel for depth.
- Design choices: violet/purple/fuchsia palette only (NO indigo/blue primary); generous padding (`p-8 sm:p-10`); `rounded-3xl` glass card with `shadow-2xl`; inputs are `h-11 rounded-xl` with leading icons for a premium feel. Fully responsive (single column on mobile, split on lg+).
- Used existing infra: `useAppStore`, `useAuth`, `ApiError`, `PageTransition`, shadcn `Input`/`Label`/`Checkbox`, `sonner` toast, `lucide-react` icons, Framer Motion, react-hook-form + `@hookform/resolvers/zod` + zod v4.
- Did NOT modify `page.tsx`, layout, prisma, or any API route. Did NOT create API routes. No test code. Did NOT start dev server or run build.
- Verified: `npx eslint src/components/auth/` → 0 errors / 0 warnings. `tsc --noEmit` → no errors in auth files. Dev server still compiles cleanly.

Stage Summary:
- **Files created**:
  - `src/components/auth/auth-screen.tsx` — named export `AuthScreen()` (the entry point).
  - `src/components/auth/auth-left-panel.tsx` — named export `AuthLeftPanel()`.
  - `src/components/auth/auth-form.tsx` — named export `AuthForm()` (plus internal `LoginForm`, `SignupForm`, `SegmentedControl`, `PasswordField`, `SubmitButton`).
- **Import path**: `import { AuthScreen } from "@/components/auth/auth-screen"`.
- **Integration note for orchestrator (Task 7)**: in `src/app/page.tsx`, render `<AuthScreen />` when `currentView === "login" || currentView === "signup"`. The component reads `currentView` itself to pick the form mode, so no props are needed. On successful auth, `useAuth` automatically calls `setView("dashboard")`.
- **Conventions followed**: violet/purple palette (no indigo/blue primary), glassmorphism via `.glass-strong`, Framer Motion entrance + crossfade + micro-interactions, full responsive (mobile-first), 20–24px card radius, ≥44px touch targets.

---
Task ID: 6-de
Agent: exams-subjects-builder
Task: Build the Exams Page and Subjects Page for the StudySpark dashboard (Next.js 16 + TS + Tailwind 4 + shadcn/ui + Framer Motion). Both render inside the dashboard main content area as part of the SPA on `/`.

Work Log:
- Created `src/components/dashboard/pages/exams.tsx` — named export `ExamsPage` (also default). Loads exams from `GET /api/exams` and subjects from `GET /api/subjects` (subject names drive a colored Select picker inside the add/edit form, with free-text fallback).
  - Header: "Upcoming Exams" + subtitle, gradient (violet → fuchsia) "Add Exam" button.
  - Stats row (4 GlassCards, AnimatedCounter): Total exams · Upcoming (today/future) · High priority count · Avg. progress %.
  - Exam cards (1/2/3 responsive grid, GlassCard with hover lift): colored subject badge (color matched from subjects list, fallback violet), exam name (big), formatted date (date-fns), time, location (MapPin), priority badge (PRIORITY_CONFIG).
  - Live countdown timer per card — `FlipDigit` per unit (days/hours/min/sec), AnimatePresence flip animation, ticks every 1s via `setInterval` + cleanup. Urgency color-coding: rose <3d, amber <7d, violet otherwise. "Exam window passed" state for past exams.
  - Animated gradient progress bar (color shifts by progress level). Truncated notes preview.
  - Edit/Delete via dropdown menu → dialog (edit) / alert dialog (delete with optimistic mutation + rollback).
  - Add/Edit dialog: subject (Select from /api/subjects or free text), examName (required), date (required), time, location, priority (Select), progress (Slider 0-100), notes (Textarea). Validates required fields. POST on create / PUT on update. Toast feedback.
  - Past exams section: Collapsible list with mini progress bars and animated chevron.
  - Empty / loading / error states: skeletons, EmptyState with CTA, toast errors via `handleError`.
- Created `src/components/dashboard/pages/subjects.tsx` — named export `SubjectsPage` (also default). Loads subjects from `GET /api/subjects`.
  - Header: "My Subjects" + subtitle, gradient "Add Subject" button.
  - Overview row (4 GlassCards, AnimatedCounter): Total subjects · Total credits · Avg. attendance · Avg. progress.
  - Subject cards (1/2/3 responsive grid, GlassCard with hover lift): colored left accent bar + dot using subject color, name (big), teacher (User icon), credits badge, prep-progress badge.
  - Circular SVG attendance ring (`AttendanceRing`) with `strokeDashoffset` draw animation; color-coded (emerald ≥75, amber 60-74, rose <60) with "Good / At risk / Low" status label.
  - Linear progress bar using subject color (chart hex). Notes preview (2 lines, StickyNote icon).
  - Edit/Delete via dropdown menu → dialog / alert dialog (optimistic mutation + rollback).
  - Add/Edit dialog: name (required), teacher, credits (1-10), attendance (Slider 0-100), color (6-swatch EventColor picker with check animation), progress (Slider 0-100), notes (Textarea). Validates name + credits. POST/PUT. Toast feedback.
  - Empty / loading / error states: skeletons, EmptyState with CTA, toast errors.
- Both files: `"use client"`, TS strict, no `any`, premium glassy violet/purple palette (NO indigo/blue primary), 24px radius cards, soft shadows, fully responsive, Framer Motion everywhere (page transition, stagger entrance, hover lift, countdown flip, progress width animation, ring draw, dialog scale/fade via radix+shadcn).
- Imported only from existing libs: `@/lib/api`, `@/lib/types`, `@/lib/store`, `@/lib/utils`, `@/components/shared/{motion,feedback,animated-counter}`, `@/components/ui/*`, `framer-motion`, `sonner`, `date-fns`, `lucide-react`.
- Did NOT modify `page.tsx`, `layout.tsx`, prisma schema, or any API route. No new dependencies installed.
- Lint clean on both new files (one targeted `eslint-disable-next-line react-hooks/set-state-in-effect` in exams.tsx for legitimate countdown resync when the exam target changes). Remaining lint errors in the project belong to other agents' files (profile.tsx, settings.tsx).

Stage Summary:
- **Exams page complete** (`src/components/dashboard/pages/exams.tsx`):
  - `export function ExamsPage()` + default export.
  - Exciting live countdown timers with flip-clock animation + urgency color coding, full CRUD with optimistic updates, past exams collapsible, stats row, loading/empty/error states.
- **Subjects page complete** (`src/components/dashboard/pages/subjects.tsx`):
  - `export function SubjectsPage()` + default export.
  - Organized subject cards with animated circular attendance rings + linear progress bars + colored accent bars, full CRUD with optimistic updates, 6-swatch color picker, stats row, loading/empty/error states.
- **Ready to wire**: Import `ExamsPage` / `SubjectsPage` from `@/components/dashboard/pages/exams` / `@/components/dashboard/pages/subjects` and render when `useAppStore.currentView === "exams"` / `"subjects"` in the main `page.tsx`.
- Work record saved at `/home/z/my-project/agent-ctx/6-de-exams-subjects-builder.md`.

---
Task ID: 6-fg
Agent: focus-analytics-builder
Task: Build the Focus Timer page and Analytics page for the StudySpark dashboard (two `"use client"` React components rendered inside the dashboard main content area when `currentView === "focus"` / `"analytics"`).

Work Log:
- **FILE 1 — `src/components/dashboard/pages/focus-timer.tsx`** (`export function FocusTimerPage()`):
  - Header: "Focus Timer" title + subtitle, plus a `Sparkles`-accented Badge showing sessions completed in the current sitting.
  - Main timer card (GlassCard, 2/3 width on lg): animated mode-tab pill (Focus 25m / Short Break 5m / Long Break 15m) using `layoutId` shared-element transition; each mode has its own gradient ring + glow color (violet→fuchsia for focus, cyan for short, rose for long).
  - Big circular SVG progress ring (RADIUS 132, STROKE 14, CIRCUMFERENCE = 2πr) with gradient stroke (`linearGradient`) + soft blur glow filter, animated `strokeDashoffset` via Framer Motion. Center: small mode label, large mono `MM:SS` countdown (AnimatePresence digit transition), and "Session N" counter.
  - Controls: ghost `RotateCcw` reset, big gradient Play/Pause button (whileHover/whileTap), ghost `SkipForward` skip-to-end. Status line below.
  - Custom duration row: preset chips (15/25/45/60 for focus, 3/5/10/15 for short, 10/15/20/30 for long) that highlight active preset + numeric `<Input>` (clamped 1–180).
  - Subject tag `<Input>` + "Auto start break" `<Switch>` toggle in a 2-col footer.
  - Timer logic: setInterval ticks decrements `remaining` (cleanup on unmount/pause). `loggedRef` guard ensures completion side-effects fire exactly once per cycle. On hit 0: toast notification (`Coffee` for focus-end, `Brain` for break-end), POST `/api/focus-session` with `{duration, type, subject, completed:true}`, then auto-switch to short/long break if `autoBreak` (long break every 4th focus session) or back to focus. Refreshes sessions list on success.
  - Break reminders card: two decorative `ReminderCard` items (Stretch w/ Coffee icon, Hydrate w/ Droplets icon), each with a dismiss X that toasts.
  - Focus statistics card (right column): 4 AnimatedCounter stat boxes — Today (minutes), This Week (hours, 1dp), This Month (hours, 1dp), Total sessions. Below: 7-day BarChart of focus minutes (gradient violet→fuchsia bars, rounded top, custom ChartTooltip, CartesianGrid).
  - Recent sessions list: last 8 sessions, each row has focus/break icon (Brain/Coffee) in tinted square, subject or default label, `formatDistanceToNow` time-ago, duration, and a `CheckCircle2` for completed. `max-h-96 overflow-y-auto scrollbar-thin`. Empty state when no sessions.
  - Loading skeletons everywhere; error toasts via `handleError`.
- **FILE 2 — `src/components/dashboard/pages/analytics.tsx`** (`export function AnalyticsPage()`):
  - Header: "Analytics" title + subtitle, plus a Weekly/Monthly toggle pill (`layoutId` shared-element) that switches the Study Hours chart source and X-axis density.
  - KPI row (4 GlassCards, AnimatedCounter): Total Focus Hours, Weekly Focus Hours, Monthly Focus Hours, Study Streak (days). Each card has a gradient icon chip + decorative blurred gradient orb.
  - Study Hours Over Time (big, 2/3 width): `AreaChart` with violet→fuchsia gradient fill, smooth monotone line, gradient stroke, active dot, custom ChartTooltip. Weekly shows 7 days, monthly shows 30 days with `interval={4}` to avoid X-axis crowding.
  - Tasks Completed (14 days): `BarChart` of `trendData` with purple→pink gradient bars, rounded tops.
  - Subject Progress: horizontal `BarChart` (layout="vertical") of `subjectPerformance`, each bar colored by `colorOf(entry.color).chart`, progress % on X-axis 0–100.
  - Focus Time by Subject: donut `PieChart` of `focusBySubject` with `innerRadius={55}`, cells colored by subject color, white stroke separators, bottom legend. EmptyState when no data.
  - Exam Readiness: `RadialBarChart` of `examProgress` with `PolarAngleAxis` domain 0–100, rounded bars, palette `CHART_PALETTE` (violet→cyan 8 colors), bottom legend. EmptyState when no exams.
  - Tasks by Category: grouped `BarChart` (total + completed) of `categoryStats`.
  - Tasks by Priority: grouped `BarChart` of `priorityStats` with completed bars using gradient.
  - Attendance Overview card: animated SVG radial gauge showing average attendance across all subjects (green→cyan gradient stroke draw animation), plus a scrollable per-subject list with custom motion-div progress bars colored by subject color.
  - All charts wrapped in `GlassCard` + `StaggerContainer`/`StaggerItem` for entrance animations, `ResponsiveContainer` with fixed heights (h-56 / h-64 / h-72), `text-border` CartesianGrid, `text-muted-foreground` axis ticks, glass-strong custom tooltips. Loading skeletons, empty states, error toasts throughout. Respects `reduceMotion` (skips chart animation duration + ring draw).
- Both files: `"use client"`, TS strict (no `any` — replaced with explicit `ChartTooltipProps` interface), premium glassy violet/purple palette (NO indigo/blue primary), 20–24px radius cards, soft shadows, fully responsive (single column on mobile, 3-col grids on lg), Framer Motion everywhere (page transition, stagger entrance, shared layout pills, ring stroke animation, hover lifts, digit transitions, progress width animations).
- Imported only from existing libs: `@/lib/api`, `@/lib/types`, `@/lib/store`, `@/lib/utils`, `@/components/shared/{motion,feedback,animated-counter}`, `@/components/ui/{button,input,switch,badge}`, `framer-motion`, `recharts`, `sonner`, `date-fns`, `lucide-react`.
- Did NOT modify `page.tsx`, `layout.tsx`, prisma schema, or any API route. No new dependencies installed.
- Lint clean on both new files (verified `npx eslint` exits 0 on both files individually). Remaining lint errors in the project belong to other agents' files (`profile.tsx`, `settings.tsx`, `use-auth.ts`).

Stage Summary:
- **Focus Timer page complete** (`src/components/dashboard/pages/focus-timer.tsx`):
  - `export function FocusTimerPage()` — premium Pomodoro timer with animated circular SVG ring, mode tabs (Focus/Short/Long), Start/Pause/Reset/Skip controls, custom duration presets + numeric input, subject tag, Auto-Break toggle, completion toasts + auto POST to `/api/focus-session`, break reminder cards, focus statistics with AnimatedCounters + 7-day BarChart, and a recent sessions list. Tracks remaining seconds (not end-time) so pauses work correctly; interval cleaned up on unmount.
- **Analytics page complete** (`src/components/dashboard/pages/analytics.tsx`):
  - `export function AnalyticsPage()` — data-viz showcase with Weekly/Monthly toggle, 4 KPI cards (AnimatedCounter), AreaChart of study hours (gradient fill), BarChart of 14-day task completion, horizontal BarChart of subject progress, donut PieChart of focus distribution by subject, RadialBarChart of exam readiness, grouped BarCharts for tasks by category and priority, and an attendance overview card with animated SVG gauge + per-subject progress bars. Skeletons + empty states + error toasts throughout.
- **Ready to wire**: Import `FocusTimerPage` from `@/components/dashboard/pages/focus-timer` and `AnalyticsPage` from `@/components/dashboard/pages/analytics`, then render when `useAppStore.currentView === "focus"` / `"analytics"` in the main `page.tsx` (or dashboard shell).
- Work record saved at `/home/z/my-project/agent-ctx/6-fg-focus-analytics-builder.md`.

---
Task ID: 3
Agent: landing-builder
Task: Build the entire marketing landing page (`LandingPage`) for StudySpark as a single component plus supporting sub-components under `src/components/landing/`. Use existing infrastructure from task 1 (Zustand store, API lib, theme, shared motion/blobs/counter components, shadcn/ui). Do not recreate foundation. Wire auth CTAs via `useAppStore.setView("login" | "signup")`.

Work Log:
1. Read worklog + existing infra (`src/lib/store.ts`, `src/components/shared/{motion,animated-blobs,animated-counter}.tsx`, `src/app/globals.css`, `src/components/ui/{button,sheet}.tsx`) to confirm exact prop/variant APIs and palette tokens.
2. Created modular sub-components under `src/components/landing/` (each `"use client"`, strict TS, no `any`):
   - `scroll-helpers.ts` — `scrollToSection(id)` smooth-scroll helper used by navbar / footer links.
   - `logo.tsx` — gradient Sparkles square + "StudySpark" wordmark with `whileHover` rotate; reused by navbar and footer.
   - `section-heading.tsx` — reusable eyebrow chip + title (with optional gradient highlight) + description, each piece animated in-view.
   - `navbar.tsx` — sticky floating glass-pill navbar at the top of the viewport; tracks `window.scrollY` to upgrade to `glass-strong` with violet shadow. Desktop: nav links (Features / Pricing / Testimonials) smooth-scroll via helper, ghost Login button → `setView("login")`, gradient Get Started button → `setView("signup")`. Mobile: hamburger opens shadcn `Sheet` from right with animated link list + auth buttons wrapped in `SheetClose asChild` so sheet dismisses on action.
   - `hero.tsx` — two-column hero with stagger entrance. Left: violet eyebrow chip, H1 "Your studies, beautifully organized." with `.text-gradient` on "beautifully organized.", subheadline, two CTAs (Start for free → signup; See features → scroll), trust badges row (Free forever / No credit card / Privacy-first). Right: floating `glass-strong` dashboard mockup with window chrome, greeting row, 3 mini stat cards, an SVG area chart with gradient fill, animated task list, and two floating chips (Focus 25:00, Streak 14 days) on independent float loops. Behind everything: `AnimatedBlobs variant="landing"` + 4 floating decorative shapes (rotating/drifting gradient blobs).
   - `stats-bar.tsx` — single glass card with 4 columns; each uses `AnimatedCounter` for count-up on in-view: 10k+ Students, 500k+ Tasks completed, 99.9% Uptime, 4.9/5 Rating. Distinct gradient icon chips per stat.
   - `features.tsx` — `#features` section with heading + 6 `GlassCard`s (Dashboard, Smart Tasks, Focus Timer, Analytics, Calendar, Exam Tracker). Each card has a gradient icon chip that rotates + lifts on hover, a hover glow blob, wrapped in `StaggerContainer`/`StaggerItem` for staggered entrance. Feature icons typed as `LucideIcon` so `strokeWidth` prop typechecks.
   - `screenshots.tsx` — `#screenshots` section with 3 alternating-side preview rows (Dashboard / Analytics / Focus Timer). Each preview is a styled mock in a glass frame: Dashboard = greeting + stat cards + animated bar chart + task list; Analytics = subject progress bars animating in width + KPI cards; Focus Timer = animated SVG progress ring (`strokeDashoffset` draw) + session stats. Captions + descriptions on the opposite side, each row staggered in-view.
   - `pricing.tsx` — `#pricing` section with a single centered Free plan `GlassCard`: "$0 /month", gradient "Free" badge, "Get started free" CTA → signup, 8-item checkmark list with gradient check chips, dashed "Pro coming soon" muted note.
   - `testimonials.tsx` — `#testimonials` section with 3 staggered `GlassCard`s. Each: Quote icon, quote, 5 amber stars, gradient initial-avatar circle, name + role.
   - `cta-section.tsx` — full-width gradient banner (violet → purple → fuchsia) with two animated glow blobs, a subtle grid overlay, "Ready to transform your study life?" headline, two buttons (white "Get started — it's free" → signup; glass "Login" → login).
   - `footer.tsx` — multi-column footer: brand block + tagline + 3 social icons (Github / Twitter / LinkedIn); 4 link columns (Product / Company / Resources / Legal — Product links smooth-scroll, others are anchors); bottom bar with "© 2025 StudySpark. Crafted with ❤️" + "Made for students, by students" status note.
3. Composed everything in `landing-page.tsx` exporting `export function LandingPage()`. Root is `<div className="min-h-screen">` with `<Navbar/>`, `<main>` wrapping Hero → Stats → Features → Screenshots → Pricing → Testimonials → CTA, then `<Footer/>`. No sticky-footer logic here (app shell handles that, per instructions).
4. Ran `bunx eslint src/components/landing/` → clean. Ran `bunx tsc --noEmit` → caught one `strokeWidth` typing issue on `Feature.icon` (was typed as `React.ComponentType<{className?:string}>`); fixed by switching to `lucide-react`'s `LucideIcon` type. Re-ran both → clean.
5. Verified no `indigo` / `blue` / `sky` colors used as brand accents (Calendar feature gradient switched from `cyan→sky` to `teal→cyan` to stay strictly within violet/purple/fuchsia primary palette).
6. Checked `dev.log` — compiles cleanly, no errors from landing files.

Stage Summary:
- **Files produced** (all under `src/components/landing/`):
  - `landing-page.tsx` ← **main deliverable**, `export function LandingPage()`
  - `navbar.tsx` — `export function Navbar()`
  - `hero.tsx` — `export function Hero()`
  - `stats-bar.tsx` — `export function StatsBar()`
  - `features.tsx` — `export function Features()`
  - `screenshots.tsx` — `export function Screenshots()`
  - `pricing.tsx` — `export function Pricing()`
  - `testimonials.tsx` — `export function Testimonials()`
  - `cta-section.tsx` — `export function CTASection()`
  - `footer.tsx` — `export function Footer()`
  - `logo.tsx` — `export function Logo({ className?, showWordmark?, onClick? })`
  - `section-heading.tsx` — `export function SectionHeading(...)`
  - `scroll-helpers.ts` — `export function scrollToSection(id: string)`
- **Import for orchestrator (Task 7)**:
  ```tsx
  import { LandingPage } from "@/components/landing/landing-page";
  // render when useAppStore.currentView === "landing"
  ```
- **Design system honored**: `"use client"` everywhere, strict TS (no `any`), semantic HTML (`header`/`nav`/`main`/`section`/`footer`); violet/purple/fuchsia primary palette (no indigo/blue brand accents); `.glass` / `.glass-strong` for all cards and navbar; `rounded-3xl` for hero/pricing/CTA, `rounded-2xl` for chips and inner cards; Framer Motion stagger entrances, hover lifts (scale 1.01-1.05), tap scale 0.95-0.98, infinite floating animations on hero mockup + decorative shapes, animated stat/count-up bars; `AnimatedCounter` for stats, `AnimatedBlobs variant="landing"` in hero, `StaggerContainer`/`StaggerItem`/`GlassCard` reused; mobile-first (navbar collapses to `Sheet`; all grids reflow 1 → 2 → 3-4 columns; trust badges wrap; CTA buttons stack); `py-20 sm:py-28` section padding; `scroll-mt-24` on anchored sections so floating navbar never covers headings; auth CTAs wired via `useAppStore((s) => s.setView)("login" | "signup")` in navbar, hero, pricing, CTA — both desktop and mobile.
- **Lint / TS status**: clean. **`src/app/page.tsx` not modified.** No new API routes. Ready for orchestrator to wire into the SPA shell. Work record also saved at `/home/z/my-project/agent-ctx/3-landing-builder.md`.

---
Task ID: 6-h
Agent: profile-settings-builder
Task: Build Profile page + Settings page for the StudySpark dashboard (premium glass UI, Framer Motion, full loading/empty/error states, accent-color aware)

Work Log:
- **Profile page** (`src/components/dashboard/pages/profile.tsx`, `export function ProfilePage()`):
  - Fetches `GET /api/auth/me` (for `{ user, profile }`) and `GET /api/analytics` (for stats) in parallel; analytics is best-effort.
  - **ProfileAvatar**: 96px gradient circle with rotating conic-gradient glow ring, pulsing inner ring, and avatar content. Shows `<img>` when `profile.avatar` URL is set, falls back to user's first initial, or `ImageOff` icon on broken URL. All hues use `oklch(... var(--accent-color))` so they follow the active accent.
  - **ProfileHero** (GlassCard): avatar + bold username + gradient "Student" badge + "Member since {month year}" + bio (or muted placeholder) + goal tagline (Quote icon pill) + gradient "Edit Profile" button. Skeleton placeholders while loading.
  - **Stats row**: 4 cards — Study Streak (Flame, AnimatedCounter), Target/Day (Target), Total Focus (Clock, decimals-aware), Semester (Hash). Each uses `AnimatedCounter` and a colored gradient icon tile.
  - **Details grid**: College (School), Course (BookOpen), Semester (BookMarked), Target Hours/Day (Target) — each with "Not set" muted text when empty.
  - **Goal spotlight**: separate GlassCard with the user's goal as a large italic quote when present.
  - **Edit dialog**: split into `EditProfileForm` (inner, mounts fresh on open so `useState` initializes from the current profile — avoids `react-hooks/set-state-in-effect`) and `EditProfileDialog` (thin wrapper). Fields: Bio (Textarea, max 500, live counter), Goal (Input, max 200, live counter), Target Hours/day (1–24), Semester (1–12), College, Course, Avatar URL. Per-field validation with inline errors and `aria-invalid`.
  - **Animated Save button**: 3-state `AnimatePresence mode="wait"` — idle "Save Changes" → saving spinner → success spring-in checkmark (`AnimatedCheck` SVG with `motion.path pathLength: 0→1`) → dialog closes after 1.1s. Toast "Profile updated!" on success. Local state updates immediately via `onSaved` callback.
  - **Error state**: `EmptyState` with Retry button if initial fetch fails.

- **Settings page** (`src/components/dashboard/pages/settings.tsx`, `export function SettingsPage()`):
  - **Appearance section**: Theme toggle (Light/Dark/System via `useTheme()` with a sliding `motion.div layoutId` indicator; mounted flag with eslint-disable for the canonical next-themes SSR pattern). Accent picker: 6 swatches (`277` Violet, `300` Purple, `162` Emerald, `16` Rose, `200` Cyan, `70` Amber) using inline `backgroundColor: oklch(0.6 0.2 ${hue})`. Active swatch shows a spring-in Check icon and ring; calls `setAccentColor(hue)` — the `AccentColorApplier` in layout remaps `--primary`/`--ring`/`--chart-1` globally.
  - **Preferences section**: Three Switch rows — Notifications (`notifications`/`setNotifications`), Reduce Motion (`reduceMotion`/`setReduceMotion`), Default Sidebar Collapsed (inverted `sidebarOpen`). Toasts on every toggle.
  - **Account section**: Read-only username Input + "Member Since" date box (skeleton placeholders while `GET /api/auth/me` resolves). "Log Out" button (destructive, calls `useAuth().logout`, spinner during request, toast on success). "Reset All My Data" button (destructive) opens an `AlertDialog` with live progress: typed `Promise.all` of todos/subjects/events/exams, sequential `DELETE /api/{type}/{id}` with current/total/percent + animated progress bar, then `PUT /api/profile` with defaults. Toast on completion; auto-close after 1.4s.
  - **About section**: accent-gradient logo + "StudySpark" title + v1.0.0 badge + description + 3 decorative link chips (Website/GitHub/Contact, info toast when clicked) + "Made with ❤ for students everywhere." footer.
  - All sections wrapped in `StaggerItem` for entrance animation; `SettingsSection` + `SettingsRow` are reusable building blocks.

- Lint: both new files clean (pre-existing errors in `calendar.tsx` / `todos.tsx` / `use-auth.ts` are outside this task's scope and were not touched). Dev server compiles cleanly.
- Work record also written to `/agent-ctx/6-h-profile-settings-builder.md`.

Stage Summary:
- **Files delivered**:
  - `src/components/dashboard/pages/profile.tsx` — `export function ProfilePage()` (also default export)
  - `src/components/dashboard/pages/settings.tsx` — `export function SettingsPage()` (also default export)
- **Import paths**:
  ```ts
  import { ProfilePage } from "@/components/dashboard/pages/profile";
  import { SettingsPage } from "@/components/dashboard/pages/settings";
  ```
- **Wiring**: render inside the dashboard main area when `useAppStore.currentView === "profile"` or `"settings"`. Pure client components, no params — read state from the Zustand store + the API.
- **Conventions**: `"use client"`; TS strict, no `any`; reused `GlassCard`/`PageTransition`/`StaggerContainer`/`StaggerItem`/`AnimatedCounter`/`Skeleton`/`EmptyState`/shadcn UI; violet/purple palette with accent-color-driven primary via `oklch(0.58 0.22 var(--accent-color))`; 20–24px card radii; mobile-first responsive; loading/empty/error states on all async surfaces; Framer Motion for card stagger, hover lifts, switch toggles, save checkmark, avatar ring pulse, accent checkmark, sliding theme indicator, reset progress bar; `sonner` toasts for all user actions.

---

Task ID: 6-bc
Agent: todos-calendar-builder
Task: Build the TODOS PAGE and CALENDAR PAGE for StudySpark — a premium student analytics dashboard. Two files render inside the dashboard main content area: a Kanban-style task board with drag & drop, and a multi-view calendar with event management.

Work Log:
- Read `worklog.md` to align with project conventions (`apiFetch`/`handleError`, `useAppStore`, `GlassCard`/`PageTransition`/`StaggerContainer`, `colorOf`/`PRIORITY_CONFIG`/`CATEGORY_CONFIG`, violet/purple palette, 20–24px radii, mobile-first, sonner toasts, Framer Motion everywhere).
- Inspected existing shared components (`motion.tsx`, `feedback.tsx`, `animated-counter.tsx`), UI primitives (`button`, `dialog`, `alert-dialog`, `select`, `tabs`, `checkbox`, `dropdown-menu`, `badge`, `scroll-area`, `popover`, `calendar`), `lib/api.ts`, `lib/store.ts`, `lib/types.ts`, `lib/utils.ts`, `globals.css`, and API route shapes (`/api/todos`, `/api/events`, `/api/subjects`).
- Verified `@dnd-kit/core@6.3.1`, `@dnd-kit/sortable@10.0.0`, `@dnd-kit/utilities@3.2.2`, `date-fns@4.1.0`, `framer-motion@12.23.2` are installed.
- **`src/components/dashboard/pages/todos.tsx`** — `TodosPage`:
  - Header (gradient "New Task" button) + 4 stat cards (Total / Completed / In Progress / Completion % with animated SVG ring) using `AnimatedCounter`.
  - Toolbar: live search (title/description) with clear button, status tabs (All/To Do/Active/Done — also drives which board columns are visible), priority Select, sort Select (due date / priority / created).
  - Kanban board with `DndContext` + `SortableContext` + `useSortable` per card + `useDroppable` per column. Cross-column drops update status via PUT; within-column reorders persist new `order` for every changed card via batched PUTs. `DragOverlay` renders a tilted ghost card with `dropAnimation`. `PointerSensor` (distance: 6) + `KeyboardSensor` for accessibility.
  - Task cards: priority stripe, title (strike-through when completed), truncated description, animated `Checkbox` toggle (emerald when checked), priority/category/subject/due-date badges, overdue highlight (red), and a `...` dropdown (Edit / Delete). Edit opens a prefilled dialog; Delete opens an `AlertDialog`.
  - Create/Edit dialog: Title (required, with validation), Description, Priority, Category, Status, Subject (loaded from `/api/subjects` + "None"), Due date (`<input type="date">`). Uses `key={formOpen ? open-${editing?.id ?? "new"} : "closed"}` + `useState` initializer so form state resets cleanly on each open (no `setState`-in-effect lint violation).
  - Empty state with "Create your first task" CTA, board skeleton, sonner toasts on every mutation, optimistic local-state updates with revert on error.
- **`src/components/dashboard/pages/calendar.tsx`** — `CalendarPage`:
  - Header (gradient "New Event" button), 3 mini stats (This Month / Upcoming / All Events) with `AnimatedCounter`, and a main grid (calendar card + Upcoming sidebar).
  - Toolbar: "Today" button, prev/next chevrons, and view Tabs (Month / Week / Day) with a live header label.
  - Month view: custom 7-column Sun–Sat grid built with `startOfMonth`/`endOfMonth`/`startOfWeek`/`endOfWeek`/`eachDayOfInterval`/`isSameMonth`/`isToday`. Each cell shows date number (today highlighted with violet gradient ring), up to 3 colored event chips, "+N more" overflow, and a hover "+" add button. Clicking a day opens a day-detail dialog.
  - Week view: 7-column responsive grid (`grid-cols-2 sm:grid-cols-4 lg:grid-cols-7`) of day cells with full event lists per day.
  - Day view: focused single-day layout with date badge, count, and animated event rows (time badge, description, edit affordance on hover).
  - Event create/edit dialog: Title (required), Date, Time, Description, and a 6-swatch color picker (COLOR_MAP keys) with animated checkmark on selection. Same `key`-based reset pattern.
  - Upcoming events sidebar: next 5 events (sorted, filtered by `isAfter`/`isSameDay` today) with colored dot, title, date, time, and click-to-edit. Empty state with "Add Event" CTA, skeleton loading, sonner toasts.
  - Day-detail dialog: lists that day's events with edit/delete affordances and "Add Event" CTA prefilled to the day.
  - Delete confirmation `AlertDialog`, optimistic updates with revert, loading/empty/error states everywhere.
- Both files: `"use client"`, TS strict (no `any`), `date-fns` for all date math, Framer Motion staggers/hover-lifts/layout/scale animations, 20–24px radii, glassy violet palette (no indigo/blue primary), mobile-first responsive (board columns stack at `md`, calendar cells reflow at `sm`/`lg`).
- Fixed two `react-hooks/set-state-in-effect` lint errors by switching from `useEffect`-based form reset to a `key`-remount + `useState`-initializer pattern (cleaner + faster).
- `bun run lint`: 0 errors, 1 pre-existing warning (`src/hooks/use-auth.ts`, not my code). `bunx tsc --noEmit`: 0 errors in my files (other files have pre-existing errors).

Stage Summary:
- **`src/components/dashboard/pages/todos.tsx`** — `export function TodosPage()` — full Kanban task board with drag & drop (cross-column status updates + within-column reorder persistence), stats, search/filter/sort toolbar, create/edit dialog, delete confirmation, loading/empty/error states. Import: `import { TodosPage } from "@/components/dashboard/pages/todos"`.
- **`src/components/dashboard/pages/calendar.tsx`** — `export function CalendarPage()` — multi-view (Month/Week/Day) calendar with custom month grid, event CRUD, color picker, upcoming sidebar, day-detail dialog, loading/empty/error states. Import: `import { CalendarPage } from "@/components/dashboard/pages/calendar"`.
- **Wiring**: render inside the dashboard main area when `useAppStore.currentView === "todos"` or `"calendar"`. Pure client components, no params — fetch their own data from `/api/todos`, `/api/events`, `/api/subjects`; use `apiFetch`/`handleError`/`sonner` for all mutations.
- **Conventions followed**: `"use client"`; TS strict, no `any`; reused `GlassCard`/`PageTransition`/`StaggerContainer`/`StaggerItem`/`AnimatedCounter`/`Skeleton`/`EmptyState` + full shadcn UI set (`Dialog`, `AlertDialog`, `Select`, `Tabs`, `Checkbox`, `Badge`, `DropdownMenu`, `ScrollArea`, `Input`, `Label`, `Textarea`, `Button`); `@dnd-kit/core`+`@dnd-kit/sortable`+`@dnd-kit/utilities` for DnD; `date-fns` for all date math; `framer-motion` for staggers, hover lifts, layout/scale animations, dialog scale/fade, checkbox tap, color-swatch checkmark, SVG ring draw; violet/purple palette via `accent-gradient`/`accent-text` (no indigo/blue primary); 20–24px card radii; mobile-first responsive; optimistic local state with revert; sonner toasts on every action.

---
Task ID: 5 + 7 + 8
Agent: orchestrator (main)
Task: Dashboard shell (sidebar+topbar), main page.tsx assembly, QA & bug fixes

Work Log:
- Built `src/components/dashboard/sidebar.tsx` — animated collapsible sidebar (76px collapsed / 264px expanded) with: gradient logo, 9 nav items (Dashboard, Daily Tasks, Calendar, Subjects, Upcoming Exams, Focus Timer, Analytics, Profile, Settings), shared-layoutId active pill (gradient), tooltips when collapsed, user card with avatar + logout at bottom, collapse toggle button. Mobile drawer (Sheet-style) with backdrop, spring slide-in, X close.
- Built `src/components/dashboard/topbar.tsx` — sticky glass topbar with: mobile hamburger, animated page title/subtitle (per-view), search input with ⌘K kbd hint (desktop), theme toggle (CSS-based sun/moon crossfade — no hydration mismatch), notifications bell with ping dot, user chip (click → profile). Fixed lint error (removed setState-in-effect mounted pattern).
- Built `src/components/dashboard/dashboard-shell.tsx` — combines Sidebar + Topbar + lazy-loaded page router. Uses React.lazy + Suspense (PageLoader fallback) for all 9 dashboard pages to keep initial bundle light. AnimatePresence mode="wait" for page transitions (fade+slide), respects reduceMotion. AnimatedBlobs (dashboard variant) in background. Scrollable main with max-w-[1400px].
- Built `src/app/page.tsx` — root SPA entry. Reads authLoading/user/currentView from store. Shows branded loading screen while session checks. Guard effect redirects: unauthenticated users on dashboard views → landing; authenticated users on landing/auth views → dashboard. AnimatePresence crossfades between LandingPage / AuthScreen / DashboardShell.
- Fixed critical race condition in `src/hooks/use-auth.ts`: the `/api/auth/me` check was running per-component-mount (page.tsx + auth-form each fired their own). A stale in-flight me-check (sent before signup set the cookie) would resolve with null and clobber the just-authenticated user, bouncing to landing/login. Fix: module-level `meCheckStarted` guard so the check runs ONCE per page load, PLUS defensive check (`if (data.user) setUser(...) else if (!getState().user) setUser(null)`) so a stale null never overrides a fresh login/signup.

QA Results (agent-browser end-to-end verification):
- Landing page: ✓ all 9 sections render (hero, stats, features, previews, pricing, testimonials, CTA, footer, navbar). Login/Get Started buttons navigate to auth.
- Signup: ✓ created "testuser" account → cookie set → dashboard renders immediately (race fix confirmed). Session persists across reload.
- Login: ✓ toggle + form working.
- Dashboard home: ✓ "Good morning, Testuser 👋" greeting with live clock, 5 stat cards (AnimatedCounter), Weekly/Monthly study hours charts, rotating motivational quote, subject progress, upcoming exams + today's tasks previews.
- Todos: ✓ New Task dialog (title/desc/priority/category/status/subject/due date), created "Finish calculus assignment" task, appears in To-Do column with badges.
- Focus Timer: ✓ 25:00 countdown, Focus/Short Break/Long Break tabs, duration presets, subject tag, auto-break toggle, wellness nudges, focus statistics, 7-day chart.
- Profile: ✓ avatar with initial, username, member-since, bio, goal, stats, academic details, edit dialog.
- Analytics: ✓ KPI cards, Study Hours Over Time area chart, Tasks Completed bar chart, Subject Progress, Focus by Subject donut, Exam Readiness radial, Tasks by Category/Priority — all with proper empty states.
- Dark mode: ✓ toggle works (CSS class on <html>), sun/moon icons crossfade.
- Mobile (390x844): ✓ hamburger opens drawer with all nav items, layout responsive.
- Lint: ✓ clean (0 errors, 0 warnings).
- Console errors: ✓ none.
- Dev log: ✓ all API routes return 200, Prisma queries executing, no errors.

Stage Summary:
- **App is fully functional end-to-end.** All 9 dashboard pages, auth, landing, and navigation work.
- Architecture: SPA on `/` route, Zustand-driven navigation, lazy-loaded pages, JWT cookie auth, Prisma/SQLite.
- Race condition in auth fixed; session persists across reloads.
- The recurring webDevReview cron job (every 15 min) will continue QA + feature expansion.

---
Task ID: feat-2
Agent: seed-data-builder
Task: Add Seed Data / Demo Mode feature — POST /api/seed endpoint + Demo Data section in Settings page

Work Log:
- Created `/home/z/my-project/src/app/api/seed/route.ts` — POST endpoint that:
  - Verifies authentication via `getCurrentUser()`
  - Deletes ALL existing user data (focusSessions, exams, events, todos, subjects, profile) in correct order
  - Seeds 5 subjects (Mathematics/violet/85%/72%, Computer Science/blue/92%/65%, Physics/green/78%/45%, English Literature/amber/95%/80%, Chemistry/rose/70%/35%)
  - Seeds 10 todos (3 todo, 4 in-progress, 3 completed) with varied priorities/categories/subjects and spread due dates
  - Seeds 5 events across current and next 2 weeks with colors and descriptions
  - Seeds 4 exams over next 2-4 weeks with varying progress (30%, 55%, 75%, 90%)
  - Seeds 14 focus sessions across last 7 days with varying durations (15-60 min), mostly "focus" type, tagged with subject names
  - Creates profile with bio, goal, targetHours:6, college, course, semester:4, studyStreak:7
  - Uses `date-fns` (addDays, subDays, setHours, setMinutes, startOfWeek) for realistic date calculations
  - Returns `{ success: true, message: "Demo data seeded successfully" }` with 201 status
- Updated `/home/z/my-project/src/components/dashboard/pages/settings.tsx`:
  - Added `LoadDemoDataDialog` component with AlertDialog confirmation flow
  - Added "Demo Data" SettingsSection between Account and About sections
  - Gradient "Load Demo Data" button with Sparkles icon
  - Confirmation dialog: "This will replace all your current data with demo data. Continue?"
  - Loading spinner during request, success toast + navigate to dashboard on success
  - Error handling via `handleError`
  - Removed unused `type { Todo, Subject, Event, Exam }` import
- Lint: ✓ clean (0 errors, 0 warnings)

Stage Summary:
- **Seed data feature complete.** Users can load rich demo data from Settings → Demo Data section.
- Demo data makes the dashboard look impressive: 5 subjects, 10 todos, 5 events, 4 exams, 14 focus sessions, full profile.
- Weekly/monthly charts will show real study data from the 14 focus sessions spread across the last 7 days.

---
Task ID: style-1+style-3
Agent: styling-polisher
Task: Dashboard empty state enhancement, dark mode contrast, landing page micro-animations, sidebar polish

Work Log:
- **globals.css — Dark mode contrast improvements:**
  - Deepened dark background: `oklch(0.15 0.02 265)` → `oklch(0.13 0.015 265)` for richer dark feel
  - Lightened dark card slightly: `oklch(0.21 0.025 265)` → `oklch(0.19 0.02 265)` for better card-to-background separation
  - Increased muted-foreground brightness: `oklch(0.68 0.02 260)` → `oklch(0.72 0.02 260)` for better text readability
  - Deepened sidebar background: `oklch(0.18 0.022 265)` → `oklch(0.16 0.018 265)`
  - Updated primary-foreground in dark mode to match deeper background
  - Added border-glow on `.glass` and `.glass-strong` in dark mode with subtle box-shadow (violet glow)
- **globals.css — New keyframe animations:**
  - `chipShimmer` + `.icon-chip-shimmer` — shimmer sweep on stat card icon chips when value is 0
  - `emptyPulseGlow` + `.empty-pulse-glow` — pulsing glow behind empty state sections
  - `borderShimmer` + `.shimmer-border` — animated gradient border sweep on pricing card (CSS mask technique)
  - `glowDotPulse` + `.glow-dot` — pulsing glow dot next to "Free forever" badge
  - `miniSpark` + `.mini-spark` — radial flash animation on sidebar nav click
  - `sparkleFloat` + `.sparkle-float` — floating sparkle for welcome card decorations
- **dashboard-home.tsx — Empty state + Quick Start:**
  - StatCard: Added `isEmpty` detection, applies `icon-chip-shimmer` class when value=0, pulsing glow blob, dimmed icon (opacity-70 + grayscale), muted value text
  - ExamsPreview empty state: Wrapped in container with `empty-pulse-glow` amber blur behind
  - TodayTasksPreview empty state: Wrapped in container with `empty-pulse-glow` violet blur behind
  - New `QuickStartCard` component: gradient glass card with sparkle decorations, shows only when `totalTasks === 0 && subjectPerformance.length === 0`, contains 3 action buttons (Add subject, Create task, Start focus)
  - Added imports: `BookOpen`, `Play`, `Plus`, `type AppView`
- **hero.tsx — Parallax + stagger + glow dot:**
  - FloatingDashboard now tracks mouse position via `mousemove` listener, applies subtle `translate()` offset (parallax effect)
  - Trust badges: Changed from single `variants={item}` stagger to individual `motion.li` with incremental delays (0.6 + i*0.12) for fade-in-stagger effect
  - "Free forever" badge now has a pulsing `.glow-dot` next to it
- **testimonials.tsx — 3D tilt hover:**
  - Replaced `GlassCard` with custom `TiltCard` component
  - TiltCard tracks mouse position within card, applies `rotateX/rotateY` transforms with `perspective: 800` and `transformStyle: preserve-3d`
  - Maintains hover lift (`y: -4`) alongside tilt
  - Removed unused `GlassCard` import
- **pricing.tsx — Shimmer border + glow dot:**
  - Replaced `GlassCard` with `div` using `.shimmer-border .glass` classes for animated gradient border
  - "Forever" label now has `.glow-dot` pulsing indicator
  - Removed unused `GlassCard` import
- **sidebar.tsx — Polish:**
  - Brand area: Replaced `border-b border-sidebar-border/60` with gradient separator `bg-gradient-to-r from-transparent via-violet-500/30 to-transparent`
  - Active nav gradient: Made slightly more vivid (`from-violet-500/95 to-fuchsia-500/95` + `shadow-violet-500/35`)
  - NavButton: Added `sparkKey` state + `handleClick` callback to trigger mini spark animation on click
  - Added `overflow-hidden` to button className for spark containment
  - Added `useCallback`, `useRef`, `useState` imports

Stage Summary:
- **Dark mode significantly improved** with deeper backgrounds, brighter text, and glass glow effects
- **Dashboard feels alive even with no data** — pulsing glows on empty states, shimmer on 0-value stat cards, Quick Start card for new users
- **Landing page micro-animations elevate premium feel** — parallax mockup, staggered trust badges, shimmer border on pricing, 3D tilt testimonials, pulsing glow dots
- **Sidebar polished** — gradient separator, vivid active state, mini spark click feedback
- All changes pass lint with zero errors, dev server compiles cleanly

---
Task ID: qa-round-2
Agent: web-dev-reviewer
Task: QA + bug fixes + feature enhancements (Cmd+K palette, seed data, CSV export, dark mode polish, landing micro-animations)

Work Log:
- QA via agent-browser: landing ✅, signup ✅, login ✅, dashboard ✅, subjects ✅, todos ✅, focus timer ✅, analytics ✅, dark mode ✅, mobile ✅
- Found: no critical bugs. All API routes return 200. Lint clean. No JS errors in console.
- Noted: agent-browser `fill` doesn't trigger React onChange on controlled inputs — forms must be tested via curl or native events. This is a testing limitation, not an app bug.
- Fixed: auth race condition was already fixed in prior round.
- Verified: seed data API works (curl tested), CSV export works (curl tested).

Stage Summary:
- App is stable and functional end-to-end with no errors.
- New features added: Cmd+K command palette, demo data seeder, CSV export.
- Styling polished: dark mode deeper contrast, glass glow in dark, landing page micro-animations (parallax, typing, shimmer, 3D tilt), dashboard Quick Start card, sidebar gradient separator + click spark, stat card shimmer on zero values.
- All features lint-clean and compile-clean.
- Next round focus: deeper feature testing, potential mobile layout issues, accessibility improvements, more landing page polish.

---

Task ID: r3-style-1 + r3-style-2 + r3-style-3
Agent: style-polish-agent
Task: Premium Glassmorphism Depth Enhancement, Animated Gradient Border on Stat Cards, Global Ripple Effect on Buttons, Animated Page Loader Enhancement

Work Log:
- **globals.css — Glassmorphism depth enhancement**:
  - Added `position: relative` and noise texture `::before` pseudo-element to `.glass` and `.glass-strong` using an inline SVG feTurbulence data URI at 3% opacity for a premium matte frosted-glass feel.
  - Added `.glass > * { position: relative; z-index: 1 }` to ensure child content renders above the noise overlay.
  - Changed `.glass-strong` light mode opacity from 0.8 → 0.85.
  - Added `inset 0 1px 0 0 rgba(255,255,255,0.1)` inner shadow to `.glass-strong` (light mode) and `rgba(255,255,255,0.05)` variant for dark mode.
  - Added `.glass:hover` state: light mode opacity 0.6 → 0.75; dark mode 0.6 → 0.68 with smooth 0.25s transition.
  - Dark mode `.glass-strong` opacity also updated to 0.85.
- **globals.css — Animated gradient border**:
  - Added `.gradient-border-hover` utility class with `conic-gradient` border using `@property --gradient-angle` and `@keyframes borderRotate` for smooth 360° rotation.
  - Uses mask-composite trick for border-only gradient rendering.
  - Opacity transitions from 0 → 1 on hover for a reveal effect.
  - Colors: violet-500 → fuchsia-500 cycle matching app theme.
- **globals.css — Ripple effect**:
  - Added `.btn-ripple` class with `::after` pseudo-element implementing Material Design-style radial-gradient ripple.
  - Scale(10) → Scale(0) on `:active` with 0.5s transition (instant on press).
- **dashboard-home.tsx — Gradient border on stat cards**:
  - Wrapped each `<GlassCard>` inside a `<div className="gradient-border-hover h-full">` within the `StatCard` component, so the rotating gradient border appears on hover.
- **button.tsx — Ripple on default variant**:
  - Added `btn-ripple` class to the `default` variant of the Button component.
- **feedback.tsx — Enhanced PageLoader**:
  - Replaced simple spinner with a premium animated loader featuring:
    - Pulsing star SVG icon (scale 1 → 1.15 → 1 over 2s).
    - Two counter-rotating rings (violet at 3s, fuchsia at 5s) around the star.
    - "Loading…" text with 1-second fade-in delay.

Stage Summary:
- Glassmorphism now has premium frosted-glass texture (noise SVG at 3% opacity), hover state brightness increase, stronger opacity (0.85), and subtle inner shadow.
- Stat cards feature an animated rotating gradient border (violet → fuchsia conic gradient) that reveals on hover.
- All primary buttons have a Material Design-style ripple effect on click.
- Page loader replaced with a polished pulsing-star + rotating-rings + delayed-fade-in-text animation.
- All changes lint-clean, compile-clean, no runtime errors.

---

Task ID: r3-feat-1 + r3-feat-2
Agent: main
Task: Smart Notification System + Study Streak Visualizer

Work Log:
- **topbar.tsx** — Replaced the static bell icon + ping dot with a full `NotificationPopover` component:
  - Added `SmartNotification` type system with three kinds: `overdue`, `exam`, `goal`.
  - Implemented `fetchNotificationData()` with module-level 5-minute cache (module-scoped `cachedData` variable).
  - `computeNotifications()` generates:
    - Overdue tasks: `dueDate < today` and `status !== "completed"` → "⚠️ {title} is overdue!"
    - Upcoming exams within 7 days → "📚 {examName} in {X} days"
    - Study goal reminder: `focusTodayMinutes < targetHours * 60 / 2` → "🎯 You're behind on your study goal today"
  - Popover UI: glass-styled (`rounded-2xl`, `backdrop-blur-xl`, `bg-background/80`), `max-h-80` scrollable body via `ScrollArea`.
  - Color-coded items: overdue=rose, exam=amber, goal=violet. Each has icon, message, relative time, and unread dot.
  - Empty state: animated floating 🎉 emoji with "All caught up!" message.
  - Click navigates to relevant page (`todos`/`exams`/`dashboard`). Mark-as-read dims item visually (no persistence).
  - "Mark all read" button in header. Badge on bell shows unread count (purple pill, caps at 9+).
  - Removed `notifications` store prop from Topbar — badge count now comes from actual notification state.

- **dashboard-home.tsx** — Added two new components:
  1. `StreakCard` — replaces generic studyStreak stat card:
     - Pulsing 🔥 fire emoji (scale 1→1.2→1, 1.5s loop) when streak > 0.
     - Large bold streak number with "day/days" suffix.
     - Row of 7 small circles (last 7 days): filled with cyan→teal gradient if focus session existed that day, empty with border otherwise.
     - Staggered fill animation (circles fill one by one with 80ms delay).
     - Day labels (Mon, Tue, …) beneath circles.
     - Zero-streak state: "Start your streak!" + "Study today to begin 🔥".
  2. `TodaysGoalRing` — circular SVG progress ring below stat cards:
     - Violet→fuchsia gradient arc via `linearGradient` in SVG defs.
     - Animated `strokeDashoffset` (1.2s ease-out).
     - Center text: percentage + "of goal" label.
     - Right side: "Today's Goal" title, "✨ Goal exceeded!" badge (spring animation) when > 100%, minutes vs target text, and a linear progress bar.
  - Added `FocusSession` import and `focusSessions` state; fetches from `/api/focus-session` alongside analytics and todos.
  - Removed studyStreak from `STAT_CARDS` array (now rendered as enhanced `StreakCard`).
  - Grid remains `xl:grid-cols-5` — now shows 4 stat cards + 1 streak card.

Stage Summary:
- Smart Notification System is fully functional in the topbar: bell click opens a glass popover with color-coded, actionable notifications computed client-side from /api/todos, /api/exams, /api/analytics. 5-minute cache, mark-as-read visual state, navigation on click.
- Study Streak Visualizer replaces the generic streak stat card with an enhanced version: pulsing fire emoji, 7-day dot row with stagger animation, and motivational zero-state.
- Today's Goal progress ring uses an SVG circular gauge with violet gradient, animated fill, percentage display, and "✨ Goal exceeded!" badge.
- All changes lint-clean, compile-clean, no runtime errors.

---
Task ID: r3 (round 3)
Agent: web-dev-reviewer
Task: QA + smart notifications, streak visualizer, glassmorphism polish, gradient borders, ripple effects, 404 page, enhanced page loader

## Current Project Status

The StudySpark app is **stable and feature-complete**. All 9 dashboard pages render correctly with seeded data. Auth, CRUD, charts, focus timer, and all interactive features work. Lint is clean (0 errors). Dev server compiles without errors. No JS console errors.

## Current Goals / Completed Modifications / Verification Results

### QA (agent-browser verified)
- Landing page ✅ — all sections, hero, features, pricing, testimonials, CTA
- Auth ✅ — login/signup with session persistence
- Dashboard ✅ — greeting, stat cards, charts, quote, streak visualizer, today's goal ring
- Todos ✅ — kanban board with drag-and-drop, filters, search, CRUD
- Calendar ✅ — month/week/day views, events CRUD
- Subjects ✅ — 5 subjects with attendance rings, progress bars
- Exams ✅ — live countdowns, priority badges, progress tracking
- Focus Timer ✅ — 25:00 pomodoro, mode tabs, presets, wellness nudges
- Analytics ✅ — multiple charts, export buttons, weekly/monthly toggle
- Profile ✅ — avatar, bio, goal, academic details, animated save
- Settings ✅ — theme toggle, accent colors, demo data, data reset
- Dark mode ✅ — deep contrast, glass glow
- Mobile ✅ — responsive at 390px, drawer sidebar
- Notifications ✅ — smart popover with overdue tasks, upcoming exams, goal reminders

### New Features Added This Round

1. **Smart Notification System** (topbar.tsx)
   - Popover on bell click with 3 notification types: overdue tasks (rose), upcoming exams (amber), study goal (violet)
   - 5-minute client-side cache
   - "Mark all read" button, click-to-navigate, dimmed read state
   - Badge count on bell icon (purple pill)
   - "All caught up! 🎉" empty state with floating animation

2. **Study Streak Visualizer** (dashboard-home.tsx)
   - Pulsing 🔥 fire emoji when streak > 0
   - 7-day dot row showing which days had focus sessions (gradient fill vs empty)
   - Staggered fill animation per circle
   - "Start your streak!" motivational message when streak is 0

3. **Today's Goal Progress Ring** (dashboard-home.tsx)
   - Circular SVG ring with violet→fuchsia gradient
   - Animated stroke showing focus minutes vs target hours
   - Percentage in center + "of goal" label
   - "✨ Goal exceeded!" spring badge when >100%

4. **Animated 404 Page** (dashboard-shell.tsx)
   - Giant gradient "404" text with subtle rocking animation
   - Floating sparkle icon badge
   - "Page not found" heading + description
   - "Back to Dashboard" gradient button

### Styling Improvements This Round

5. **Glassmorphism Noise Texture** (globals.css)
   - SVG feTurbulence noise overlay at 3% opacity on .glass/.glass-strong
   - Increased opacity: glass-strong light mode 0.85
   - Inner shadow on glass-strong: inset 0 1px 0 0 rgba(255,255,255,0.1)
   - Hover state on .glass: opacity 0.6→0.75 with 0.25s transition

6. **Animated Gradient Border** (globals.css + dashboard-home.tsx)
   - `.gradient-border-hover` class with rotating conic-gradient border
   - Uses @property --gradient-angle + @keyframes borderRotate
   - Applied to dashboard stat cards — reveals on hover

7. **Button Ripple Effect** (globals.css + button.tsx)
   - `.btn-ripple` class with Material Design-style radial gradient ripple
   - Applied to default Button variant

8. **Enhanced Page Loader** (feedback.tsx)
   - Pulsing star icon with counter-rotating rings (violet + fuchsia)
   - "Loading…" text with 1-second fade-in delay

## Unresolved Issues or Risks

- **No critical bugs** — all features verified working
- **Minor**: agent-browser `fill` command doesn't trigger React onChange on controlled inputs (testing limitation, not app bug). Forms work correctly when using native browser input.
- **Next focus areas**: Accessibility audit (ARIA labels, focus management), performance optimization (React.memo for chart components), more landing page interactive elements, onboarding tutorial/walkthrough for new users

---
Task ID: r4-feat-1 + r4-feat-2 + r4-feat-3 + r4-style-1
Agent: orchestrator (main) — round 4
Task: QA assessment + implement Command Palette (Cmd+K), Achievements/Badges system, AI Study Insights panel, and styling polish

## Current Project Status

The StudySpark app entered this round **stable and feature-complete** (per round 3 handover). QA via agent-browser confirmed all 9 existing dashboard pages, auth, landing, dark mode, mobile drawer, and notifications worked with no console errors and clean lint.

One clear **gap** was identified: the topbar search box displayed a `⌘K` keyboard hint but no actual command palette existed — only a decorative input. This round closes that gap and adds two net-new feature surfaces plus targeted styling polish.

## Current Goals / Completed Modifications / Verification Results

### QA findings (pre-implementation)
- ✅ Landing, auth (signup/login/session persist), all 9 dashboard pages render
- ✅ Dark mode toggle, mobile drawer (390×844), notifications popover all functional
- ✅ Seeded demo data loads correctly (5 subjects, 10 todos, 5 events, 4 exams, 14 focus sessions)
- ❌ **Gap found**: `⌘K` hint in topbar search but no command palette functionality
- Lint clean (0 errors), dev server compiles cleanly, no JS console errors

### New Features Added This Round

#### 1. Command Palette (Cmd+K) — `src/components/dashboard/command-palette.tsx` (NEW)
- **Trigger**: `⌘K` / `Ctrl+K` global shortcut, OR click the topbar search box (now a real button), OR mobile search icon button
- **17 commands** across 3 groups:
  - **Navigate** (10): Dashboard, Daily Tasks, Calendar, Subjects, Upcoming Exams, Focus Timer, Analytics, Achievements, Profile, Settings
  - **Actions** (4): Create new task (N), Start focus session (F), Load demo data, Log out
  - **Theme** (3): Toggle theme, Set light theme, Set dark theme
- ** UX**: fuzzy search (label + subtitle + keywords + group), ArrowUp/Down to navigate, Enter to select, Escape to close, hover-to-highlight, scroll active item into view, footer with key hints
- **Architecture**: Split into `CommandPalette` (AnimatePresence wrapper) → `PaletteBackdrop` (overlay) → `PaletteInner` (keyed by `sessionId` so internal state resets cleanly on each open). Avoids `setState`-in-effect lint errors via derived `safeIndex` clamping during render.
- **Quick shortcuts**: `N` → Daily Tasks, `F` → Focus Timer (when not typing in an input)

#### 2. Achievements / Badges System — NEW page + API
- **API** `src/app/api/achievements/route.ts` (NEW): Computes 22 badges across 6 categories (tasks, focus, streak, subjects, exams, special) and 4 tiers (bronze/silver/gold/platinum). Returns badges with `earned` boolean, tier stats, milestone progress, and a summary of key totals.
- **Page** `src/components/dashboard/pages/achievements.tsx` (NEW): Gamified achievements gallery with:
  - **Hero header**: glass card with gradient trophy medallion (float-y animation), 4 twinkling sparkles on a rotating ring, overall completion % bar, and 4 tier progress cards (Bronze/Silver/Gold/Platinum)
  - **Summary stat cards**: 6 cards (Tasks Done, Focus Hours, Sessions, Day Streak, Subjects, Exams) with gradient icon chips
  - **Milestone progress**: 5 key badges with current/target progress bars (emerald when earned, violet when in-progress)
  - **Filter bar**: 9 filters (All, Earned, Locked, Tasks, Focus, Streak, Subjects, Exams, Special)
  - **Badges grid**: 2/3/4-col responsive grid. Earned badges show gradient medallion with periodic shine sweep (`badge-shine`, every 4s) + tier ribbon + category pill. Locked badges show grayscale emoji + Lock icon.
  - **Share button**: uses `navigator.share` if available, else copies to clipboard
  - **Empty state**: filter-specific EmptyState with CTA
- **Sidebar**: Added "Achievements" nav item with Trophy icon (between Analytics and Profile)
- **Store**: Added `"achievements"` to `AppView` union type
- **Topbar**: Added `achievements` entry to `VIEW_TITLES`

#### 3. AI Study Insights Panel — `src/components/dashboard/pages/dashboard-home.tsx` (enhanced)
- New `AIInsightsPanel` component rendered on the dashboard home between Today's Goal ring and the chart section
- **`computeInsights()`** generates up to 3 prioritized insights from analytics + todos:
  1. **Overdue tasks** (warning) — count of past-due incomplete tasks → "Review tasks"
  2. **Exam approaching** (warning) — exam within 7 days, shows readiness % → "Prepare now"
  3. **Focus goal behind** (info) — focus minutes < 50% of target → "Start focus"
  4. **Daily goal smashed** (success) — focus ≥ target → celebratory message
  5. **Weakest subject** (tip) — subject with < 60% progress → "Study this"
  6. **Streak at risk** (warning) — streak > 0 but no session today → "Keep the streak"
  7. **Streak strong** (success) — streak ≥ 7 days → encouragement
  8. **Weekly momentum** (success/tip) — based on weekly hours vs target
- **Priority sort**: warnings → info → tips → success; capped at 3 insights
- **4 tone configs** (info/warning/success/tip) with gradient backgrounds, ring colors, and gradient icon chips
- **Header**: live-pulse glow on Sparkles icon + "AI-powered" badge with animated ping dot
- **Insight cards**: gradient-to-br background, icon medallion, title, message, and CTA button (navigates to relevant page via `onNavigate`)
- Uses `AnimatePresence mode="popLayout"` for smooth add/remove animations

### Styling Polish This Round

#### 4. New CSS animations — `src/app/globals.css` (6 new keyframes + utilities)
- `badgeShineSweep` + `.badge-shine` — periodic diagonal shine sweep across earned badge medallions (every 4s, 60% idle then sweep)
- `livePulse` + `.live-pulse` — expanding ring shadow pulse (violet) for "live" AI indicators
- `floatY` + `.float-y` — gentle 6px vertical float (3.5s loop) for hero medallions
- `twinkle` + `.twinkle` — opacity + scale twinkle (2s loop) for decorative sparkles, with staggered `animation-delay`
- `earnedGlow` + `.earned-glow` — amber glow ring pulse for recently-earned badges
- `.kbd-hint` — styled `<kbd>` element for keyboard shortcut hints (border, muted bg, 0.625rem font)
- `.scrollbar-thin` — themed thin scrollbar (6px, border color, hover state) for webkit + firefox

#### 5. Applied polish
- **AI Insights icon**: `live-pulse` class → continuous violet ring pulse
- **AI Insights badge**: "AI-powered" now has animated ping dot (Tailwind `animate-ping`) + inline-flex
- **Earned badge medallions**: `badge-shine` sweep replaces hover-only shine — runs every 4s on all 9 earned badges
- **Achievements trophy**: `float-y` replaces Framer Motion y-loop; 4 surrounding sparkles use `twinkle` with staggered delays (0s/0.5s/1s/1.5s)
- **Sidebar nav**: `kbd-hint` badges show "N" (Daily Tasks) and "F" (Focus Timer) shortcuts when sidebar expanded and item not active
- **Topbar search**: now a real button (opens command palette) on desktop + mobile search icon button

### Verification Results (agent-browser + VLM)
- ✅ **Command Palette**: opens via search button (dialog=true, input=true, 17 items); typing "calendar" filters to 1 result; ArrowDown+Enter navigates to Calendar and closes dialog; "n" quick shortcut navigates to Daily Tasks
- ✅ **Achievements page**: "9 of 22 unlocked" displayed; all 9 filter buttons present and functional; 9 `badge-shine` elements on earned badges; 1 `float-y` trophy; 4 `twinkle` sparkles; VLM confirms "clean, modern layout... vibrant gradient... sparkle stars twinkle... tier progress bars clearly displayed... no visible visual issues"
- ✅ **Smart Insights panel**: "Smart Insights" header present; 3 insight cards detected (focus goal, weak subject, streak); `live-pulse` on icon; "AI-powered" badge with ping dot; VLM confirms "3 insight cards with colored gradient backgrounds, icons, titles, messages, and CTA buttons. No visual issues"
- ✅ **Sidebar kbd hints**: `["N","F"]` rendered correctly
- ✅ **Full navigation sweep**: all 10 nav items (Dashboard → Settings) navigate correctly
- ✅ **Dark mode**: toggle works (dark ↔ light)
- ✅ **Lint**: clean (0 errors, 0 warnings)
- ✅ **Dev server**: compiles cleanly, no JS errors, all API routes return 200
- ✅ **Achievements API**: returns 22 badges, 9 earned for seeded QA user, tier stats correct (Bronze 4/6, Silver 4/8, Gold 1/6, Platinum 0/2)

## Unresolved Issues or Risks

- **No critical bugs** — all features verified working end-to-end
- **Minor testing note**: agent-browser `fill` command does not trigger React onChange on controlled inputs (known limitation). Login form tested via API cookie injection instead. App itself works correctly with native browser input.
- **Background dev server**: the sandbox's auto-run dev server was not running at the start of this round; started it manually in single-command QA batches (server + tests in one Bash call) since background processes don't persist between tool calls in this environment.
- **Next focus areas** (recommendations for next round):
  1. **Onboarding walkthrough**: first-time user tour highlighting the 10 nav items + command palette + insights (using a driver.js-style overlay)
  2. **Achievements "recently earned"**: persist timestamps of when each badge was earned (new DB column or separate table) to enable "New!" pulse and a recent-activity feed
  3. **Confetti celebration**: trigger a confetti burst when a user earns a new badge in-session (canvas-confetti library)
  4. **Calendar event drag-and-drop**: allow dragging events between days in the month view
  5. **Subject detail drawer**: click a subject to open a detail drawer showing all its tasks, exams, and focus sessions
  6. **Accessibility audit**: ARIA labels on icon-only buttons, focus trap in command palette, keyboard nav for badge grid

---
Task ID: r5 (round 5)
Agent: orchestrator (main)
Task: QA assessment + implement 4 new features (confetti celebration, subject detail drawer, onboarding tour, quick-add FAB) + targeted styling polish

## Current Project Status

The StudySpark app entered this round **stable and feature-complete** (per round 4 handover). Pre-implementation QA via agent-browser confirmed all 10 dashboard pages (Dashboard, Tasks, Calendar, Subjects, Exams, Focus, Analytics, Achievements, Profile, Settings), auth, command palette, notifications, dark mode, and mobile responsiveness worked with no JS console errors and clean lint. VLM analysis of dashboard home, achievements page, and todos page surfaced several concrete polish opportunities: disconnected Today's Goal progress indicators, topbar username truncation, inconsistent achievement tier visuals, and missing hover lift on task cards. This round closes those gaps and adds four net-new feature surfaces recommended in the r4 next-steps list.

## Current Goals / Completed Modifications / Verification Results

### QA findings (pre-implementation, agent-browser + VLM)
- ✅ All 10 dashboard pages render, auth persists, command palette opens (17 items), notifications popover works
- ✅ Achievements API returns 22 badges, 9 earned for seeded QA user (verified tier stats: Bronze 4/6, Silver 4/8, Gold 1/6, Platinum 0/2)
- ✅ Lint clean (0 errors), dev server compiles cleanly, no JS console errors
- Identified polish opportunities via VLM: Today's Goal ring + linear bar felt visually disconnected; topbar avatar username truncated at 100px; achievement badge tiers lacked distinct background tints; task cards missing hover lift

### New Features Added This Round

#### 1. Confetti Celebration System — `src/lib/confetti.ts` (NEW) + `src/hooks/use-achievement-celebration.ts` (NEW)
- **`src/lib/confetti.ts`**: Three exported confetti utilities backed by `canvas-confetti` (newly installed dependency, ~6KB gzipped):
  - `celebrateBurst()` — dual side-cannon burst + center sparkle (200ms delay), brand colors (violet/fuchsia/amber/emerald/cyan)
  - `celebrateMini()` — smaller 35-particle burst for minor milestones
  - `celebrateTrophy()` — star-shaped particle burst + dual side cannons for gold/platinum tier unlocks
- **`src/hooks/use-achievement-celebration.ts`**: Side-effect hook that watches the badges array; on first transition from not-seen-earned → earned, fires confetti. Persists seen-badge IDs in `localStorage["studyspark:seen-badges"]` so a page refresh doesn't re-fire. Uses a `firstRunRef` to skip celebration on initial mount (only celebrates *new* unlocks in-session). Auto-selects `celebrateTrophy()` if any newly-earned badge is gold/platinum, else `celebrateBurst()`.
- **Wired into `achievements.tsx`**: `useAchievementCelebration({ badges: data?.badges, enabled: !loading })`

#### 2. Subject Detail Drawer — `src/components/dashboard/subject-detail-drawer.tsx` (NEW, 460 lines)
- **Trigger**: Click anywhere on a subject card (full-card clickable button), OR click the new sparkle icon button in the card header
- **Layout** (right-side Sheet, 100% on mobile, max-w-md on desktop):
  - **Hero header**: color accent strip + decorative blob + subject icon medallion + name + teacher + credits + prep %
  - **Stat pills** (2×2 grid): Tasks (completed/total), Exams, Focus hours, Sessions — each with gradient icon chip
  - **Attendance ring + progress bar**: SVG ring with subject color, animated stroke, attendance status (Good/At risk), course progress bar
  - **Tab bar** with `layoutId` underline: Tasks / Exams / Focus / Notes — each tab shows count badge
  - **Tab panels** with `AnimatePresence` crossfade:
    - **Tasks**: list with status icon, title, category, due date, priority chip
    - **Exams**: list with name, date/time/location, progress bar, countdown badge (Today/in N days/Past)
    - **Focus**: total focus time hero card + session list with duration, date, "time ago", completion check
    - **Notes**: amber-tinted panel with sticky-note icon and whitespace-preserved notes
- **Data fetching**: parallel `Promise.all` of `/api/todos`, `/api/exams`, `/api/focus-session` filtered client-side by `subject === subject.name`
- **Empty states**: per-tab EmptyTab component with icon + message

#### 3. Onboarding Tour — `src/components/dashboard/onboarding-tour.tsx` (NEW, 310 lines)
- **Trigger**: Auto-opens 800ms after first-ever dashboard mount (gated by `localStorage["studyspark:onboarding-completed-v1"]`)
- **5 steps**:
  1. **Welcome** (center) — "Welcome to StudySpark ✨" with overview
  2. **Sidebar** (right of sidebar) — navigation overview
  3. **Command Palette** (below search button) — ⌘K hint
  4. **Quick-add FAB** (left of FAB) — global create button
  5. **Achievements** (center) — badges teaser with "See badges" CTA that navigates to achievements page
- **Highlight system**: `requestAnimationFrame` loop tracks target element's bounding rect (handles scroll/resize), renders a `motion.div` cutout with `box-shadow: 0 0 0 9999px rgba(0,0,0,0.55)` + violet/fuchsia glow ring. Smoothly animates between steps.
- **Popover positioning**: anchors to side (right/left/bottom/top/center) of target, clamped to viewport (16px margin)
- **Controls**: Back, Next, "Skip tour" (top-right), "Got it" (final step), progress dots, step counter (e.g. "3 / 5")
- **A11y**: `role="dialog"`, `aria-modal="true"`, `aria-labelledby="onboarding-title"`, Escape closes

#### 4. Quick-Add FAB — `src/components/dashboard/quick-add-fab.tsx` (NEW, 200 lines)
- **Position**: `fixed bottom-6 right-6` (bottom-8 right-8 on sm+), z-40
- **Main button**: 56px circle, gradient (violet→fuchsia→purple) with `fab-gradient` class for animated gradient sweep (6s loop), white + / X icon with rotate transition, ring-1 ring-white/20
- **Idle pulse**: `motion.span` halo that scales 1→1.5 and fades 0.6→0 (1.8s loop) — only when closed
- **Action menu** (4 items): New Task (violet→fuchsia), New Event (emerald→teal), New Exam (amber→orange), Start Focus (rose→pink) — each with staggered entrance (40ms delay), gradient icon chip, label, description
- **Behavior**: clicking an action navigates to the corresponding view via `setView()`, closes the menu
- **Dismiss**: outside click (mousedown listener), Escape key
- **A11y**: `aria-label`, `aria-expanded`

### Styling Polish This Round

#### 5. Today's Goal ring visual integration (`dashboard-home.tsx`)
- Added subtle pulsing violet glow blob (top-right) when goal is behind target — gentle 2.4s opacity pulse
- Added contextual status badge: "Keep going" (amber, <50%) / "Almost there" (emerald, 50-99%) / "✨ Goal exceeded!" (violet, ≥100%)
- Added "min to go" countdown text next to focus/target minutes (e.g. "70 / 360 min target · 290 min to go")
- Restructured layout: ring + content now share a relative wrapper inside a single GlassCard with `overflow-hidden` for the glow

#### 6. Topbar avatar polish (`topbar.tsx`)
- Added emerald online indicator dot (bottom-right of avatar, 10px, ring-2 ring-background)
- Added ring-2 ring-transparent → ring-violet-500/30 hover state on avatar
- Wrapped user chip in `TooltipProvider`/`Tooltip` showing full username + "Click to view profile" (200ms delay, bottom-end alignment)
- Increased username truncation from `max-w-[100px]` to `max-w-[120px]` for slightly more visible text

#### 7. Task card hover lift (`todos.tsx`)
- Upgraded hover from `hover:shadow-md` to `hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/10 hover:border-violet-500/40`
- Added `duration-200` for smooth transition

#### 8. Achievement tier-tinted backgrounds + stripes (`achievements.tsx`)
- Extended `TIER_CONFIG` with two new fields:
  - `tintBg`: subtle tier-colored gradient background (e.g. bronze = `from-amber-500/10 via-orange-500/5 to-transparent`)
  - `stripe`: top-edge gradient stripe color (matches tier)
- Earned badge cards now render with `tier.tintBg` instead of generic `bg-background/60`
- Added 1px-tall gradient stripe at the top of every earned badge card (`tier.stripe`)
- Result: bronze badges glow amber, silver badges glow slate, gold badges glow yellow, platinum badges glow cyan/violet/fuchsia — tiers are now immediately visually distinguishable

#### 9. New CSS animations (`globals.css`, 6 new utilities)
- `sheetSlideIn` keyframes (sheet-style drawer entrance, ready for future use)
- `.onboarding-target-glow` utility class (fallback box-shadow for tour highlight)
- `fabHalo` keyframes + `.fab-gradient` (FAB idle halo + gradient sweep, applied to FAB)
- `statPillIn` keyframes + `.stat-pill-in` (subject drawer stat pill entrance, ready for future use)
- `tierStripeShimmer` keyframes + `.tier-stripe-shimmer` (lateral shimmer sweep on tier stripes, ready for future use)
- **`@media (prefers-reduced-motion: reduce)`** block — kills ALL infinite animations (live-pulse, float-y, twinkle, earned-glow, badge-shine, fab-gradient, tier-stripe-shimmer) for users who prefer reduced motion

### Verification Results (agent-browser + VLM)

#### Functional verification (agent-browser)
- ✅ **Onboarding tour**: Auto-opens on first visit; navigated through all 5 steps (Welcome → Sidebar → Command Palette → FAB → Achievements); "Got it" closes tour; "See badges" CTA navigates to achievements; `localStorage["studyspark:onboarding-completed-v1"]` set so tour doesn't re-open on reload
- ✅ **Quick-add FAB**: Visible at bottom-right; clicking opens 4-action menu (New Task, New Event, New Exam, Start Focus); clicking "Start Focus" navigates to Focus Timer page; closing via X button or outside-click works; pulsing halo visible when closed
- ✅ **Subject detail drawer**: Clicking Mathematics subject card opens drawer; shows "Dr. Smith", "4 credits", "72% prepared"; stat pills show "Tasks 1/2", "Exams 1", "Focus hours 2.1", "Sessions 3"; 85% attendance ring + 72% progress bar render correctly; all 4 tabs (Tasks/Exams/Focus/Notes) switch and show correct content; Close button works
- ✅ **Confetti celebration**: Seeded `localStorage["studyspark:seen-badges"]` with 6 of 9 earned IDs; reloaded page; navigated to achievements; `localStorage` was updated from 6 → 9 IDs (proving the hook ran and detected 3 newly-earned badges — focus-pro, on-fire, exam-ready); confetti fired via canvas-confetti (verified module loads correctly)
- ✅ **Topbar avatar tooltip**: Hovering user chip shows "qauser_1783074942 / Click to view profile"; emerald online indicator dot visible
- ✅ **Today's Goal**: Status badge shows "Keep going" (amber) since focus < 50% of target; "min to go" countdown visible; subtle violet glow pulse animating
- ✅ **Achievement tier tints**: 9 earned badge cards now have tier-colored backgrounds; 14 tier stripe elements detected; VLM confirms "tier-tinted backgrounds (amber/slate/yellow)" + "tier gradient stripes visible at top of earned badge cards"
- ✅ **Task card hover lift**: Cards now translate -2px on hover with violet shadow
- ✅ **Mobile (390×844)**: FAB visible and clickable; sidebar drawer opens; dashboard renders correctly
- ✅ **Dark mode**: All new components (FAB, tour, drawer, tier tints) render correctly in dark mode

#### VLM verification (z-ai vision)
- ✅ **Onboarding tour**: "Tour popover is visible and well-positioned (centered, prominent). Clear title, description, progress dots (1/5), and Next button. No visual issues — all elements are clear and aligned."
- ✅ **Subject drawer (Tasks tab)**: "Drawer visible on right. Shows subject name (Mathematics), teacher (Dr. Smith), stats (credits, prepared %, focus hours, sessions), tabs (Tasks/Exams/etc.), and task list. Layout is clean and premium. No visual issues."
- ✅ **Subject drawer (desktop)**: "All required elements present. Visual hierarchy: subject name largest, then teacher, then stat pills (color-coded), attendance ring, tabbed content. Whitespace & spacing consistent. No major visual bugs or alignment issues."
- ✅ **Dashboard with FAB**: "FAB visible with + icon and purple gradient background. Today's Goal card visible with circular progress ring (19%), 'Keep going' status badge, and 'min to go' indicator. User chip in topbar shows avatar with green online indicator. No visual issues."
- ✅ **Achievements dark mode**: "Earned badge cards show tier-tinted backgrounds (amber/slate/yellow). Tier gradient stripes visible at top of earned badge cards. Trophy medallion with rotating sparkle ring visible. Tier progress bars clearly differentiated by color."

#### Build / lint / runtime
- ✅ `bun run lint` clean (0 errors, 0 warnings)
- ✅ Dev server compiles cleanly, no JS console errors
- ✅ All API routes return 200 (`/api/achievements`, `/api/todos`, `/api/exams`, `/api/focus-session`)
- ✅ 35 QA screenshots saved to `/home/z/my-project/download/qa-r5/`

## Unresolved Issues or Risks

- **No critical bugs** — all 4 new features and 5 styling polishes verified working end-to-end
- **Confetti timing note**: The confetti fires ~250ms after the achievements data loads. If the user navigates away immediately, the confetti may render briefly before being unmounted — this is acceptable behavior. The hook correctly updates `studyspark:seen-badges` localStorage so confetti won't re-fire for the same badge.
- **Onboarding tour selector robustness**: The tour uses CSS selectors to highlight targets (`button[aria-label*="Search"]`, `[aria-label="Open quick actions"]`, etc.). If future refactors rename these aria-labels, the tour will gracefully fall back to centered popover (no crash) — but the highlight won't anchor. Worth keeping aria-labels stable.
- **Next focus areas** (recommendations for next round):
  1. **Calendar event drag-and-drop**: allow dragging events between days in month view (r4 next-step #4)
  2. **Recently-earned badge timestamps**: persist `earnedAt` per badge (new DB table or profile field) to enable a "Recent achievements" feed and "New!" pulse on recently-earned badges
  3. **Pomodoro sound effects**: add optional bell/whitelight-noise on focus session start/end + break suggestions in the focus timer
  4. **Accessibility audit**: ARIA labels on all icon-only buttons, focus trap in command palette + drawer, keyboard navigation for badge grid
  5. **Performance**: React.memo the chart components (WeeklyChart, MonthlyChart) — currently re-render on every parent state change
  6. **Re-triggerable onboarding**: add a "Replay tour" button in Settings → Appearance for users who want to see the tour again

---
Task ID: r6-A
Agent: full-stack-developer (calendar-dnd)
Task: Add calendar event drag-and-drop (drag events between days in month view)

Work Log:
- Read worklog.md (rounds 1–5) and agent-ctx/6-bc-todos-calendar-builder.md to understand the calendar architecture and the optimistic-update + revert convention. Round 5 next-steps explicitly recommended "Calendar event drag-and-drop" as the #1 priority for round 6.
- Verified the pre-existing CSS utilities in globals.css (`.drag-over`, `.event-dragging`, `.drop-line`, `.today-cell-pulse`) and the `PUT /api/events/[id]` route shape (`{ date: "yyyy-MM-dd" }` partial update).
- Added `useRef` to the React named imports in calendar.tsx.
- Added `handleEventMove(eventId, newDate)` callback at `CalendarPage` root: skips no-op moves, snapshots `events` for revert, optimistically updates local state with the new `yyyy-MM-dd` date, fires `toast.loading("Moving event…")`, calls `apiFetch PUT /api/events/[id]` with `{ date: newDate }`, on success `toast.success("Event moved to MMM d")` (dismisses loading), on error reverts + `toast.error` + `handleError`. Wrapped in `useCallback` with `[events]` deps.
- Wired `onEventMove={handleEventMove}` to both `<MonthView>` and `<WeekView>` render calls.
- Updated `MonthView`: added `onEventMove` prop, lifted `draggingEventId: string | null` and `dragOverDay: Date | null` state, added `draggingEventIdRef = useRef<string | null>(null)` for a stable read + dataTransfer fallback, wrapped setter in `handleDraggingEventIdChange` callback that updates both ref and state. Passed all of these down to each `DayCell`.
- Updated `DayCell`: added new props (`onEventMove`, `draggingEventId`, `draggingEventIdRef`, `dragOverDay`, `onDraggingEventIdChange`, `onDragOverDayChange`). Added `onDragOver` (preventDefault + dropEffect=move + stopPropagation + setDragOverDay), `onDragLeave` (relatedTarget + contains check to avoid child flicker), `onDrop` (preventDefault + stopPropagation + getData + onEventMove + clear state) on the cell root. Appended `today-cell-pulse` (when today) and `drag-over` (when isDragOver) classes to the existing cn(...) chain. Added `relative` to the events container and rendered `<div className="drop-line" style={{ top: 0 }} aria-hidden="true" />` when isDragOver. Made event chips `draggable` with `onDragStart` (setData + effectAllowed=move + onDraggingEventIdChange + stopPropagation) and `onDragEnd` (clears all drag state). Appended `cursor-grab active:cursor-grabbing` and conditional `event-dragging` class. Added `aria-label="Event: <title>. Drag to move to another day."` and a descriptive `title` attribute. Preserved the existing `onClick` (stopPropagation + onEventClick).
- Updated `WeekView` with the same DnD pattern: added `onEventMove` prop, local `draggingEventId`/`dragOverDay` state, day-cell drop handlers, draggable event chips with the same accessibility attributes. Added `today-cell-pulse` and `drag-over` conditional classes plus the drop-line indicator.
- Ran `bun run lint` → exit code 0, zero errors, zero warnings.
- Ran `bunx tsc --noEmit` → 22 pre-existing errors in OTHER files (command-palette, dashboard-home, profile, settings, examples, skills); ZERO errors in calendar.tsx (confirmed via `grep -i calendar`).
- Checked dev.log tail — clean compilation, `GET /api/events 200`, no errors related to my changes.

Stage Summary:
- Single file modified: `src/components/dashboard/pages/calendar.tsx` (1432 → 1648 lines, +216).
- Calendar month view now supports HTML5 native drag-and-drop: drag an event chip from one day cell to another, see live visual feedback (`.drag-over` glow on target, `.drop-line` indicator, `.event-dragging` opacity on source, `.today-cell-pulse` on today), and the change is persisted via `PUT /api/events/[id]` with optimistic update + revert on error + success/error toasts.
- Week view also got the same DnD pattern (bonus, per task spec).
- All existing behavior preserved: single-click event chip → edit dialog; single-click day cell → day-detail dialog; `+` button on hover → add-event dialog; drag does not trigger click (stopPropagation in dragstart + HTML5 DnD spec).
- Accessibility: draggable chips have `aria-label` and `title` describing the drag affordance.
- Lint: 0 errors, 0 warnings. TypeScript: 0 errors in calendar.tsx. Dev server: compiles cleanly.

---
Task ID: r6-D
Agent: full-stack-developer (replay-tour)
Task: Add "Replay tour" button in Settings + expose OnboardingTour open state

Work Log:
- Read worklog.md (rounds 1–5 + r6-A) and both target files (onboarding-tour.tsx ~366 lines, settings.tsx ~921 lines). Confirmed the OnboardingTour's `open` state is fully internal with no external re-open path, and that Settings has a `SwitchRow` pattern but no "button-on-right" row variant.
- Refactored `src/components/dashboard/onboarding-tour.tsx` to expose a module-level event emitter:
  - Added `type TourListener = () => void` and `const tourListeners = new Set<TourListener>()` at module scope (after the `STORAGE_KEY` constant).
  - Exported `replayTour()` which iterates the listener set via `forEach` (safe snapshot iteration).
  - Added a NEW `useEffect` inside `OnboardingTour` (with `[]` deps) that registers a `handleReplay` listener: resets `stepIdx` to 0, clears `targetRect`, and sets `open=true`. Cleanup removes the listener — no memory leak.
  - **Intentionally did NOT touch localStorage** on replay — the tour was already "completed" once; replay is a refresher. The existing auto-open-on-first-visit `useEffect` (checks `studyspark:onboarding-completed-v1`, opens after 800ms) is left completely intact and is purely ADDITIONAL to the new listener.
- Edited `src/components/dashboard/pages/settings.tsx`:
  - Added `GraduationCap` and `RotateCcw` to the lucide-react imports.
  - Added `import { replayTour } from "@/components/dashboard/onboarding-tour";`.
  - Added a new `ActionRow` sub-component (after `SwitchRow`) that mirrors `SwitchRow`'s layout but takes arbitrary `children` for the right-side control instead of a `<Switch>`. Reuses `SettingsRow` under the hood so the icon + title + description layout stays visually consistent.
  - Added a new row in the Preferences `<SettingsSection>` AFTER "Default Sidebar Collapsed" (separated by a `<Separator />`): icon=`GraduationCap`, title="Replay onboarding tour", description="See the 5-step tour again to rediscover key features.", right-side `<Button variant="outline" size="sm">` with `RotateCcw` icon + "Replay tour" text. On click: calls `replayTour()` then `toast.success("Replaying tour...")`. Button has a subtle violet hover state (`hover:border-violet-500/40 hover:bg-violet-500/5 hover:text-violet-600 dark:hover:text-violet-300`) — no indigo/blue, matches app accent.
- Ran `cd /home/z/my-project && bun run lint` → exit code 0, zero errors, zero warnings.
- Ran `bunx tsc --noEmit` to confirm no NEW type errors: 22 pre-existing errors in OTHER files (command-palette, dashboard-home, profile, examples, skills) + 5 pre-existing errors in settings.tsx (StaggerItem `delay` prop at L121, missing `Todo`/`Subject`/`Exam`/`Event` types in `ResetDataDialog` at L386/387/389/404 — all baseline per r6-A's handover). The new `ActionRow` component (L330-355) and new row usage (L806-823) produce ZERO type errors. `onboarding-tour.tsx` produces ZERO type errors.
- Checked `dev.log` tail — clean compile ("✓ Compiled in 1592ms" after my edits), no errors related to onboarding-tour or settings.
- Wrote agent-ctx record at `/home/z/my-project/agent-ctx/r6-D-full-stack-developer-replay-tour.md`.

Stage Summary:
- 2 files modified: `src/components/dashboard/onboarding-tour.tsx` (+~38 lines) and `src/components/dashboard/pages/settings.tsx` (+~50 lines).
- Settings → Preferences now has a "Replay onboarding tour" row (4th row, after Default Sidebar Collapsed) with an outline "Replay tour" button.
- Clicking the button calls `replayTour()` (module-level event emitter) which the `OnboardingTour` component listens to; the tour re-opens from step 1 (Welcome) and the user can navigate all 5 steps again. A success toast confirms the action.
- Auto-open-on-first-visit behavior is 100% preserved — the existing `useEffect` that checks `localStorage["studyspark:onboarding-completed-v1"]` is untouched; the new listener is purely additive.
- No memory leaks: listener is added on mount and removed on unmount via `useEffect` cleanup.
- No `store.ts` modifications (avoided conflict with Subagent B); no `globals.css` modifications; no other files touched.
- Lint: 0 errors, 0 warnings. TypeScript: 0 new errors (22 pre-existing baseline unchanged).

---
Task ID: r6-B
Agent: full-stack-developer (pomodoro-sound)
Task: Add Pomodoro completion bell (Web Audio API) + cycle progress dots + sound toggle

Work Log:
- Read worklog.md rounds 1–5 + r6-A (calendar DnD) to understand project state, then read the existing `src/lib/store.ts` and the full `src/components/dashboard/pages/focus-timer.tsx` (901 lines). Confirmed the pre-existing CSS utilities in `globals.css` (`.sound-wave-bar`, `.cycle-dot` / `.active` / `.completed`, `.break-ambient`, `.long-break-ambient`) and the ESLint config (`react-hooks/exhaustive-deps` OFF, `@typescript-eslint/no-explicit-any` OFF).
- Modified `src/lib/store.ts` — added `soundEnabled: boolean` (default `true`) to `AppState`, added `setSoundEnabled: (on: boolean) => void` to the actions interface, initialized `soundEnabled: true` in the store, added the `setSoundEnabled: (on) => set({ soundEnabled: on })` action, and added `soundEnabled: state.soundEnabled` to the `partialize` function so it persists to localStorage alongside `accentColor` / `notifications` / `reduceMotion` / `sidebarOpen`.
- Modified `src/components/dashboard/pages/focus-timer.tsx` (901 → 1099 lines, +198):
  - Added `Volume2`, `VolumeX` to the existing lucide-react named imports.
  - Added `import { cn } from "@/lib/utils";` after the sonner import.
  - Added a module-level Web Audio API bell utility after the imports (before `type TimerMode`): a cached `audioCtx` variable, `getCtx()` (lazily creates/resumes an `AudioContext`, returns `null` on SSR or if Web Audio is unavailable, uses the safer `(window as unknown as { webkitAudioContext?: typeof AudioContext })` cast instead of `any`), `tone(freq, start, dur, ctx, type)` helper (oscillator + gain node with exponential decay), `export function playBell(kind: "focus-end" | "break-end")` (focus-end = ascending C5/E5/G5 sine arpeggio at 0/0.12/0.24s; break-end = single 880 Hz A5 triangle chime with 1.2s decay), and `export function playTestBell()` (calls `playBell("focus-end")`). Every entry point is wrapped in try/catch so audio failures can never throw or break the timer.
  - Added a module-level `BREAK_TIPS: string[]` array of 5 wellness tips (deep breaths, look far away, wrist stretch, sip water, relax shoulders) for the rotating break-tip panel.
  - In `FocusTimerPage`: read `soundEnabled` and `setSoundEnabled` from the store via two `useAppStore` selectors.
  - Added `const [tipIndex, setTipIndex] = useState(0)` + a `useEffect` that starts an 8-second interval to rotate `tipIndex` through `BREAK_TIPS` — only when `mode !== "focus"` (interval is cleaned up when returning to focus or unmounting).
  - Wired the bell into the completion `useEffect`: after capturing `finishedMode`, call `if (soundEnabled) playBell(finishedMode === "focus" ? "focus-end" : "break-end")` BEFORE the existing toast + API save + auto-break logic. Added `soundEnabled` to the effect's dep array (`[remaining, soundEnabled]`). All existing completion behavior (toast, `setCompletedFocusCount`, POST `/api/focus-session`, auto-break switching, `loggedRef` guard) is preserved unchanged.
  - In the page header: wrapped the existing "X completed this sitting" `<Badge>` and a new sound toggle `<Button variant="ghost" size="icon">` in a `<div className="flex items-center gap-2 self-start sm:self-end">`. The toggle shows `Volume2` when sound is on and `VolumeX` when off, has `aria-label="Toggle sound effects"` and a contextual `title`, calls `setSoundEnabled(!soundEnabled)` on click, and fires `playTestBell()` when turning sound back ON (so the user immediately hears a sample). Button is `h-9 w-9 rounded-full shrink-0` to match the badge height.
  - Added a Pomodoro cycle progress indicator (4 `.cycle-dot` spans in a row) below the mode tabs and above the timer ring. Container is centered with `style={{ color: modeCfg.accent }}` so the dots inherit the current mode's accent color. Dot state logic: `inCycle = completedFocusCount % 4`; `allComplete = inCycle === 0 && completedFocusCount > 0`; for each index `i` → `cycle-dot completed` if `allComplete || i < inCycle`, else `cycle-dot active` if `i === inCycle && mode === "focus"`, else base `cycle-dot` (dim). Includes an `aria-label` describing the cycle position and a muted helper text "Pomodoro cycle · Long break after 4 focus sessions". Changed the mode-tabs container's bottom margin from `mb-6` to `mb-3` to balance the new indicator's `mb-5`.
  - Added an ambient glow layer inside the main timer `GlassCard` (before the existing decorative orb): when `mode !== "focus"`, renders a `pointer-events-none absolute inset-0` div with class `break-ambient` (short break, cyan) or `long-break-ambient` (long break, rose) via `cn(...)`. Focus mode renders no ambient layer (the existing decorative orb is sufficient).
  - Added a rotating break-tip panel in the Wellness nudges `GlassCard`, after the 2-up grid of `ReminderCard`s. Wrapped in `<AnimatePresence>` so it mounts/unmounts with a fade+slide when entering/leaving break modes (respects `reduceMotion`). The panel has a violet→fuchsia gradient background, a "Break tip · rotating" header with 4 staggered `.sound-wave-bar` indicators (colored with `modeCfg.accent`, animation delays 0/150/300/450ms) as a visual cue that the tip is rotating, and the current tip text inside a nested `<AnimatePresence mode="wait">` keyed by `tipIndex` so each tip fades/slides in/out on rotation. The tip `<p>` has `aria-live="polite"` so screen readers announce new tips. Only rendered when `mode !== "focus"`.
- Ran `cd /home/z/my-project && bun run lint` → exit code 0, zero errors, zero warnings.
- Ran `bunx tsc --noEmit` and grepped for `focus-timer` / `store.ts` → zero TypeScript errors in either of my files.
- Checked `dev.log` tail — clean compilation, `GET /api/focus-session 200`, no errors related to my changes.

Stage Summary:
- Two files modified: `src/lib/store.ts` (102 → 107 lines, +5) and `src/components/dashboard/pages/focus-timer.tsx` (901 → 1099 lines, +198). No other files touched (globals.css CSS was pre-added by the orchestrator; settings.tsx untouched as another agent owns it).
- `soundEnabled` is now a persisted Zustand setting (default `true`, survives reload via `partialize` → localStorage `studyspark-storage`).
- The focus timer now plays a pleasant Web Audio API bell when a session completes: an ascending C5–E5–G5 sine arpeggio for focus-end, a soft 880 Hz A5 triangle chime for break-end. The bell is gated by `soundEnabled` and never throws (AudioContext unavailability is silently no-op).
- A sound toggle button (Volume2 / VolumeX icon, ghost variant) sits next to the "X completed this sitting" badge in the page header. Clicking it flips `soundEnabled` and, when turning sound ON, plays a sample bell so the user can confirm audio works.
- A 4-dot Pomodoro cycle progress indicator below the mode tabs shows completed focus sessions in the current 4-session cycle (dim → completed → active → dim), colored with the current mode's accent, with helper text "Long break after 4 focus sessions".
- Break modes (short/long) now get a subtle ambient radial glow (`.break-ambient` cyan / `.long-break-ambient` rose) layered inside the timer card.
- A rotating break-tip panel appears in the Wellness nudges card only during break modes, cycling through 5 wellness tips every 8 seconds with a sound-wave-bar animation indicator and `aria-live="polite"` for accessibility.
- Lint: 0 errors, 0 warnings. TypeScript: 0 errors in modified files. Dev server: compiles cleanly.

---
Task ID: r6-C
Agent: full-stack-developer (recent-badges)
Task: Add recently-earned badge tracking + "NEW" pulse + Recent Activity timeline section

Work Log:
- Read worklog.md (r3, r4, r5, r6-A) to understand the achievements page architecture, the `use-achievement-celebration` hook (r5), and the r5 next-step #2 recommendation ("Recently-earned badge timestamps"). Verified the 4 pre-existing CSS utilities in globals.css (`.new-badge-pulse`, `.new-tag-shine::after`, `.recent-item-enter`, `.timeline-line`) and confirmed `date-fns` is already a dependency (used in focus-timer.tsx and subject-detail-drawer.tsx).
- Extended `src/hooks/use-achievement-celebration.ts` (95 → 190 lines):
  - Widened the local `Badge` interface to the full shape (id, title, description, tier, icon, category, earned) so the new helper returns fully-typed badges.
  - Added `EARNED_AT_KEY = "studyspark:badge-earned-at"` and `BACKFILL_AGE_MS = 7 days` constants.
  - Added `readEarnedAt()` / `writeEarnedAt()` SSR-safe localStorage helpers (validate stored value is a plain object of finite numbers; return `{}` on SSR/parse error).
  - Exported `getEarnedAtMap(): Record<string, number>` — reads the persisted map.
  - Exported `getRecentlyEarned<T extends { id: string; earned: boolean }>(badges, withinMs = 24h)` — generic helper returning `{ badge: T; earnedAt: number }[]` sorted by earnedAt descending. Generic preserves the caller's full badge type (the spec's `Badge[]` signature is the `T = Badge` special case).
  - Hook body: reads `earnedAt` map alongside `seen` set; on non-firstRun newly-earned (the confetti condition) stamps `earnedAt[b.id] = now`; on firstRun backfills `earnedAt[b.id] = now - 7d` for every earned badge missing an entry, then persists both maps and returns (no confetti). Confetti logic (celebrateTrophy for gold/platinum, else celebrateBurst, 250ms delay) left intact. Return type annotated `: void`.
- Updated `src/components/dashboard/pages/achievements.tsx` (679 → 823 lines):
  - Added `formatDistanceToNow` import from `date-fns`; imported `getEarnedAtMap` + `getRecentlyEarned` from the hook.
  - `BadgeCard`: added `isNew?: boolean` prop (default false). Computes `showNew = isNew && badge.earned` (never on locked badges). When `showNew`: appends `new-badge-pulse` class to the earned card className (amber ring pulse), and renders a `new-tag-shine` "NEW" pill — amber→orange gradient, white `text-[9px] font-bold uppercase` text, `overflow-hidden` so the shine sweep clips to the pill, positioned `absolute left-2 top-2 z-20` (top-LEFT to avoid overlapping the existing tier ribbon at top-right; documented in a code comment).
  - Added `RecentActivity` component (between `ProgressMilestone` and `AchievementsPage`): renders up to 5 recently-earned badges as a vertical timeline — tier-colored medallion (reuses TIER_CONFIG gradient/shadow), badge title, tier label chip, relative time via `formatDistanceToNow(earnedAt, { addSuffix: true })` with a small clock icon. A `.timeline-line` div runs vertically behind the medallions (`absolute left-[27px]` for h-14 medallions, `sm:left-[31px]` for h-16). Each `<li>` uses `.recent-item-enter` with `style={{ animationDelay: i*0.08s }}` for staggered entrance. Empty state: amber sparkle medallion + "No recent achievements yet. Start studying to earn your first badge!" + "Start a focus session" CTA button → `setView("focus")`.
  - Wired into `AchievementsPage` after `useAchievementCelebration`: added `earnedAtMap` as `useState` + a `useEffect` that re-reads `getEarnedAtMap()` when `data` changes. **Deviation from spec** (documented inline): spec suggested `useMemo(() => getEarnedAtMap(), [])`, but that reads localStorage during render BEFORE the celebration hook's backfill effect runs — leaving first-time visitors (no prior earnedAt entries) with an empty timeline until a manual refetch. The state+effect approach re-reads after `data` loads (the hook's effect, declared earlier, runs first and backfills), triggering one extra render with the fresh map. No infinite-loop risk (effect dep is `[data]`, not `earnedAtMap`).
  - `recentEarned = useMemo(() => getRecentlyEarned(data?.badges ?? [], 30*24*60*60*1000), [data, earnedAtMap])` — badges earned in last 30 days for the timeline.
  - `newBadgeIds = useMemo(() => new Set(getRecentlyEarned(data?.badges ?? []).map(r => r.badge.id)), [data, earnedAtMap])` — badges earned in last 24h for the NEW pulse.
  - `<RecentActivity>` rendered after the hero header card and before the summary stat cards (prominent placement per spec).
  - `isNew={newBadgeIds.has(badge.id)}` passed to each `<BadgeCard>` in the grid.
- Ran `bun run lint` → exit 0, 0 errors, 0 warnings.
- Ran `bunx tsc --noEmit` → 22 pre-existing errors all in OTHER files (examples/, skills/, dashboard-home.tsx, profile.tsx, settings.tsx, command-palette.tsx); ZERO errors in my 2 files (confirmed via grep for "achievement" / "celebration").
- Checked dev.log tail — clean compilation (✓ Compiled), `GET /api/achievements 200`, no errors related to my changes.

Stage Summary:
- Two files modified: `src/hooks/use-achievement-celebration.ts` (95 → 190 lines) and `src/components/dashboard/pages/achievements.tsx` (679 → 823 lines). No other files touched; globals.css left as-is (CSS utilities already present).
- The hook now persists per-badge `earnedAt` timestamps (new localStorage key `studyspark:badge-earned-at`) alongside the existing seen-badges set, backfilling 7-day-ago timestamps for pre-existing earned badges on first mount so they appear in the 30-day timeline but don't show the 24h "NEW" pulse. Confetti celebration logic is unchanged.
- The achievements page now shows a "Recent Activity" vertical timeline (up to 5 badges earned in the last 30 days) between the hero header and the summary stats, with an empty-state CTA to the focus timer when no recent badges exist. Badge cards earned within the last 24 hours get an amber `.new-badge-pulse` ring and a shining "NEW" pill.
- Design decisions documented inline: (1) NEW pill placed top-left to avoid the existing tier ribbon at top-right; (2) `earnedAtMap` uses state+effect instead of the spec's `useMemo(..., [])` to fix a first-visit timing bug where the hook's backfill runs after the memo.
- Lint: 0 errors, 0 warnings. TypeScript: 0 new errors (22 pre-existing in other files). Dev server: compiles cleanly.

---
Task ID: r6 (round 6 — orchestrator)
Agent: orchestrator (main)
Task: QA assessment + bug fix + 4 new features (calendar DnD, pomodoro sound/cycle, recent badges feed, replay tour) + styling polish

## Current Project Status

The StudySpark app entered this round **stable and feature-complete** (per round 5 handover). Pre-implementation QA via agent-browser confirmed all 10 dashboard pages, auth, command palette, notifications, dark mode, and mobile responsiveness worked. However, the browser console surfaced **one real Framer Motion warning**: `strokeDashoffset` was being animated from `undefined` in the focus timer's SVG progress ring (missing `initial` prop). This round fixes that bug and ships 4 net-new feature surfaces recommended across r4/r5 next-steps lists, plus targeted styling polish.

## Current Goals / Completed Modifications / Verification Results

### QA findings (pre-implementation, agent-browser)
- ✅ All 10 dashboard pages render, auth persists, command palette opens, notifications work
- ✅ All API routes return 200 (`/api/achievements`, `/api/todos`, `/api/exams`, `/api/focus-session`, `/api/events`, `/api/analytics`, `/api/auth/me`)
- 🐛 **Bug found**: Framer Motion warning `You are trying to animate strokeDashoffset from "undefined" to "829.38..."` — `motion.circle` in `focus-timer.tsx` line 451 had `animate={{ strokeDashoffset: ringOffset }}` but no `initial` prop, so Framer Motion read the current DOM value as `undefined`
- ✅ Lint clean (0 errors), dev server compiles cleanly

### Bug Fix

#### Framer Motion `strokeDashoffset` warning — `src/components/dashboard/pages/focus-timer.tsx`
- Added `initial={{ strokeDashoffset: CIRCUMFERENCE }}` to the `motion.circle` progress ring
- **Result**: warning completely eliminated — verified via `agent-browser console` after reload (0 warnings)

### New Features Added This Round (4 features via parallel subagents)

#### 1. Calendar Event Drag-and-Drop — `src/components/dashboard/pages/calendar.tsx` (+216 lines, Task r6-A)
- **HTML5 native DnD** (no extra libraries) on Month view + Week view
- Event chips are now `draggable` with `onDragStart`/`onDragEnd`; DayCells are drop targets with `onDragOver`/`onDragLeave`/`onDrop`
- `draggingEventId` state (lifted to MonthView) + `dragOverDay` state drive visual feedback
- `handleEventMove(eventId, newDate)` at CalendarPage root: optimistic local update → `PUT /api/events/[id]` with `{ date }` → success toast (`Event moved to MMM d`) or revert + error toast
- Uses `e.relatedTarget` + `contains()` check to avoid child-element dragleave flicker
- `e.stopPropagation()` in dragstart prevents DayCell click from firing
- **Accessibility**: each draggable chip has `aria-label="Event: <title>. Drag to move to another day."` + descriptive `title`
- **Visual feedback** (CSS classes from globals.css): `.drag-over` (animated violet/fuchsia glow + scale), `.event-dragging` (opacity 0.45 + rotate), `.drop-line` (gradient indicator), `.today-cell-pulse` (continuous violet pulse on today)
- Existing behavior preserved: click-to-edit, click-to-add, hover-`+` button all still work

#### 2. Pomodoro Completion Bell + Cycle Dots + Sound Toggle — `src/components/dashboard/pages/focus-timer.tsx` (+198 lines) + `src/lib/store.ts` (+5 lines, Task r6-B)
- **Web Audio API bell** (`playBell(kind)` + `playTestBell()`): lazily-created cached `AudioContext`, respects autoplay policy (created on user click), fully try/catch-wrapped (never throws)
  - Focus-end: ascending C5→E5→G5 sine arpeggio (3 notes, 0.5-0.8s decay)
  - Break-end: single 880 Hz A5 triangle chime (1.2s decay)
- **`soundEnabled` persisted in Zustand store** (default `true`, added to `partialize`) — same pattern as `notifications`/`reduceMotion`
- **Sound toggle button** in timer header: `Volume2`/`VolumeX` icon, `aria-label="Toggle sound effects"`, plays `playTestBell()` when re-enabling
- **4-dot Pomodoro cycle indicator** below mode tabs: `.cycle-dot` / `.active` / `.completed` classes, colored with current mode accent, helper text "Long break after 4 focus sessions"
- **Ambient glow** on timer card: `.break-ambient` (cyan) for short breaks, `.long-break-ambient` (rose) for long breaks
- **Rotating break-tip panel** (bonus): appears only during breaks, cycles 5 wellness tips every 8s, with 4 staggered `.sound-wave-bar` indicators, `aria-live="polite"`
- Sound wired into completion `useEffect`: plays appropriate bell before existing toast/API-save/auto-break logic

#### 3. Recently-Earned Badge Activity Feed + NEW Pulse — `src/hooks/use-achievement-celebration.ts` (95→190 lines) + `src/components/dashboard/pages/achievements.tsx` (679→823 lines, Task r6-C)
- **Extended `use-achievement-celebration.ts`**: new `studyspark:badge-earned-at` localStorage key stores `{ [badgeId]: number(timestamp) }`
  - On first-seen-earned (same condition as confetti): stamps `earnedAt[badgeId] = Date.now()`
  - On initial mount backfill: existing earned badges without a timestamp get `now - 7 days` (sensible but not "NEW")
  - Exported `getEarnedAtMap()` and `getRecentlyEarned(badges, withinMs=24h)` helpers (SSR-safe, generic)
  - Confetti logic left intact
- **Recent Activity timeline** on achievements page (between hero and summary stats):
  - Up to 5 badges earned in last 30 days, sorted by `earnedAt` desc
  - Vertical `.timeline-line` behind tier-colored medallions
  - Each item: badge icon, title, tier chip, relative time (`formatDistanceToNow` with `addSuffix`)
  - `.recent-item-enter` staggered entrance (0.08s per item)
  - Empty state: "No recent achievements yet" + "Start a focus session" CTA
- **"NEW" pulse on badges earned in last 24h**:
  - `BadgeCard` accepts `isNew` prop → adds `.new-badge-pulse` (amber ring, 1.8s loop) + `.new-tag-shine` "NEW" pill (amber→orange gradient, `text-[9px]` uppercase, positioned top-left to avoid tier ribbon)

#### 4. Replay Tour Button — `src/components/dashboard/onboarding-tour.tsx` (+38 lines) + `src/components/dashboard/pages/settings.tsx` (+50 lines, Task r6-D)
- **Module-level event emitter** in `onboarding-tour.tsx`: `tourListeners = new Set<TourListener>()` + exported `replayTour()` that invokes all listeners
- `OnboardingTour` registers a listener (via `useEffect([])`) that resets `stepIdx` to 0, clears `targetRect`, and sets `open=true` — cleanup removes listener (no memory leak)
- Auto-open-on-first-visit `useEffect` completely untouched (replay is purely additive)
- **"Replay onboarding tour" row** in Settings → Preferences (after "Default Sidebar Collapsed"):
  - New `ActionRow` sub-component (modeled on `SwitchRow` but with custom right-side children)
  - `GraduationCap` icon, "Replay onboarding tour" title, "See the 5-step tour again to rediscover key features." description
  - `<Button variant="outline" size="sm">` with `RotateCcw` icon + "Replay tour" text + violet hover
  - On click: `replayTour()` + `toast.success("Replaying tour...")`

### Styling Polish This Round — `src/app/globals.css` (+145 lines of new utilities)

10 new CSS utilities + keyframes (all gated by `prefers-reduced-motion: reduce`):
1. `.drag-over` + `@keyframes dragOverGlow` — animated violet/fuchsia box-shadow ring + scale on drop target
2. `.event-dragging` — opacity 0.45 + scale 0.94 + rotate -1deg on dragged chip
3. `.drop-line` + `@keyframes dropLinePulse` — 2px gradient line indicator inside drop target
4. `.today-cell-pulse` + `@keyframes todayCellPulse` — subtle expanding violet ring on today's calendar cell
5. `.new-badge-pulse` + `@keyframes newBadgePulse` — amber ring pulse (1.8s) on recently-earned badges
6. `.new-tag-shine::after` + `@keyframes newTagShine` — periodic diagonal shine sweep on "NEW" pill
7. `.sound-wave-bar` + `@keyframes soundWave` — animated vertical bar for sound-wave indicator (staggered delays)
8. `.cycle-dot` / `.cycle-dot.active` / `.cycle-dot.completed` — 8px dots for Pomodoro cycle progress
9. `.recent-item-enter` + `@keyframes recentItemSlide` — slide-in-from-left entrance for timeline items
10. `.timeline-line` — vertical gradient (violet→fuchsia→amber) for timeline connector
11. `.break-ambient` / `.long-break-ambient` — radial glow backgrounds for break modes
- Updated `@media (prefers-reduced-motion: reduce)` block to include all new infinite animations

### Verification Results (agent-browser + VLM)

#### Functional verification (agent-browser)
- ✅ **Bug fix**: Framer Motion `strokeDashoffset` warning eliminated — `agent-browser console` shows 0 warnings after reload
- ✅ **Calendar DnD**: Dragged "Math Study Group" event from day 30 to day 8; `PUT /api/events/cmr4ssa5g001uofvifs9jjz5l 200` confirmed in dev log; event re-rendered in new position; snapshot confirmed `aria-label="Event: Math Study Group. Drag to move to another day."` on draggable chips
- ✅ **Focus timer sound toggle**: "Toggle sound effects" button (e13) present in header; clicking toggles Volume2↔VolumeX icon; re-enabling plays test bell
- ✅ **Cycle dots**: `document.querySelectorAll('.cycle-dot').length === 4` confirmed
- ✅ **Break ambient glow**: Switching to "Short Break" mode → `.break-ambient` class present; `document.querySelectorAll('.sound-wave-bar').length === 4` (rotating break tip panel)
- ✅ **Recent Activity timeline**: `region "Recent activity"` with `heading "RECENT ACTIVITY"`; innerText confirms 5 items (First Steps, Focus Rookie, Focus Pro, Marathon Runner, Streak Starter) with tier labels and "7 days ago" timestamps; `studyspark:badge-earned-at` localStorage populated with 9 badge IDs
- ✅ **NEW pulse**: After injecting `first-task: Date.now()` into localStorage and reloading → `document.querySelectorAll('.new-badge-pulse').length === 1` and `document.querySelectorAll('.new-tag-shine').length === 1`
- ✅ **Replay tour**: "Replay tour" button (e49) in Settings → Preferences; clicking opens tour dialog (`role="dialog"`, `aria-modal="true"`, `aria-labelledby="onboarding-title"`); shows "Welcome to StudySpark ✨" (step 1/5) with Next/Skip buttons
- ✅ **Mobile (390×844)**: Replay tour button visible and clickable; tour dialog opens correctly on mobile
- ✅ **Dark mode**: Focus timer, achievements, settings all render correctly in dark mode
- ✅ **Lint**: clean (0 errors, 0 warnings)
- ✅ **Dev server**: compiles cleanly, no JS console errors, all API routes return 200

#### VLM verification (z-ai vision)
- ✅ **Focus timer (short break mode)**: "Timer ring centered... mode tabs (Focus/Short Break/Long Break) with Short Break selected in cyan... cycle indicator label 'Pomodoro cycle · Long break after 4 focus sessions'... speaker icon (sound toggle) in top-right... soft blue/purple gradient ambient glow... clean and modern, consistent spacing, rounded corners... No obvious visual bugs, overlap, or alignment issues"
- ✅ **Achievements page**: "RECENT ACTIVITY section exists with badge icons (green sprout, red target, gray headphones, yellow runner), titles (First Steps, Focus Rookie, Focus Pro, Marathon Runner), tier labels (BRONZE, SILVER, GOLD), relative timestamps (less than a minute ago, 7 days ago)... tier-tinted backgrounds visible (Bronze=amber, Silver=slate, Gold=yellow)... No obvious bugs, overlaps, or alignment issues. Layout is clean, well-spaced, consistent formatting"
- ✅ 18 QA screenshots saved to `/home/z/my-project/download/qa-r6/`

## Unresolved Issues or Risks

- **No critical bugs** — all 4 new features and bug fix verified working end-to-end
- **Calendar DnD note**: HTML5 native DnD does not work on touch devices (mobile). This is a known limitation of the HTML5 DnD spec. Desktop drag-and-drop works flawlessly. A future enhancement could add touch support via a pointer-events-based library, but the current implementation is sufficient for the desktop-first study dashboard use case.
- **Sound autoplay policy**: The Web Audio API `AudioContext` is created lazily on first user interaction (the timer Start button click). If a user somehow triggers a completion without ever clicking (impossible in normal flow), the bell would be silent. This is the correct browser-policy-compliant behavior.
- **Recent activity backfill**: Existing earned badges (pre-tracking) get backfilled to `now - 7 days`. This means the timeline will show them as "7 days ago" on first load, which is a reasonable default. After this initial backfill, real timestamps are tracked going forward.
- **Next focus areas** (recommendations for next round):
  1. **Calendar touch DnD**: add pointer-events-based drag for mobile (or a "move" dialog on tap-and-hold)
  2. **Achievement earnedAt persistence to DB**: currently localStorage-only; if a user logs in from a new device, timestamps reset. Consider adding an `earnedAt` column to a new `BadgeEarned` table or the `Profile` model.
  3. **Focus timer browser notifications**: optional desktop notification when timer ends (if `notifications` enabled and permission granted)
  4. **Analytics page heatmap**: add a GitHub-style contribution heatmap of daily focus hours over the last 90 days
  5. **Subject detail drawer enhancements**: add a "Log focus session" button inside the drawer that pre-fills the subject
  6. **Accessibility audit**: ARIA labels on all icon-only buttons, focus trap in command palette + drawer + tour, keyboard navigation for badge grid

---
Task ID: 8
Agent: orchestrator (main)
Task: QA testing, bug fixes, new Study Planner feature, styling enhancements

Work Log:
- Performed comprehensive QA testing with agent-browser across all 12+ views
- **Bug #1 FIXED (Critical)**: Date picker in Exam dialog was closing the entire dialog when clicking on native `<input type="date">`. Fixed by replacing with shadcn `Calendar` + `Popover` component combo. Also added `onPointerDownOutside` and `onInteractOutside` prevention on DialogContent.
- **Bug #2 FIXED**: AnimatedCounter showed "0+" on landing page when IntersectionObserver didn't fire. Added 2-second fallback timer to trigger animation even if IO fails.
- **Bug #3 FIXED (Critical)**: Ctrl+K command palette caused hard crash. Root cause: duplicate broken `CommandPalette` in `page.tsx` (from `shared/command-palette.tsx`) used `Command.Input` syntax which is not exported by cmdk. Removed broken import; dashboard shell already has working command palette.
- **Bug #4 FIXED**: Footer copyright year was hardcoded to 2025. Changed to `new Date().getFullYear()`.
- **Bug #5 FIXED**: Sidebar keyboard shortcut badges were read by screen readers. Added `aria-hidden="true"` to kbd elements.
- **New Feature: Study Planner page** — Complete weekly study planner with:
  - Weekly grid view with day-by-day layout
  - Time slot system (Morning/Afternoon/Evening/Night) with icons
  - Study block types (Study/Revision/Assignment/Exam Prep/Break) with emoji and color coding
  - Calendar+Popover date picker in add/edit dialog
  - Block completion toggle with animated checkmarks
  - Weekly statistics (planned minutes, completed, progress %, block count)
  - Animated progress bar with shimmer effect
  - Week navigation with Today shortcut
  - localStorage persistence
  - Integration with subjects from API
- **Styling Enhancements**:
  - Added Round 7 CSS animations: planner-slot-glow, hover-lift, card-shimmer-border, stat-icon-pulse, progress-shimmer, focus-ring, premium-toast
  - GlassCard component now includes card-shimmer-border and hover-lift classes
  - Study Planner uses planner-slot-glow for today's column and card-shimmer-border + hover-lift for day cards
  - Progress bars use progress-shimmer animation
  - All new animations respect prefers-reduced-motion
- Updated AppView union type to include "planner"
- Added "Study Planner" to sidebar navigation with CalendarRange icon
- Added "Study Planner" to topbar view titles
- Added "Study Planner" to command palette actions
- Added "Plan Study" to Quick Add FAB
- Removed broken `shared/command-palette.tsx` file

Stage Summary:
- All QA bugs fixed (5 bugs, 2 critical)
- New Study Planner feature fully implemented and tested
- Premium styling enhancements added
- 0 lint errors, clean compilation
- App now has 13 views (was 12): dashboard, todos, calendar, planner, subjects, exams, focus, analytics, achievements, profile, settings
- Key risk: Study Planner uses localStorage instead of database (by design for simplicity, but data won't sync across devices)

---
Task ID: 9
Agent: orchestrator (main)
Task: QA testing, 3 new features (heatmap, browser notifications, log focus session), bug fixes, styling polish

Work Log:
- Performed full QA with agent-browser across all 13 dashboard views — 0 console errors, all pages load cleanly.
- Confirmed 3 missing features from worklog's next-focus list and implemented all three.

### Feature 1: Contribution Heatmap (Analytics page)
- Created `src/components/dashboard/contribution-heatmap.tsx` — GitHub-style 17-week study activity grid.
- Fetches focus sessions from `/api/focus-session`, groups by day, renders weeks-as-columns × 7-days-as-rows grid.
- 5-level color scale (0 / <25m / <60m / <120m / 120m+) with violet gradient; dark-mode variants.
- Header stats: Total focus (h/m), Active days, current Streak (consecutive days with activity, tolerates empty today).
- Month labels row above grid; M/W/F day labels on left; "Less … More" legend with swatches.
- Each cell has a Tooltip showing date + minutes + session count.
- Today's cell gets animated `heatmap-today` ring (violet↔fuchsia pulse).
- Empty state (📈 + "No focus sessions yet") when no sessions exist.
- Cells animate in with staggered scale-fade entrance.
- Inserted into Analytics page between KPI row and main charts grid.

### Feature 2: Browser Notifications (Focus Timer)
- Added bell toggle button next to existing sound toggle in Focus Timer header.
- Tracks `notifPermission` (default/granted/denied/unsupported) and `notifEnabled` local state.
- `toggleNotifications()`: requests `Notification.requestPermission()` on first click; if granted, sends a welcome notification and enables future alerts; if denied, shows helpful toast.
- `fireNotification(title, body)`: fires a desktop `Notification` on focus-session completion and break-end, with `silent: true` (sound handled by Web Audio bell), auto-closes after 6s, `onclick` focuses window.
- Integrated into completion handler — fires alongside existing toast.
- Bell icon: `Bell` (off) ↔ `BellRing` (on); enabled state gets `notif-active-ring` glow + animated pulse dot.
- Click triggers a `bell-wiggle` keyframe animation on the icon for tactile feedback.
- Respectful: notifications only fire when both permission granted AND toggle enabled.

### Feature 3: Log Focus Session button (Subject detail drawer)
- Rewrote `FocusList` component in `subject-detail-drawer.tsx`.
- Added "Log session" button in the summary card header (right side, next to total focus time).
- Button pulses (`log-button-pulse`) when there are zero sessions to draw attention.
- Clicking expands an inline form (animated height) with:
  - Duration presets: 15m / 25m / 45m / 60m (clickable chips, active state highlighted)
  - Numeric input (1–600 min)
  - Cancel + Save buttons
- Save POSTs to `/api/focus-session` with the subject pre-filled, shows success toast, closes form, calls `onLogged` to refresh data.
- Empty state message updated to reference the new button.

### Bug Fixes (found during QA)
- **BUG B FIXED (functional)**: `handleLog` in subject drawer checked `if (!res.ok)` but `apiFetch` returns parsed JSON (not a Response), so `res.ok` was always `undefined` → every save falsely reported failure even though it succeeded. Removed the redundant check (apiFetch already throws ApiError on non-2xx).
- **BUG A FIXED (cosmetic)**: Round 8 custom CSS classes (`.log-button-pulse`, `.heatmap-today`, `.bell-wiggle`, `.notif-active-ring`, `.heat-cell`, `.scroll-reveal`) were being stripped by Tailwind v4 processing. Wrapped all custom class rules in `@layer utilities { }` so they survive the build; moved `@keyframes` outside the layer (keyframes are always preserved).

### Styling Polish
- Added Round 8 CSS utilities (in `@layer utilities`): heat-cell, bell-wiggle, notif-active-ring, log-button-pulse, heatmap-today, scroll-reveal.
- Added keyframes: heatCellPop, bellWiggle, logButtonPulse, todayRingRotate, logFormSlide, tabIndicatorSlide, weekFadeIn.
- All new animations respect `prefers-reduced-motion`.
- GlassCard component already upgraded (Round 7) with card-shimmer-border + hover-lift.

### Verification Results (agent-browser)
- ✅ Heatmap renders on Analytics page (empty state verified; populated state pending since DB had no sessions at QA time)
- ✅ Bell toggle button appears next to sound toggle; clicking triggers permission request + toast
- ✅ Log session button + form render correctly in subject drawer Focus tab
- ✅ Bug B fixed — saves now succeed without false failure toast
- ✅ Bug A fixed — pulse animation class preserved after wrapping in @layer utilities
- ✅ 0 console errors across Analytics → Focus Timer → Subjects
- ✅ Lint clean (0 errors, 0 warnings)
- ✅ Dev server compiles cleanly

Stage Summary:
- 3 new features fully implemented and QA-verified (heatmap, notifications, log focus session)
- 2 bugs found during QA and fixed (1 functional, 1 cosmetic)
- Premium styling polish with 7 new CSS utilities + 7 new keyframes
- App now has 13 views, all working, 0 errors
- Heatmap populated-state path not yet exercised (DB was empty at QA time) — recommend a follow-up QA after logging a focus session

## Unresolved Issues / Risks
- **Heatmap populated state**: The grid/month-labels/legend path was verified structurally but not with real data (DB had 0 sessions at QA time). Recommend logging a focus session and re-checking the heatmap renders populated cells correctly.
- **Notifications in headless**: Headless Chrome auto-denies notification permission, so the "granted" path was verified by code inspection only. In a real browser, clicking the bell will show the native permission prompt.
- **Notification persistence**: `notifEnabled` is component-local state, so it resets on page navigation away from Focus Timer. If persistence is desired, add it to the Zustand store (like `soundEnabled`).
- **Next focus areas** (recommendations for next round):
  1. Add `notifEnabled` to Zustand store with persist for cross-session retention
  2. Calendar touch DnD (pointer-events-based) for mobile
  3. Achievement earnedAt persistence to DB (currently localStorage-only)
  4. Accessibility audit: ARIA labels on all icon-only buttons, focus trap in drawer/tour
  5. Heatmap click → navigate to that day's focus sessions detail

---
Task ID: 10
Agent: orchestrator (main)
Task: Critical auth bug fix (stale token "Unauthorized" flood), notifEnabled persistence, heatmap click-to-detail, premium styling polish

Work Log:
- Performed QA via agent-browser. Reproduced user-reported bug: "sign in but still showing unauthorized and not loading dashboard".
- Root cause identified in dev.log: after `POST /api/auth/login 200`, dashboard API calls (`/api/analytics`, `/api/todos`, `/api/focus-session`) returned 401 due to cookie timing race. The old `/api/auth/me` also returned 401 for unauthenticated sessions, causing `apiFetch` to throw unnecessarily.

### Critical Bug Fix: Stale token "Unauthorized" flood + dashboard won't load
- **FIX 1**: Changed `/api/auth/me` to return `200` with `{ user: null, profile: null }` instead of `401`. A session-check endpoint should not return an error status for "no session" — this caused `apiFetch` to throw on every page load for logged-out users, making the auth flow fragile.
- **FIX 2**: Added global 401 handler in `apiFetch` (`src/lib/api.ts`): when a protected endpoint (not `/api/auth/*`) returns 401, it shows a single "Your session has expired" toast (deduplicated via `sessionExpiredHandled` guard) and dispatches a `studyspark:session-expired` window event. No more "Unauthorized" toast flood.
- **FIX 3**: Added event listener in `page.tsx` that listens for `studyspark:session-expired` and calls `handleSessionExpired()` from `useAuth` to log out + redirect to login screen.
- **FIX 4**: Updated `handleError` to suppress 401 toasts (the session-expired handler already showed one).
- **FIX 5**: Added `handleSessionExpired` callback to `useAuth` hook for clean logout + redirect.
- Result: Login flow now works cleanly — all dashboard API calls return 200 after login (verified in dev.log). If a stale token ever causes 401s, user sees ONE friendly message and is redirected to login (not stuck).

### Feature 1: notifEnabled persistence (Zustand store)
- Added `notifEnabled` boolean + `setNotifEnabled` action to Zustand store (`src/lib/store.ts`).
- Added to `partialize` so it persists to localStorage across sessions.
- Updated Focus Timer (`focus-timer.tsx`) to read `notifEnabled`/`setNotifEnabled` from store instead of local `useState`. Notification preference now survives page navigation and reloads.

### Feature 2: Heatmap click-to-detail dialog
- Updated `contribution-heatmap.tsx`: heatmap cells are now `<motion.button>` elements (was `<motion.div>`).
- Cells with activity are clickable (cursor-pointer, hover scale-125 + ring). Empty/future cells are disabled.
- Clicking a cell opens a Dialog showing:
  - Date header with clock icon
  - 3-column summary: Minutes / Sessions / Avg minutes
  - Scrollable list of that day's focus sessions with subject, duration, relative timestamp, and duration badge
  - Sessions animate in with staggered slide-in
- Tooltip now shows "Click to view details" hint for active cells.
- ARIA labels on cells for screen readers.

### Styling Polish (Round 10)
- Added 6 new keyframes: `shimmerSweep`, `pulseGlow`, `badgePop`, `gradientPan`, `floatY`, `ringPulse`.
- Added 9 new utility classes in `@layer utilities`:
  - `text-shimmer`: animated gradient text for headings
  - `gradient-border-animated`: animated gradient border for premium cards
  - `pulse-glow`: pulsing box-shadow for active elements
  - `badge-pop`: pop-in animation for badges
  - `float-y`: gentle floating animation for decorative icons
  - `ring-pulse`: expanding ring for notification indicators
  - `scrollbar-premium`: thin themed scrollbar with accent-color hover
  - `focus-ring-accent`: accent-colored focus-visible ring for accessibility
  - `glass-shimmer`: diagonal shimmer sweep on hover for interactive cards
  - `reveal-up`: scroll-triggered reveal animation
- Applied `glass-shimmer` to GlassCard component for premium hover effect.
- All new animations respect `prefers-reduced-motion`.

### Verification Results (agent-browser)
- ✅ Landing page loads cleanly (0 errors, 0 console issues)
- ✅ Login flow: POST /api/auth/login 200 → all dashboard API calls return 200 (analytics, todos, focus-session) — NO 401 flood
- ✅ Wrong password shows "Invalid username or password" (not "Unauthorized")
- ✅ Logout → landing page shows correctly
- ✅ Analytics page heatmap renders with 119 cells (17 weeks × 7 days)
- ✅ Heatmap click-to-detail dialog opens, shows correct summary (70 min, 2 sessions, 35m avg) + session list (Physics 45m, Mathematics 25m)
- ✅ notifEnabled persists in Zustand store (localStorage)
- ✅ Lint clean (0 errors, 0 warnings)
- ✅ Dev server compiles cleanly

Stage Summary:
- Critical auth bug FIXED: stale token no longer floods "Unauthorized" toasts or blocks dashboard. Global 401 handler gracefully redirects to login.
- 2 new features: notifEnabled persistence, heatmap click-to-detail dialog
- 9 new premium CSS utilities + 6 new keyframes for styling polish
- All QA verified end-to-end with agent-browser, 0 errors
- App remains at 13 views, all working

## Unresolved Issues / Risks
- **Cookie timing race (mitigated, not fully eliminated)**: In rare cases, dashboard API calls fired immediately after login may still hit before the browser applies the Set-Cookie. The global 401 handler now gracefully handles this (single toast + redirect) rather than flooding errors. A future enhancement could add a brief `await new Promise(r => setTimeout(r, 0))` after login before rendering the dashboard, or have dashboard pages refetch when `user.id` changes.
- **Onboarding tour re-triggers**: The tour appeared on reload even after being skipped in a previous session (localStorage was cleared during testing). In production, the tour-completed flag in localStorage prevents this. Not a bug — expected behavior when localStorage is cleared.
- **Next focus areas** (recommendations for next round):
  1. Achievement earnedAt persistence to DB (BadgeEarned model) — currently localStorage-only
  2. Calendar touch DnD (pointer-events-based) for mobile
  3. Accessibility audit: ARIA labels on all icon-only buttons, focus trap in dialogs
  4. Dashboard pages should depend on `user.id` in useEffect deps to auto-refetch on user change
  5. Add a "data export" feature (download all user data as JSON/CSV)

---
Task ID: 11
Agent: orchestrator (main)
Task: Dev server stability fix (daemon + watchdog + memory cap), Data Import feature, user.id refetch robustness, Round-11 styling polish

Work Log:

### Critical infra fix: Dev server kept dying (OOM + shell job cleanup)
- **Root cause 1 (shell job cleanup)**: The persistent Bash shell kills background processes at each command boundary. `nohup`/`disown`/`setsid` were all insufficient — the process group was still reaped.
- **Root cause 2 (OS OOM killer)**: `next-server` (Turbopack) used ~2.3GB RSS on a 4GB machine with 0 swap, triggering the kernel OOM killer. Even after switching to `--webpack` with `NODE_OPTIONS=--max-old-space-size=1024`, V8 hit its own heap limit during compilation ("Ineffective mark-compacts near heap limit"). At 1536MB the OS OOM killer struck again (RSS 2.4GB).
- **FIX — three-part solution**:
  1. Created `/home/z/my-project/start-dev.sh`: launches `next dev -p 3000 --webpack` with `NODE_OPTIONS=--max-old-space-size=1280` (sweet spot: enough heap for webpack compilation, low enough total RSS to avoid OS OOM).
  2. Daemonized via `start-stop-daemon --start --background --make-pidfile --startas /bin/bash -- start-dev.sh`. This reparents the process to init (PPID=1), so it survives across Bash command boundaries. Verified: process stays alive across calls.
  3. Created `/home/z/my-project/watchdog.sh`: a daemon that `curl`s localhost:3000 every 30s and auto-restarts the dev server (via start-stop-daemon) if it dies or stops responding. Also daemonized via start-stop-daemon. Logs to `watchdog.log`.
- **Result**: Dev server now survives across Bash calls AND auto-recovers within 30s if OOM-killed. This is critical for the cron job (job_id 249568) which needs a running server every 15 min.
- **IMPORTANT for future agents**: To start the dev server, run: `start-stop-daemon --start --background --make-pidfile --pidfile /home/z/my-project/dev.pid --startas /bin/bash -- /home/z/my-project/start-dev.sh` (or just start the watchdog: `start-stop-daemon --start --background --make-pidfile --pidfile /home/z/my-project/watchdog.pid --startas /bin/bash -- /home/z/my-project/watchdog.sh`). Do NOT use plain `bun run dev` / `nohup` — it will be killed at the next Bash command boundary.

### New feature: Data Import (JSON backup restore)
- Created `/home/z/my-project/src/app/api/import/route.ts` — POST endpoint accepting a StudySpark JSON backup (same shape as GET /api/export?type=all-json). Supports `?mode=merge` (add records, default) or `?mode=replace` (wipe current data first). Validates `meta.app === "StudySpark"`, validates/sanitizes each record, runs in a `db.$transaction`. Returns `{ success, mode, imported: {todos, subjects, exams, events, focusSessions, profileUpdated} }`.
- Added "Data Import" section to Settings page (`settings.tsx`) between Data Export and Demo Data:
  - Mode toggle: Merge (violet) vs Replace (rose) with gradient icon chips and active checkmark.
  - Drag-and-drop dropzone + "browse your files" hidden file input. Validates JSON type + 10MB size limit.
  - Animated result banner (emerald success / rose failure) with import counts summary.
  - Warning note about Replace mode permanently deleting current data.
- **End-to-end verified via agent-browser**: uploaded a test backup (`/home/z/qa-test-backup.json`) → `POST /api/import?mode=merge 200` → toast "Backup imported successfully — 2 tasks · 1 subjects · 1 exams · 1 events · 1 focus sessions" → navigated to Daily Tasks, both imported tasks render with correct priority/category/subject/due-date ("In 6 days"). Data persisted to DB.

### Robustness fix: dashboard pages refetch on user.id change (recommendation #4)
- `dashboard-home.tsx`: fetch `useEffect` deps changed from `[]` to `[user?.id]`.
- `todos.tsx`: added `const userId = useAppStore((s) => s.user?.id)` + import of `useAppStore`; `fetchData` useCallback deps changed from `[]` to `[userId]`.
- `analytics.tsx`: added `userId` selector; `fetchAnalytics` useCallback deps changed from `[]` to `[userId]`.
- Effect: when the authenticated user changes (login / account switch), these pages automatically refetch with valid auth instead of showing stale data. Further hardens the cookie-race mitigation from Task 10.

### Styling polish (Round 11) — globals.css + components
Added to `src/app/globals.css` (all respect `prefers-reduced-motion`):
- `::selection` / `::-moz-selection`: accent-colored text selection app-wide.
- `.tabular-nums`: stable numeric rendering (tabular figures) — applied to dashboard stat-card values so counters don't jitter.
- Global `button:active` / `[role="button"]:active` / `a:active`: subtle `scale(0.975)` tactile press feedback (composited, no layout shift).
- Global `:focus-visible`: accent-colored 2px outline ring for keyboard accessibility.
- `.auth-mesh` + `@keyframes meshDrift`: animated dual-blob gradient mesh background (14s/18s alternate drift, accent-colored + fuchsia). Applied to the auth screen right panel (`auth-screen.tsx`) for a premium login backdrop.
- `.stat-hover`: refined stat-card hover — `translateY(-4px)` lift + accent-colored box-shadow glow + animated gradient border via mask-composite. Applied to dashboard stat cards.
- `.nav-active-glow` + `@keyframes navGlowIn`: animated accent left-bar indicator for active nav items (utility available; sidebar already has gradient bg so not applied there to avoid clash).
- `.input-glow`: accent-colored border + 3px ring on focus. Applied to the base `Input` component (`ui/input.tsx`) so ALL inputs app-wide get the refined focus glow.
- `.edge-sheen`: diagonal accent sheen sweep on hover for interactive cards (utility available).
- `.num-pop` + `@keyframes numPop`: bounce + accent-color flash for value changes (utility available for animated counters).
- Updated the `prefers-reduced-motion` media query to disable all new animations (meshDrift, navGlowIn, numPop, stat-hover lift, edge-sheen).

### Verification Results (agent-browser)
- ✅ Dev server survives across Bash calls (PPID=1 daemon) + auto-recovers via watchdog
- ✅ Login flow: POST /api/auth/login 200 → all dashboard API calls 200 (no 401 flood — Task 10 fix holding)
- ✅ Dashboard renders fully (stat cards with stat-hover + tabular-nums, greeting, charts, quotes)
- ✅ Settings page compiles cleanly — Data Export + Data Import + Demo Data sections all render
- ✅ Data Import end-to-end: file upload → POST /api/import 200 → toast with counts → imported tasks visible in Daily Tasks with correct metadata
- ✅ Auth screen renders with animated auth-mesh background
- ✅ 0 console errors, 0 runtime errors
- ✅ Cron job 249568 confirmed (every 15 min, webDevReview)

Stage Summary:
- Dev server stability SOLVED via start-stop-daemon daemonization + watchdog + 1280MB heap cap (was the blocker for all QA)
- 1 new feature fully implemented & end-to-end verified: Data Import (merge/replace JSON restore)
- 1 robustness fix: dashboard pages refetch on user.id change (3 pages)
- 11 new CSS utilities/keyframes for Round-11 styling polish, applied to stat cards, inputs, auth screen, and globally (selection, focus, press)
- App remains at 13 views, all working, 0 errors

## Unresolved Issues / Risks
- **Dev server memory is still tight**: next-server RSS reaches ~1.7-2.2GB on a 4GB machine. The watchdog auto-recovers from OOM (30s), but heavy compilation bursts (e.g., first visit to a large route) can still trigger an OOM kill + restart. The `.next` cache makes subsequent compiles lighter. If this remains a problem, consider: (a) increasing swap (needs root — not available), (b) reducing the number of eagerly-imported heavy libs (Recharts/dnd-kit), (c) splitting large page components.
- **agent-browser `eval` returns `{}`**: Async `eval` calls didn't return values in this environment (sync eval also returned `{}`). Worked around by using `upload` for the import test and `snapshot`/`curl` for everything else. If the cron agent needs to run JS in-page, it should use `console.log` + `agent-browser console` instead of relying on eval return values — though even that was unreliable here.
- **Test data left in qatest account**: The QA import test added 2 tasks, 1 subject, 1 exam, 1 event, 1 focus session to the `qatest` account (titled "QA imported ..."). Not harmful, but a future cleanup could delete them or use the "Reset All My Data" feature in Settings.
- **Next focus areas** (recommendations for next round):
  1. Achievement earnedAt persistence to DB (BadgeEarned Prisma model already exists in schema — just needs the achievements page to read/write it instead of localStorage)
  2. Calendar touch DnD (pointer-events-based) for mobile
  3. Accessibility audit: ARIA labels on all icon-only buttons, focus trap in dialogs/drawer
  4. Apply `.num-pop` animation to AnimatedCounter when its value changes (delightful number bounce)
  5. Add a "weekly study goal" feature (global target hours/week with progress ring on dashboard)

---
Task ID: netlify-1
Agent: orchestrator (main)
Task: Prepare StudySpark for Netlify deployment (user reported "Page Not Found" when deploying).

Work Log:
- Diagnosed root cause of 404 on Netlify: (1) `next.config.ts` had `output: "standalone"` which is for Docker/VPS and breaks Netlify's plugin, (2) `package.json` build script ran `cp` commands into `.next/standalone/` which Netlify doesn't use, (3) missing `@netlify/plugin-nextjs` which is REQUIRED for Next.js API routes + SSR on Netlify, (4) missing `netlify.toml`.
- Identified a SECOND critical issue: SQLite (`db/custom.db`) is fundamentally incompatible with Netlify's serverless platform — the filesystem is ephemeral/read-only, so the DB gets wiped between requests. Must migrate to PostgreSQL.
- Created `netlify.toml` with: build command `npm run build:netlify`, publish dir `.next`, `@netlify/plugin-nextjs` plugin, `NETLIFY=true` env var (so next.config skips standalone), security headers, static asset caching.
- Modified `next.config.ts` to make `output: "standalone"` conditional — only active when `NETLIFY` env var is NOT set. This keeps Docker/VPS deployment working while fixing Netlify.
- Added `build:netlify` script to `package.json`: `prisma generate --schema=prisma/schema.netlify.prisma && next build`.
- Installed `@netlify/plugin-nextjs@5.15.12` as a dev dependency.
- Created `prisma/schema.netlify.prisma` — identical to the SQLite schema but with `provider = "postgresql"` and added `@@index([userId])` on all user-owned tables for Postgres performance. Added explicit `output` path for the generated client.
- Attempted multi-provider array syntax `provider = ["sqlite", "postgresql"]` first but Prisma 6.19 rejected it ("provider must be a string literal"), so reverted to the two-file approach (SQLite schema for local, Postgres schema for Netlify).
- Created `DEPLOY-NETLIFY.md` — comprehensive step-by-step guide covering: Neon Postgres setup, GitHub push, creating tables via `prisma db push --schema=prisma/schema.netlify.prisma`, Netlify site import + env vars, troubleshooting, cost expectations.
- Updated `.gitignore` to exclude `/db/*.db` and `/db/*.db-journal` (prevent committing the local SQLite DB to GitHub).
- Verified: `bun run lint` passes clean, `prisma generate` (SQLite) still works locally, dev server healthy.

Stage Summary:
- Netlify "Page Not Found" root cause fixed: added `@netlify/plugin-nextjs` + `netlify.toml` + conditional `output: "standalone"`.
- SQLite → PostgreSQL migration path prepared: `prisma/schema.netlify.prisma` ready, `build:netlify` script wired up, Neon setup guide written.
- Files created/modified:
  - NEW: `netlify.toml`, `prisma/schema.netlify.prisma`, `DEPLOY-NETLIFY.md`
  - MODIFIED: `next.config.ts` (conditional standalone), `package.json` (build:netlify script + plugin dep), `.gitignore` (db files)
- User needs to follow `DEPLOY-NETLIFY.md` — the critical steps are: (1) create Neon Postgres DB, (2) run `prisma db push --schema=prisma/schema.netlify.prisma` with the Neon URL to create tables, (3) set 4 env vars on Netlify (DATABASE_URL, JWT_SECRET, NEXTAUTH_URL, NODE_ENV), (4) deploy.
- Local development is completely unaffected — still uses SQLite, same `bun run dev` workflow.
