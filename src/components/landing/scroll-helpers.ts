/**
 * Smoothly scroll to a section by id.
 * Falls back gracefully if the element is not found.
 */
export function scrollToSection(id: string): void {
  if (typeof document === "undefined") return;
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
