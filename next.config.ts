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
  typescript: {
    ignoreBuildErrors: true,
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
