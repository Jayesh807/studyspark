import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/login", "/signup", "/dashboard", "/api/"],
      },
    ],
    sitemap: "https://studysparks.cloud/sitemap.xml",
  };
}