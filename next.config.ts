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
};

export default nextConfig;
