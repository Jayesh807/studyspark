"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

/** Applies the chosen accent color hue to the document root via CSS variable. */
export function AccentColorApplier() {
  const accentColor = useAppStore((s) => s.accentColor);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--accent-color",
      accentColor
    );
    // Also remap primary/ring to the chosen hue for a cohesive look
    const isDark = document.documentElement.classList.contains("dark");
    document.documentElement.style.setProperty(
      "--primary",
      isDark
        ? `oklch(0.68 0.19 ${accentColor})`
        : `oklch(0.55 0.21 ${accentColor})`
    );
    document.documentElement.style.setProperty(
      "--ring",
      isDark
        ? `oklch(0.68 0.19 ${accentColor})`
        : `oklch(0.55 0.21 ${accentColor})`
    );
    document.documentElement.style.setProperty(
      "--sidebar-primary",
      isDark
        ? `oklch(0.68 0.19 ${accentColor})`
        : `oklch(0.55 0.21 ${accentColor})`
    );
    document.documentElement.style.setProperty(
      "--chart-1",
      isDark
        ? `oklch(0.68 0.19 ${accentColor})`
        : `oklch(0.55 0.21 ${accentColor})`
    );
  }, [accentColor]);

  return null;
}
