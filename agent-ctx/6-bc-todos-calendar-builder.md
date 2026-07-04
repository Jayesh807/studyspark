# Task 6-bc — Todos & Calendar Builder

## Task
Build two client components for StudySpark dashboard:
- `src/components/dashboard/pages/todos.tsx` → `export function TodosPage()`
- `src/components/dashboard/pages/calendar.tsx` → `export function CalendarPage()`

Both render inside the dashboard main content area. Premium glassy UI, violet/purple palette, Framer Motion, drag & drop, fully responsive.

## Work Log

### Discovery
- Read `worklog.md` and confirmed conventions: `apiFetch`/`handleError`/`sonner`, `useAppStore`, `GlassCard`/`PageTransition`/`StaggerContainer`, `colorOf`/`PRIORITY_CONFIG`/`CATEGORY_CONFIG`, no indigo/blue primary, 20–24px radii, mobile-first.
- Inspected shared components, UI primitives, lib utilities, and API route shapes.
- Verified installed deps: `@dnd-kit/core@6.3.1`, `@dnd-kit/sortable@10.0.0`, `@dnd-kit/utilities`, `date-fns@4`, `framer-motion@12`.

### todos.tsx
- Header with gradient "New Task" button.
- 4 stat cards (Total / Completed / In Progress / Completion %) — last one uses an animated SVG progress ring.
- Toolbar: live search (with clear), status Tabs (All/To-Do/Active/Done — also controls which board columns render), priority Select, sort Select (due date / priority / created).
- Kanban board:
  - `DndContext` + `closestCorners` + `PointerSensor` (distance 6) + `KeyboardSensor`.
  - Each column = `useDroppable`; each card = `useSortable` + `SortableContext(verticalListSortingStrategy)`.
  - `DragOverlay` with `dropAnimation` for a tilted ghost card.
  - Cross-column drops → optimistic status change via PUT.
  - Within-column reorders → all changed cards' `order` values batched-PUT (Promise.all) so reload preserves user intent.
- Task card: priority stripe, title (strike-through when done), description (line-clamp-2), animated Checkbox toggle, badges (priority/category/subject/due-date with overdue red highlight), `...` dropdown (Edit/Delete).
- Create/Edit dialog: Title (required + validation), Description, Priority, Category, Status, Subject (from `/api/subjects` + "None"), Due date.
- Delete confirmation via `AlertDialog`.
- Empty state with "Create your first task" CTA, board skeleton, toasts on every mutation.

### calendar.tsx
- Header with gradient "New Event" button + 3 mini stats.
- Toolbar: "Today" button, prev/next chevrons, view Tabs (Month/Week/Day), live header label.
- Month view: custom 7-col Sun–Sat grid via date-fns primitives. Each cell shows date (today = violet ring/badge), up to 3 colored event chips, "+N more", hover "+" add. Click → day detail dialog.
- Week view: responsive 2/4/7-col grid of day cells with full event lists.
- Day view: single-day focus with date badge, count, animated event rows.
- Event create/edit dialog: Title (required), Date, Time, Description, 6-swatch color picker with animated checkmark.
- Upcoming sidebar: next 5 events (sorted, filter today+future), click-to-edit, empty state with CTA, skeleton loading.
- Day-detail dialog: lists day's events with edit/delete + "Add Event" prefilled to day.
- Delete confirmation `AlertDialog`, optimistic updates with revert.

### Code-quality fixes
- Refactored form components to use `key`-remount + `useState`-initializer pattern instead of `useEffect`-driven `setState` (resolved `react-hooks/set-state-in-effect` lint errors).
- Removed unused imports (`Progress`, `useRef`, `startOfDay`, `AnimatePresence` in calendar).
- Replaced dynamic `bg-${s.color}-500` class with `colorOf(s.color).dot` (Tailwind-safe).
- PUT every changed card's order on within-column reorder (not just the moved card) so reload preserves user intent.

### Verification
- `bun run lint`: 0 errors, 1 pre-existing warning (`src/hooks/use-auth.ts`).
- `bunx tsc --noEmit`: 0 errors in my two files (other files in repo have pre-existing TS errors).

## Stage Summary

| File | Export | Import Path |
|------|--------|-------------|
| `src/components/dashboard/pages/todos.tsx` | `TodosPage()` | `@/components/dashboard/pages/todos` |
| `src/components/dashboard/pages/calendar.tsx` | `CalendarPage()` | `@/components/dashboard/pages/calendar` |

**Wiring**: render inside dashboard main area when `useAppStore.currentView === "todos"` or `"calendar"`. Pure client components, no params. Self-contained — fetch their own data, manage their own local state with optimistic updates + revert.
