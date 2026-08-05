import type { Metadata } from "next";
import { absoluteUrl, SITE_DESCRIPTION, SITE_DISPLAY_NAME, SITE_NAME } from "./site";

interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  index?: boolean;
  type?: "website" | "article";
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
}

export function createPageMetadata({
  title,
  description,
  path,
  index = true,
  type = "website",
  image = "/og-image.png",
  publishedTime,
  modifiedTime,
  authors,
}: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const imageUrl = absoluteUrl(image);

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    robots: {
      index,
      follow: index,
      googleBot: {
        index,
        follow: index,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type,
      publishedTime,
      modifiedTime,
      authors,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${SITE_DISPLAY_NAME} preview`,
        },
      ],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export function createDefaultMetadata(): Metadata {
  return createPageMetadata({
    title: `${SITE_DISPLAY_NAME} - Student Productivity Platform`,
    description: SITE_DESCRIPTION,
    path: "/",
  });
}

