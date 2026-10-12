import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "pdfkit",
    "pdf-parse",
    "pdfjs-dist",
    "@napi-rs/canvas",
    "@sparticuz/chromium",
    "puppeteer-core",
    "unpdf",
  ],
  // Allow Expo mobile app to connect via local IP. Add your LAN IP via NEXT_ALLOWED_DEV_ORIGINS
  // (comma-separated, e.g. "192.168.1.5,192.168.1.5:3000") instead of hard-coding it here.
  // @ts-ignore - Some Next versions don't have this fully typed yet
  allowedDevOrigins: [
    "localhost",
    "10.0.2.2",
    ...(process.env.NEXT_ALLOWED_DEV_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
    ];
  },
  reactStrictMode: false,
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
};

export default nextConfig;
