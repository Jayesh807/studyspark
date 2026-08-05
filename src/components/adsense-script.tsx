"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { isAdScriptAllowed } from "@/lib/seo/route-policy";

/**
 * Loads the AdSense verification script only on eligible public pages.
 * Visible ad units stay disabled until a post-approval placement plan exists.
 */
export function AdSenseScript() {
  const pathname = usePathname();
  const isAuthenticated = useAppStore((state) => state.isAuthenticated);
  const currentView = useAppStore((state) => state.currentView);

  const isPrivateAppState =
    isAuthenticated && currentView !== "landing" && currentView !== "login" && currentView !== "signup";
  const canLoadScript = isAdScriptAllowed(pathname, isPrivateAppState);

  useEffect(() => {
    if (!canLoadScript) return;
    const existing = document.querySelector(`script[src*="adsbygoogle.js"]`);
    if (!existing) {
      const script = document.createElement("script");
      script.src =
        "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7098669863322522";
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }
  }, [canLoadScript]);

  return null;
}
