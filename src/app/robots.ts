import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/login",
          "/signup",
          "/google-username",
          "/dashboard",
          "/api/",
          "/privacy-policy",
          "/terms",
          "/terms-and-conditions",
          "/cookie-policy",
          "/disclaimer",
        ],
      },
    ],
    sitemap: "https://studysparks.cloud/sitemap.xml",
  };
}
