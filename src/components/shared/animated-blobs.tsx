/**
 * AnimatedBlobs — pure CSS animation, no Framer Motion.
 *
 * Why the change?
 * ───────────────
 * Previously each blob used framer-motion `animate` with `repeat: Infinity`,
 * which registers a JavaScript animation loop (via requestAnimationFrame) for
 * every blob — 3–4 perpetually running RAF callbacks.
 *
 * Now: blobs use the existing `blob` CSS class (`@keyframes blobFloat` already
 * defined in globals.css) plus `animation-delay` for variation. The browser
 * handles this entirely on the compositor thread — zero JS overhead.
 *
 * This eliminates continuous main-thread work during scrolling and reduces
 * Total Blocking Time (TBT) on the Lighthouse performance audit.
 */

interface AnimatedBlobsProps {
  variant?: "landing" | "dashboard";
}

export function AnimatedBlobs({ variant = "landing" }: AnimatedBlobsProps) {
  const colors =
    variant === "landing"
      ? [
          "from-violet-400/40 via-purple-400/30 to-fuchsia-400/20",
          "from-indigo-400/40 via-blue-400/30 to-cyan-400/20",
          "from-rose-400/30 via-pink-400/20 to-orange-300/20",
          "from-emerald-400/30 via-teal-400/20 to-cyan-400/20",
        ]
      : [
          "from-violet-500/20 via-purple-500/15 to-fuchsia-500/10",
          "from-indigo-500/20 via-blue-500/15 to-cyan-500/10",
          "from-rose-500/15 via-pink-500/10 to-orange-400/10",
        ];

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Blob 1 — default blob animation, no delay */}
      <div
        className={`absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br ${colors[0]} blur-3xl blob`}
        style={{ animationDuration: "22s" }}
      />
      {/* Blob 2 — offset delay for natural variation */}
      <div
        className={`absolute top-1/3 -right-40 h-[32rem] w-[32rem] rounded-full bg-gradient-to-br ${colors[1]} blur-3xl blob`}
        style={{ animationDuration: "26s", animationDelay: "-8s" }}
      />
      {/* Blob 3 */}
      <div
        className={`absolute -bottom-40 left-1/4 h-[26rem] w-[26rem] rounded-full bg-gradient-to-br ${colors[2]} blur-3xl blob`}
        style={{ animationDuration: "24s", animationDelay: "-14s" }}
      />
      {/* Blob 4 — landing only */}
      {variant === "landing" && (
        <div
          className={`absolute top-1/2 left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br ${colors[3]} blur-3xl blob`}
          style={{ animationDuration: "30s", animationDelay: "-5s" }}
        />
      )}
    </div>
  );
}
