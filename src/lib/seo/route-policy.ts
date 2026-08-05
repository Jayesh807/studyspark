export type RouteKind =
  | "public-content"
  | "public-tool"
  | "substantive-trust"
  | "compliance-utility"
  | "auth"
  | "private"
  | "api"
  | "draft"
  | "error"
  | "temporary";

export interface RoutePolicy {
  path: string;
  kind: RouteKind;
  indexable: boolean;
  includeInSitemap: boolean;
  canLoadAdVerificationScript: boolean;
  canShowVisibleAds: boolean;
}

const POLICIES: RoutePolicy[] = [
  policy("/", "public-content", true, true, true),
  policy("/features", "public-content", true, true, true),
  policy("/guides", "public-content", true, true, true),
  policy("/about", "substantive-trust", true, true, true),
  policy("/contact", "substantive-trust", true, true, false),
  policy("/editorial-policy", "substantive-trust", true, true, true),
  policy("/faq", "public-content", true, true, true),
  policy("/tools", "public-tool", true, false, true),
  policy("/privacy-policy", "compliance-utility", false, false, false),
  policy("/terms", "compliance-utility", false, false, false),
  policy("/terms-and-conditions", "compliance-utility", false, false, false),
  policy("/cookie-policy", "compliance-utility", false, false, false),
  policy("/disclaimer", "compliance-utility", false, false, false),
  policy("/login", "auth", false, false, false),
  policy("/signup", "auth", false, false, false),
  policy("/google-username", "auth", false, false, false),
  policy("/dashboard", "private", false, false, false),
  policy("/api", "api", false, false, false),
];

function policy(
  path: string,
  kind: RouteKind,
  indexable: boolean,
  includeInSitemap: boolean,
  canLoadAdVerificationScript: boolean,
): RoutePolicy {
  return {
    path,
    kind,
    indexable,
    includeInSitemap,
    canLoadAdVerificationScript,
    canShowVisibleAds: false,
  };
}

export function getRoutePolicy(pathname: string): RoutePolicy {
  const normalized = normalizePath(pathname);
  const exact = POLICIES.find((entry) => entry.path === normalized);
  if (exact) return exact;

  if (normalized.startsWith("/api/")) return policy("/api", "api", false, false, false);
  if (normalized.startsWith("/dashboard/")) return policy("/dashboard", "private", false, false, false);
  if (normalized.startsWith("/guides/")) return policy("/guides", "public-content", true, true, true);
  if (normalized.startsWith("/features/")) return policy("/features", "public-content", true, true, true);
  if (normalized.startsWith("/tools/")) return policy("/tools", "public-tool", true, true, true);
  if (normalized.startsWith("/blog/")) return policy("/blog", "public-content", true, false, true);

  return policy(normalized, "public-content", true, true, true);
}

export function isAdScriptAllowed(pathname: string, isPrivateAppState = false) {
  if (isPrivateAppState) return false;
  return getRoutePolicy(pathname).canLoadAdVerificationScript;
}

export function isVisibleAdAllowed() {
  return false;
}

export function sitemapEligible(pathname: string) {
  return getRoutePolicy(pathname).includeInSitemap;
}

function normalizePath(pathname: string) {
  if (!pathname) return "/";
  const withoutQuery = pathname.split(/[?#]/)[0] || "/";
  if (withoutQuery !== "/" && withoutQuery.endsWith("/")) {
    return withoutQuery.slice(0, -1);
  }
  return withoutQuery;
}

