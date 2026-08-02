"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Blocked routes where AdSense should NOT load:
 *  - Auth pages (no publisher content)
 *  - Dashboard (behind auth wall)
 *  - Legal pages (policy content)
 */
const BLOCKED_PREFIXES = [
  "/login",
  "/signup",
  "/dashboard",
  "/privacy-policy",
  "/terms",
  "/cookie-policy",
];

/**
 * AdSenseScript — conditionally loads the Google AdSense script
 * only on public content pages via standard DOM injection to avoid
 * the Next.js 'data-nscript' console warning.
 */
export function AdSenseScript() {
  const pathname = usePathname();

  const isBlocked = BLOCKED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );

  useEffect(() => {
    if (isBlocked) return;
    const existing = document.querySelector(`script[src*="adsbygoogle.js"]`);
    if (!existing) {
      const script = document.createElement("script");
      script.src =
        "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7098669863322522";
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }
  }, [isBlocked]);

  return null;
}
