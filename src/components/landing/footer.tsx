"use client";

import { Instagram, Linkedin, Heart } from "lucide-react";
import { Logo } from "./logo";
import { scrollToSection } from "./scroll-helpers";

interface FooterColumn {
  title: string;
  links: { label: string; id?: string; href?: string }[];
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      {...props}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const COLUMNS: FooterColumn[] = [];

const SOCIALS = [
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/studysparks.cloud/" },
  { icon: XIcon, label: "X", href: "https://x.com/Jayesho1" },
  { icon: Linkedin, label: "LinkedIn", href: "#" },
];

export function Footer() {
  return (
    <footer className="relative mt-12 border-t border-violet-500/10 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          {/* Brand block - Left Side */}
          <div className="flex-1">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              A calm, beautifully crafted workspace for students. Tasks,
              calendar, focus and analytics — all in one place.
            </p>
          </div>

          {/* Socials - Right Side */}
          <div className="flex items-center gap-3">
            {SOCIALS.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="flex size-10 items-center justify-center rounded-xl border border-violet-500/15 bg-background/60 text-muted-foreground transition-all hover:scale-105 hover:border-violet-500/40 hover:text-violet-600 dark:hover:text-violet-300"
              >
                <Icon className="size-5" />
              </a>
            ))}
          </div>
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
