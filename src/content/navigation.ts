import { INDEXABLE_FEATURES } from "./features";
import { REVIEWED_GUIDES } from "./guides";

export const PRIMARY_NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Study Guides", href: "/guides" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export const FOOTER_LINK_GROUPS = [
  {
    title: "Features",
    links: INDEXABLE_FEATURES.map((feature) => ({
      label: feature.shortTitle,
      href: feature.path,
    })),
  },
  {
    title: "Popular Guides",
    links: REVIEWED_GUIDES.slice(0, 5).map((guide) => ({
      label: guide.title,
      href: `/guides/${guide.slug}`,
    })),
  },
  {
    title: "Trust",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Editorial Policy", href: "/editorial-policy" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms and Conditions", href: "/terms-and-conditions" },
      { label: "Cookie Policy", href: "/cookie-policy" },
      { label: "Disclaimer", href: "/disclaimer" },
    ],
  },
];

