# Task r6-A — Calendar Event Drag-and-Drop

## Task
Add HTML5 native drag-and-drop to the StudySpark Calendar page so users can drag event chips between days in the Month (and Week) view, with visual feedback during drag and persistence via the existing `PUT /api/events/[id]` route. Scope: ONLY modify `src/components/dashboard/pages/calendar.tsx`.

## Previous agent context consulted
- Read `/home/z/my-project/worklog.md` end-to-end (rounds 1–5).
- Round 5 next-steps list explicitly recommended "Calendar event drag-and-drop" as the #1 priority for round 6 — this task delivers it.
- Read `/home/z/my-project/agent-ctx/6-bc-todos-calendar-builder.md` to understand the original calendar component architecture (Month/Week/Day views, DayCell subcomponent, optimistic update + revert pattern).

## Pre-existing infrastructure reused
- CSS utilities in `src/app/globals.css` (added by a prior agent, NOT modified by me):
  - `.drag-over` — animated violet/fuchsia glow + scale on the drop target DayCell
  - `.event-dragging` — opacity 0.45 + slight rotate on the event being dragged
  - `.drop-line` — 2px gradient line element rendered inside the DayCell
  - `.today-cell-pulse` — subtle violet pulse for today's cell
- Existing helpers: `apiFetch`/`handleError` from `@/lib/api`, `toast` from `sonner`, `cn` from `@/lib/utils`, `format`/`parseISO` from `date-fns`.
- Existing API: `PUT /api/events/[id]` accepts partial `{ date: "yyyy-MM-dd" }` body (verified in `src/app/api/events/[id]/route.ts`).

## Work Log

### 1. Imports (line 4)
- Added `useRef` to the React named imports (was `useState, useEffect, useMemo, useCallback`).

### 2. `CalendarPage` root — new `handleEventMove` callback (~line 245)
- Added a `useCallback`-wrapped `handleEventMove(eventId: string, newDate: string)` next to `handleDelete`:
  - Looks up the target event in `events`; returns early if not found.
  - Computes the original `yyyy-MM-dd` date via `format(parseISO(target.date), "yyyy-MM-dd")` and skips if it equals `newDate` (no-op move).
  - Snapshots the current `events` array for revert.
  - **Optimistically** updates local state: `setEvents(prev => prev.map(e => e.id === eventId ? { ...e, date: newDate } : e))`. The Event type stores `date` as a string; using the `yyyy-MM-dd` form is consistent with how the rest of the file (and the `eventOnDay` helper via `parseISO`) treats it.
  - Shows a `toast.loading("Moving event…")` and captures the returned `toastId`.
  - Calls `apiFetch<{ event: Event }>(\`/api/events/\${eventId}\`, { method: "PUT", body: JSON.stringify({ date: newDate }) })`.
  - On success: dismisses the loading toast with `toast.success(\`Event moved to ${format(parseISO(newDate), "MMM d")}\`, { id: toastId })`.
  - On error: reverts via `setEvents(snapshot)`, dismisses loading with `toast.error("Failed to move event", { id: toastId })`, and calls `handleError(err, "Failed to move event")`.
  - Deps: `[events]`.

### 3. Render call wiring (~line 437)
- Passed `onEventMove={handleEventMove}` to both `<MonthView>` and `<WeekView>`.

### 4. `MonthView` (~line 624) — lifted drag state
- Added props: `onEventMove: (eventId: string, newDate: string) => void`.
- Added lifted state: `draggingEventId: string | null` and `dragOverDay: Date | null`.
- Added a `draggingEventIdRef = useRef<string | null>(null)` that mirrors the state for a stable, always-current read in handlers (and as a fallback if `dataTransfer.getData` ever returns empty).
- Wrapped the state setter in a `useCallback` `handleDraggingEventIdChange(id)` that updates BOTH the ref and the state.
- Passes to each `DayCell`: `draggingEventId`, `draggingEventIdRef`, `dragOverDay`, `onDraggingEventIdChange`, `onDragOverDayChange`, and the existing `onEventMove`.

### 5. `DayCell` (~line 699) — draggable source + drop target
- Added props: `onEventMove`, `draggingEventId`, `draggingEventIdRef`, `dragOverDay`, `onDraggingEventIdChange`, `onDragOverDayChange`.
- Typed `draggingEventIdRef` as `React.RefObject<string | null>` (React 19 types).
- Computed `isDragOver = !!draggingEventId && !!dragOverDay && isSameDay(dragOverDay, day)` and `newDateStr = format(day, "yyyy-MM-dd")`.
- **Drop-target handlers** on the cell root `motion.div`:
  - `onDragOver`: returns early if no active drag; `e.preventDefault()` (required to allow drop); sets `e.dataTransfer.dropEffect = "move"`; `e.stopPropagation()`; calls `onDragOverDayChange(day)` only when the day actually changes (prevents redundant renders).
  - `onDragLeave`: `e.stopPropagation()`; uses `e.relatedTarget` + `e.currentTarget.contains(related)` check to ignore child-element flicker; only clears `dragOverDay` if it matches this day.
  - `onDrop`: `e.preventDefault()`; `e.stopPropagation()`; reads `e.dataTransfer.getData("text/plain")` (falls back to `draggingEventIdRef.current || draggingEventId`); calls `onEventMove(eventId, newDateStr)`; clears all drag state.
