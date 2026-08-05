import { MetadataRoute } from "next";
import { INDEXABLE_FEATURES } from "@/content/features";
import { GUIDE_CATEGORIES, REVIEWED_GUIDES } from "@/content/guides";
import { absoluteUrl } from "@/lib/seo/site";
import { sitemapEligible } from "@/lib/seo/route-policy";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    { path: "/", changeFrequency: "weekly" as const, priority: 1.0 },
    { path: "/features", changeFrequency: "monthly" as const, priority: 0.9 },
    { path: "/guides", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/about", changeFrequency: "yearly" as const, priority: 0.5 },
    { path: "/contact", changeFrequency: "yearly" as const, priority: 0.5 },
    { path: "/editorial-policy", changeFrequency: "yearly" as const, priority: 0.5 },
    { path: "/faq", changeFrequency: "monthly" as const, priority: 0.6 },
    { path: "/tools/cgpa-calculator", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/tools/percentage-calculator", changeFrequency: "monthly" as const, priority: 0.7 },
    { path: "/tools/age-calculator", changeFrequency: "monthly" as const, priority: 0.6 },
    { path: "/tools/pomodoro-timer", changeFrequency: "monthly" as const, priority: 0.8 },
    { path: "/tools/pdf-formatter", changeFrequency: "monthly" as const, priority: 0.8 },
  ];

  const staticPages: MetadataRoute.Sitemap = staticPaths
    .filter((entry) => sitemapEligible(entry.path))
    .map((entry) => ({
      url: absoluteUrl(entry.path),
      lastModified: new Date(),
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
    }));

  const featurePages: MetadataRoute.Sitemap = INDEXABLE_FEATURES.map((feature) => ({
    url: absoluteUrl(feature.path),
    lastModified: new Date(feature.updatedAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const categoryPages: MetadataRoute.Sitemap = GUIDE_CATEGORIES.map((category) => ({
    url: absoluteUrl(`/guides/category/${category.slug}`),
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const guidePages: MetadataRoute.Sitemap = REVIEWED_GUIDES.map((guide) => ({
    url: absoluteUrl(`/guides/${guide.slug}`),
    lastModified: new Date(guide.updatedAt),
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  return [...staticPages, ...featurePages, ...categoryPages, ...guidePages];
}
