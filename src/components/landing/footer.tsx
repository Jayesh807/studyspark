"use client";

import { Github, Twitter, Linkedin, Heart } from "lucide-react";
import { Logo } from "./logo";
import { scrollToSection } from "./scroll-helpers";

interface FooterColumn {
  title: string;
  links: { label: string; id?: string; href?: string }[];
}

const COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Features", id: "features" },
      { label: "Preview", id: "screenshots" },
      { label: "Pricing", id: "pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog" },
      { label: "Careers" },
      { label: "Contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation" },
      { label: "Help center" },
      { label: "Community" },
      { label: "Changelog" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy" },
      { label: "Terms" },
      { label: "Cookies" },
      { label: "Licenses" },
    ],
  },
];

const SOCIALS = [
  { icon: Github, label: "GitHub", href: "#" },
  { icon: Twitter, label: "Twitter", href: "#" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
];

export function Footer() {
  return (
    <footer className="relative mt-12 border-t border-violet-500/10 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
          {/* Brand block */}
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A calm, beautifully crafted workspace for students. Tasks,
              calendar, focus and analytics — all in one place.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {SOCIALS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-xl border border-violet-500/15 bg-background/60 text-muted-foreground transition-all hover:scale-105 hover:border-violet-500/40 hover:text-violet-600 dark:hover:text-violet-300"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.id ? (
                      <button
                        type="button"
                        onClick={() => scrollToSection(link.id!)}
                        className="text-sm text-muted-foreground transition-colors hover:text-violet-600 dark:hover:text-violet-300"
                      >
                        {link.label}
                      </button>
                    ) : (
                      <a
                        href={link.href ?? "#"}
                        className="text-sm text-muted-foreground transition-colors hover:text-violet-600 dark:hover:text-violet-300"
                      >
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-violet-500/10 pt-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} StudySpark. Crafted with{" "}
            <Heart className="inline size-3.5 fill-fuchsia-500 text-fuchsia-500" />
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Made for students, by students
          </p>
        </div>
      </div>
    </footer>
  );
}