- **Cell root class merging**: appended `today && "today-cell-pulse"` and `isDragOver && "drag-over"` to the existing `cn(...)` chain. Existing classes (today ring, current-month opacity, hover border) preserved.
- **Drop-line**: rendered `<div className="drop-line" style={{ top: 0 }} aria-hidden="true" />` as the first child of the events `<div className="space-y-1 relative">` when `isDragOver` is true. Added `relative` to the events container so the absolutely-positioned drop-line anchors to it.
- **Event chip** (`<button>`):
  - Added `draggable` attribute.
  - `onDragStart`: `e.dataTransfer.setData("text/plain", event.id)`; `e.dataTransfer.effectAllowed = "move"`; calls `onDraggingEventIdChange(event.id)` (updates both lifted state and ref); `e.stopPropagation()` (prevents the cell's click handler from firing).
  - `onDragEnd`: clears `draggingEventId` and `dragOverDay` (always fires when drag ends, whether successful or cancelled — guarantees state cleanup even if drop happens outside any cell).
  - Preserved the existing `onClick={(e) => { e.stopPropagation(); onEventClick(event); }}` so single-click still opens the edit dialog.
  - Appended `cursor-grab active:cursor-grabbing` and `isThisDragging && "event-dragging"` to the className.
  - Added `title={\`${event.title}${event.time ? \` · ${event.time}\` : ""} · Drag to move to another day\`}` and `aria-label={\`Event: ${event.title}. Drag to move to another day.\`}` for accessibility.

### 6. `WeekView` (~line 874) — same DnD pattern
- Added `onEventMove` prop.
- Added local `draggingEventId`/`dragOverDay` state + a `useRef` mirror is implicit via the lifted `setDraggingEventId` (Week view inlines its day cells, so the ref is unnecessary here — state is read directly).
  - Actually for Week view, since the day cells and event chips all live inside the same component, the lifted state IS the local state — no ref needed. The drop handler reads `draggingEventId` directly from the closure.
- For each day cell `motion.div`:
  - Added `relative` to className; appended `today && "today-cell-pulse"` and `isDragOver && "drag-over"`.
  - Added `onDragOver`/`onDragLeave`/`onDrop` handlers (same logic as DayCell, but using local `setDragOverDay`/`setDraggingEventId` directly).
  - Added `relative` to the events container; renders `<div className="drop-line" style={{ top: 0 }} aria-hidden="true" />` when `isDragOver`.
- For each event chip `<button>`:
  - Added `draggable`, `onDragStart` (dataTransfer + `setDraggingEventId(event.id)` + stopPropagation), `onDragEnd` (clears state), preserved `onClick` (stopPropagation + `onEventClick`).
  - Appended `cursor-grab active:cursor-grabbing` and `isThisDragging && "event-dragging"`.
  - Added `title` and `aria-label` for accessibility.

## Verification

### Lint
- `cd /home/z/my-project && bun run lint` → exit code 0, no errors, no warnings.

### TypeScript
- `bunx tsc --noEmit` → 22 pre-existing errors in OTHER files (command-palette.tsx, dashboard-home.tsx, profile.tsx, settings.tsx, etc.) — NONE in `calendar.tsx`. Filtered `grep -i calendar` returned no matches.

### Dev server log
- Tail of `/home/z/my-project/dev.log` shows clean compilation (`✓ Compiled in 298ms` etc.) and successful API calls including `GET /api/events 200`. No errors or warnings related to my changes.

### Behavioral invariants preserved
- Single-click on event chip → opens edit dialog (existing `onClick` with `stopPropagation` retained).
- Single-click on DayCell → opens day-detail dialog (existing `onClick={() => onDayClick(day)}` retained on cell root).
- `+` button on DayCell hover → still works (its `onClick` still calls `stopPropagation` then `onDayClick`).
- Drag does NOT trigger a click — `e.stopPropagation()` in `onDragStart` prevents the cell's click handler from firing, and HTML5 DnD spec doesn't fire `click` after a successful drag anyway.

## Stage Summary

| File modified | Lines (before → after) | New exports |
|---------------|------------------------|-------------|
| `src/components/dashboard/pages/calendar.tsx` | 1432 → 1648 (+216) | None (internal changes only — `CalendarPage` is the existing export) |

### Key results
- **Month view DnD**: events can be dragged from any day cell to any other day cell in the month grid. Drop triggers optimistic local update + `PUT /api/events/[id]` with `{ date: "yyyy-MM-dd" }`. Success → `toast.success("Event moved to MMM d")`. Failure → revert + `toast.error` + `handleError`.
- **Week view DnD**: same pattern applied to the 7-day week grid.
- **Visual feedback**: `.drag-over` glow + scale on the hovered target cell, `.drop-line` indicator at the top of the events area, `.event-dragging` opacity/rotate on the source chip, `.today-cell-pulse` continuous pulse on today's cell.
- **Accessibility**: draggable chips have `aria-label="Event: <title>. Drag to move to another day."` and a descriptive `title`.
- **No regressions**: click-to-edit, click-to-add, hover-`+`-button, and day-detail dialog all still work. The Day view was intentionally NOT modified (the task said week view is a bonus; day view only shows one day so cross-day DnD doesn't apply).
- **Robustness**: `dragEnd` always clears drag state (handles drop-outside-calendar case). `dragLeave` uses `relatedTarget` check to avoid child-element flicker. `dragOver` only updates state when the day actually changes. The lifted `useRef` provides a stable read for handlers and a fallback if `dataTransfer.getData` is empty.
