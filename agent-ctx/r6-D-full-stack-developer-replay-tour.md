# Task r6-D — "Replay tour" button in Settings

**Agent:** full-stack-developer (replay-tour)
**Task ID:** r6-D
**Scope:** Add a "Replay onboarding tour" button in Settings → Preferences that re-opens the 5-step OnboardingTour from step 1, without breaking the existing auto-open-on-first-visit behavior.

## Files modified (only these 2)
1. `src/components/dashboard/onboarding-tour.tsx` (+38 lines: 24 module-level + 15 useEffect)
2. `src/components/dashboard/pages/settings.tsx` (+~50 lines: 3 imports, 1 ActionRow component, 1 row usage)

## Design decisions

### Why a module-level event emitter (not Zustand)?
The task spec explicitly forbade touching `src/lib/store.ts` because Subagent B is editing it concurrently. A module-level `Set<TourListener>` inside `onboarding-tour.tsx` is the lightest decoupling — `replayTour()` is the public entry point, and the component subscribes on mount. No shared mutable state, no prop drilling, no store contention.

### Replay behavior
- `replayTour()` invokes all registered listeners.
- The listener (registered inside `OnboardingTour` via `useEffect`) sets `stepIdx=0`, clears `targetRect`, and sets `open=true`.
- **localStorage is intentionally NOT touched** on replay — the tour was already "completed" once; replay is just a refresher. The auto-open-on-first-visit `useEffect` (which checks `studyspark:onboarding-completed-v1`) remains completely untouched and still fires on first-ever mount.

### Memory leak safety
- The listener is added in a `useEffect` with `[]` deps and removed in the cleanup function (`tourListeners.delete(handleReplay)`). No leak across re-mounts.
- `replayTour()` iterates with `Set.forEach`, which iterates over the original insertion order snapshot — safe even if a listener unsubscribes mid-dispatch.

### Settings UI
- Added a new `ActionRow` sub-component (modeled on the existing `SwitchRow`) that takes arbitrary `children` for the right-side control instead of a `<Switch>`.
- New row placed in the Preferences `<SettingsSection>` AFTER "Default Sidebar Collapsed", separated by a `<Separator />`.
- Row icon: `GraduationCap` (lucide-react) — thematic for "onboarding/learning".
- Button: `<Button variant="outline" size="sm">` with text "Replay tour" and a `RotateCcw` icon.
- On click: calls `replayTour()` then `toast.success("Replaying tour...")`.
- Hover state: subtle violet tint (`hover:border-violet-500/40 hover:bg-violet-500/5 hover:text-violet-600 dark:hover:text-violet-300`) — matches the app's violet accent without using indigo/blue.

## Verification
- `bun run lint` → **0 errors, 0 warnings** (exit 0).
- `bunx tsc --noEmit` → 22 pre-existing errors across OTHER files (command-palette, dashboard-home, profile, examples, skills) plus 5 pre-existing errors in settings.tsx (StaggerItem `delay` prop at L121, and missing `Todo`/`Subject`/`Exam`/`Event` types in `ResetDataDialog` at L386/387/389/404). **ZERO new errors** from my changes — the new `ActionRow` component (L330-355) and the new row usage (L806-823) do not appear in the error list. The r6-A agent's worklog confirmed the 22-error baseline.
- Dev server log: clean compile, no errors related to onboarding-tour or settings.

## Auto-open-on-first-visit still works
The first `useEffect` (lines 118-130) that reads `localStorage["studyspark:onboarding-completed-v1"]` and opens after 800ms is **untouched**. The new listener `useEffect` (lines 132-146) is purely ADDITIONAL — it only fires when `replayTour()` is called externally.
