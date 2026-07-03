"use client";

import confetti from "canvas-confetti";

/**
 * Fire a celebratory confetti burst from both sides of the screen.
 * Uses brand-aligned colors (violet, fuchsia, amber, emerald, cyan).
 */
export function celebrateBurst() {
  const colors = ["#8b5cf6", "#d946ef", "#f59e0b", "#10b981", "#06b6d4"];
  const defaults = { startVelocity: 35, spread: 70, ticks: 200, zIndex: 9999, colors };

  // Left side cannon
  confetti({
    ...defaults,
    particleCount: 80,
    origin: { x: 0.15, y: 0.6 },
    angle: 60,
  });
  // Right side cannon
  confetti({
    ...defaults,
    particleCount: 80,
    origin: { x: 0.85, y: 0.6 },
    angle: 120,
  });

  // Center sparkle burst 200ms later
  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 50,
      startVelocity: 25,
      spread: 360,
      origin: { x: 0.5, y: 0.45 },
      scalar: 0.85,
    });
  }, 200);
}

/**
 * A smaller, gentler confetti burst for milestone moments
 * (e.g., completing a task, finishing a focus session).
 */
export function celebrateMini() {
  const colors = ["#8b5cf6", "#d946ef", "#f59e0b"];
  confetti({
    particleCount: 35,
    startVelocity: 28,
    spread: 55,
    ticks: 150,
    origin: { x: 0.5, y: 0.5 },
    colors,
    scalar: 0.8,
    zIndex: 9999,
  });
}

/**
 * Trophy-themed celebration for major achievements (platinum/gold tier).
 * Fires three bursts in sequence with star-shaped particles.
 */
export function celebrateTrophy() {
  const colors = ["#fbbf24", "#f59e0b", "#fcd34d", "#8b5cf6", "#d946ef"];
  const star = confetti.shapeFromText({ text: "★", scalar: 8 });

  confetti({
    particleCount: 60,
    spread: 100,
    startVelocity: 45,
    origin: { x: 0.5, y: 0.4 },
    colors,
    shapes: [star],
    scalar: 8,
    zIndex: 9999,
  });

  setTimeout(() => {
    confetti({
      particleCount: 40,
      spread: 120,
      startVelocity: 35,
      origin: { x: 0.2, y: 0.55 },
      angle: 60,
      colors,
      zIndex: 9999,
    });
    confetti({
      particleCount: 40,
      spread: 120,
      startVelocity: 35,
      origin: { x: 0.8, y: 0.55 },
      angle: 120,
      colors,
      zIndex: 9999,
    });
  }, 250);
}
