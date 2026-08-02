"use client";

import Link from "next/link";
import { Instagram, Linkedin, Heart, Youtube } from "lucide-react";
import { Logo } from "./logo";

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

interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

const COLUMNS: FooterColumn[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Dashboard Preview", href: "/#dashboard-overview" },
      { label: "Study Radio", href: "/features#study-radio" },
    ],
  },
  {
    title: "Free Tools",
    links: [
      { label: "Pomodoro Timer", href: "/tools/pomodoro-timer" },
      { label: "CGPA Calculator", href: "/tools/cgpa-calculator" },
      { label: "Percentage Calculator", href: "/tools/percentage-calculator" },
      { label: "Age Calculator", href: "/tools/age-calculator" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog & Articles", href: "/blog" },
      { label: "Productivity Tips", href: "/#productivity-tips" },
      { label: "FAQ Center", href: "/faq" },
    ],
  },
  {
    title: "Legal Policies",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookie-policy" },
    ],
  },
];

const SOCIALS = [
  {
    icon: Instagram,
    label: "Instagram",
    href: "https://www.instagram.com/studysparks.cloud/",
  },
  {
    icon: Youtube,
    label: "YouTube",
    href: "https://www.youtube.com/channel/UCpygC2ZTTUE8RKpt9SuA9Ow",
  },
  { icon: XIcon, label: "X", href: "https://x.com/Jayesho1" },
  {
    icon: Linkedin,
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/jayesh-malviya-b30229318/",
  },
];

export function Footer() {
  return (
    <footer className="relative mt-12 border-t border-violet-500/10 bg-background/60 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        {/* Top section: Brand + Columns */}
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-6">
          {/* Brand block — spans 2 columns on large screens */}
          <div className="col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A calm, beautifully crafted productivity workspace for students.
              Manage tasks, plan your calendar, track focus sessions, and view
              study analytics — all in one place.
            </p>
            {/* Socials */}
            <div className="mt-5 flex items-center gap-3">
              {SOCIALS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex size-9 items-center justify-center rounded-xl border border-violet-500/15 bg-background/60 text-muted-foreground transition-all hover:scale-105 hover:border-violet-500/40 hover:text-violet-600 dark:hover:text-violet-300"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation columns */}
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                {column.title}
              </h3>
              <ul className="mt-3 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-muted-foreground transition-colors hover:text-violet-600 dark:hover:text-violet-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-violet-500/10 pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Study Sparks. Crafted with{" "}
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
