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
  // Allow Expo mobile app to connect via local IP
  // @ts-ignore - Some Next versions don't have this fully typed yet
  allowedDevOrigins: ["192.168.1.5", "192.168.1.5:3000", "localhost", "10.0.2.2"],
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
