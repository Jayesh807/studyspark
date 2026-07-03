# Task 6-a · dashboard-home-builder

## Task
Build the DASHBOARD HOME PAGE (`DashboardHome`) for StudySpark — the premium landing view inside the dashboard shell. Single file at `/home/z/my-project/src/components/dashboard/pages/dashboard-home.tsx`. Fetches `/api/analytics` + `/api/todos`, renders greeting + live clock, 5 animated stat cards, weekly/monthly study charts, rotating motivational quote, subject progress, upcoming exams preview, and today's tasks preview.

## Deliverable
- ✅ Single `"use client"` file with named export `DashboardHome`
- ✅ TypeScript strict, zero `any`
- ✅ Lint-clean on this file (zero errors / zero warnings)
- ✅ Did NOT touch page.tsx, layout, prisma, or API routes

## What I Built

### GreetingHeader (isolated component)
- Owns a 1-second `setInterval` so the parent never re-renders every tick
- Computes greeting from hour: `<12` morning, `<18` afternoon, else evening
- Full date via `date-fns` format "EEEE, MMMM d, yyyy"
- Live `HH:mm:ss` clock in `tabular-nums`
- `text-gradient` username + emoji wave motion loop
- Wrapped in violet "Welcome back to your dashboard" chip

### Stat cards row (5 cards)
Config-driven via `STAT_CARDS` array. Each in `StaggerItem` → `StaggerContainer`. Responsive grid `1 → 2 → 3 → 5` cols.
| Card | Icon | Gradient | Suffix |
|------|------|----------|--------|
| Today's Tasks | CheckCircle2 | violet→purple | — |
| Completed Tasks | CheckCheck | emerald→teal | — |
| Upcoming Exams | GraduationCap | amber→orange | — |
| Focus Time Today | Timer | rose→pink | min |
| Study Streak | Flame | cyan→teal | days |

Each `GlassCard hover` has: gradient icon chip, blur glow blob, big `AnimatedCounter`, subtitle.

### Two-column section
- **Left (2/3)**: WeeklyChart (Recharts `AreaChart`, violet gradient fill, custom `StudyTooltip`) + MonthlyChart (Recharts `BarChart`, fuchsia→violet gradient, rounded bars, 30 days)
- **Right (1/3)**: QuoteCard (8 curated quotes, refresh button, AnimatePresence crossfade, dot indicators, decorative blurred blobs) + SubjectProgressList (top 4 by progress, custom progress bars colored by `colorOf(color).chart`, motion-animated width)

### Bottom row
- **ExamsPreview**: next 3 upcoming exams with calendar date badge, priority dot, subject/location/time chips, urgency-colored countdown pill ("Today"/"Tomorrow"/"in N days"). EmptyState fallback. "View all" → `setView("exams")`.
- **TodayTasksPreview**: today's todos (max 5), priority dot + title (strikethrough if done) + subject + status icon. EmptyState fallback. "View all" → `setView("todos")`.

### Loading & Error
- `DashboardSkeleton` mirrors full layout (greeting + 5 CardSkeletons + two-column skeletons + bottom row skeletons)
- `Promise.all` fetch; `handleError` toast on failure; todos failure is non-fatal

## Integration Notes for Next Agents
- `DashboardHome` takes NO props — it reads `user` from `useAppStore`
- Mount it in the dashboard shell's main content area when `currentView === "dashboard"`
- All charts/animations are SSR-safe via Framer Motion's `useInView` (AnimatedCounter) and `reduceMotion` checks (motion.tsx primitives already respect `useAppStore.reduceMotion`)
- Lint-clean for this file. The lint errors visible in the project are in other agents' files (exams.tsx, profile.tsx, settings.tsx) and out of scope.
