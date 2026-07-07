"use client";

/**
 * ClientRouterLoader — a minimal "use client" wrapper whose only job is to
 * dynamically import the ClientRouter with `ssr: false`.
 *
 * Why this indirection?
 * ─────────────────────
 * Next.js 16 (Turbopack) does NOT allow `next/dynamic` with `ssr: false`
 * inside a Server Component. The dynamic import with ssr:false must live
 * inside a Client Component boundary. This thin wrapper provides that boundary
 * while keeping `page.tsx` itself a Server Component.
 *
 * The `loading: () => null` ensures no placeholder is shown — the landing page
 * is already visible as static HTML underneath.
 */

import dynamic from "next/dynamic";

const ClientRouter = dynamic(() => import("@/components/client-router"), {
  ssr: false,
  loading: () => null,
});

export function ClientRouterLoader() {
  return <ClientRouter />;
}
