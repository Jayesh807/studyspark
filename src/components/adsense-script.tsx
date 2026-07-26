"use client";

import Script from "next/script";
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
 * only on public content pages. Prevents the "ads on screens
 * without publisher content" policy violation.
 */
export function AdSenseScript() {
  const pathname = usePathname();

  const isBlocked = BLOCKED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
  );

  if (isBlocked) return null;

  return (
    <Script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7098669863322522"
      crossOrigin="anonymous"
      strategy="lazyOnload"
    />
  );
}
