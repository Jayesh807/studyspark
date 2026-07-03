# Task r6-B — Pomodoro completion bell + cycle dots + sound toggle

**Agent:** full-stack-developer (pomodoro-sound)
**Files modified (ONLY these 2):**
- `src/lib/store.ts` (+5 lines: 102 → 107)
- `src/components/dashboard/pages/focus-timer.tsx` (+198 lines: 901 → 1099)

## What I added

### 1. Store (`src/lib/store.ts`)
- New persisted setting `soundEnabled: boolean` (default `true`), follows the exact same pattern as `notifications` / `reduceMotion`.
- New action `setSoundEnabled: (on: boolean) => void`.
- `soundEnabled` added to the `partialize` function so it survives reload via `localStorage["studyspark-storage"]`.

### 2. Focus timer (`src/components/dashboard/pages/focus-timer.tsx`)

**Sound utility (module-level, after imports):**
- `let audioCtx: AudioContext | null = null` — module-level cache.
- `getCtx()` — lazily creates/resumes an `AudioContext`; returns `null` on SSR or if Web Audio is unavailable; uses `(window as unknown as { webkitAudioContext?: typeof AudioContext })` cast (no `any`).
- `tone(freq, start, dur, ctx, type?)` — oscillator + gain node with exponential decay (0.18 peak → 0.001 over `dur`).
- `export function playBell(kind: "focus-end" | "break-end")` — focus-end = ascending C5/E5/G5 sine arpeggio (523.25/659.25/783.99 Hz at 0/0.12/0.24s); break-end = single 880 Hz A5 triangle chime (1.2s decay). Wrapped in try/catch — never throws.
- `export function playTestBell()` — calls `playBell("focus-end")`.

**Wired into completion:**
- In the completion `useEffect` (after capturing `finishedMode`), call `if (soundEnabled) playBell(finishedMode === "focus" ? "focus-end" : "break-end")` BEFORE the existing toast/API/auto-break logic.
- Added `soundEnabled` to the effect dep array: `[remaining, soundEnabled]`.
- All existing behavior (toast, setCompletedFocusCount, POST `/api/focus-session`, auto-break, loggedRef guard) preserved.

**Sound toggle button:**
- In the page header, next to the "X completed this sitting" badge — wrapped both in `<div className="flex items-center gap-2 self-start sm:self-end">`.
- `<Button variant="ghost" size="icon">` with `aria-label="Toggle sound effects"`, contextual `title`.
- Shows `Volume2` when on, `VolumeX` when off.
- On click: `setSoundEnabled(!soundEnabled)`; if turning ON, calls `playTestBell()` so user hears a sample immediately.

**Pomodoro cycle dots (4 dots below mode tabs):**
- 4 `.cycle-dot` spans in a row, colored with `style={{ color: modeCfg.accent }}`.
- State logic: `inCycle = completedFocusCount % 4`; `allComplete = inCycle === 0 && completedFocusCount > 0`.
  - `allComplete || i < inCycle` → `cycle-dot completed`
  - `i === inCycle && mode === "focus"` → `cycle-dot active`
  - else → `cycle-dot` (dim base)
- Helper text: "Pomodoro cycle · Long break after 4 focus sessions".
- `aria-label` describes the cycle position.

**Ambient glow on timer card:**
- Inside the main `GlassCard`, before the existing decorative orb, render a `pointer-events-none absolute inset-0` div when `mode !== "focus"`:
  - `mode === "short"` → `break-ambient` (cyan radial glow)
  - `mode === "long"` → `long-break-ambient` (rose radial glow)
- Focus mode → no ambient layer (orb is enough).

**Rotating break tip (bonus, in Wellness nudges card):**
- `BREAK_TIPS: string[]` — 5 tips (deep breaths, look far away, wrist stretch, sip water, relax shoulders).
- `tipIndex` state + `useEffect` with 8s `setInterval` rotating through tips — only when `mode !== "focus"`.
- Panel rendered only during breaks (wrapped in `<AnimatePresence>`), with violet→fuchsia gradient bg, "Break tip · rotating" header, 4 staggered `.sound-wave-bar` indicators (delays 0/150/300/450ms) colored with `modeCfg.accent`, and the current tip in a nested `<AnimatePresence mode="wait">` keyed by `tipIndex`.
- Tip `<p>` has `aria-live="polite"` for screen readers.
- All animations respect `reduceMotion`.

## Verification
- `bun run lint` → exit 0, 0 errors, 0 warnings.
- `bunx tsc --noEmit` (filtered to my files) → 0 errors in `focus-timer.tsx` and `store.ts`.
- `dev.log` tail → clean compilation, `GET /api/focus-session 200`, no errors.

## Notes for other agents
- `playBell` and `playTestBell` are exported from `focus-timer.tsx`. If the settings agent (r6 settings owner) wants to add a "test sound" button in settings.tsx, they can `import { playTestBell } from "@/components/dashboard/pages/focus-timer"` — but they should NOT do this if it creates a circular import or violates their file scope. The functions are also reusable for any other feature that wants a pleasant notification chime.
- `soundEnabled` is now in the store and persisted — the settings agent can add a Switch for it in the settings page using `useAppStore((s) => s.soundEnabled)` and `useAppStore((s) => s.setSoundEnabled)` if they want, mirroring the `notifications` / `reduceMotion` pattern.
