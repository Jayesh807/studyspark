import type { NextConfig } from "next";

// On Netlify, the @netlify/plugin-nextjs plugin handles the build output itself,
// so we must NOT use `output: "standalone"` (that mode is for Docker/VPS only
// and causes "Page Not Found" on Netlify because the plugin can't find the
// expected .next directory layout).
const isNetlify = Boolean(process.env.NETLIFY);

const nextConfig: NextConfig = {
  output: isNetlify ? undefined : "standalone",

  typescript: {
    ignoreBuildErrors: true,
  },

  reactStrictMode: false,

  /**
   * optimizePackageImports — Tree-shaking for large icon/animation libraries.
   *
   * Without this, Next.js bundles the ENTIRE lucide-react package (~525 icons)
   * even if only 20 are used. This flag tells Next.js to analyze each import
   * and only include the specific exports that are actually referenced.
   *
   * lucide-react: Reduces the icon bundle from ~500KB to only icons used.
   * framer-motion: Enables per-feature tree-shaking.
   *
   * Lighthouse benefit: Reduces "Reduce unused JavaScript" warning significantly.
   */
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@radix-ui/react-accordion",
      "@radix-ui/react-alert-dialog",
      "@radix-ui/react-avatar",
      "@radix-ui/react-checkbox",
      "@radix-ui/react-collapsible",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-select",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-tooltip",
      "date-fns",
    ],
  },

  /**
   * Image optimization — serve AVIF and WebP formats.
   * AVIF is ~50% smaller than WebP, ~80% smaller than PNG.
   * Next.js will automatically negotiate the best format with the browser.
   *
   * Lighthouse benefit: "Serve images in next-gen formats" warning resolved.
   */
  images: {
    formats: ["image/avif", "image/webp"],
  },

  /**
   * compiler.removeConsole — strip console.* calls in production builds.
   * Prevents leaking debug information and reduces bundle size slightly.
   */
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
};

export default nextConfig;
