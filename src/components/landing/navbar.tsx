"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, LazyMotion, domAnimation } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  ArrowRight,
  ChevronDown,
  Calculator,
  Percent,
  Calendar,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppStore } from "@/lib/store";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

const TOOLS = [
  {
    name: "Pomodoro Timer",
    description: "Focus timer for study sessions",
    href: "/tools/pomodoro-timer",
    icon: Timer,
  },
  {
    name: "CGPA Calculator",
    description: "Calculate GPA & CGPA online",
    href: "/tools/cgpa-calculator",
    icon: Calculator,
  },
  {
    name: "Percentage Calculator",
    description: "Marks & grade percentages",
    href: "/tools/percentage-calculator",
    icon: Percent,
  },
  {
    name: "Age Calculator",
    description: "Calculate exact age in days/hours",
    href: "/tools/age-calculator",
    icon: Calendar,
  },
];

export function Navbar() {
  const setView = useAppStore((s) => s.setView);
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goHome = () => {
    setOpen(false);
    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    router.push("/");
  };

  const openAuth = (view: "login" | "signup") => {
    setOpen(false);
    setView(view);
  };

  return (
    <LazyMotion features={domAnimation}>
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3 sm:pt-4"
      >
        <nav
          className={cn(
            "flex w-full max-w-6xl items-center justify-between gap-4 rounded-2xl px-3 py-2.5 transition-all duration-300 sm:px-4",
            scrolled
              ? "glass-strong shadow-lg shadow-violet-500/5"
              : "glass border-transparent"
          )}
          aria-label="Primary"
        >
          <Logo onClick={goHome} />

          {/* Desktop Navigation Links */}
          <ul className="hidden items-center gap-1 md:flex">
            <li>
              <Link
                href="/features"
                className={cn(
                  "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors hover:bg-violet-500/10 hover:text-foreground inline-block",
                  pathname === "/features" ? "text-foreground font-semibold bg-violet-500/10" : "text-muted-foreground"
                )}
              >
                Features
              </Link>
            </li>

            {/* Tools Dropdown */}
            <li>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors hover:bg-violet-500/10 hover:text-foreground",
                      pathname.startsWith("/tools") ? "text-foreground font-semibold bg-violet-500/10" : "text-muted-foreground"
                    )}
                  >
                    Free Tools
                    <ChevronDown className="size-3.5 opacity-70" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64 rounded-2xl p-2 border-violet-500/15 glass-strong shadow-xl">
                  {TOOLS.map((tool) => (
                    <DropdownMenuItem
                      key={tool.name}
                      asChild
                      className="rounded-xl cursor-pointer hover:bg-violet-500/10 p-0"
                    >
                      <Link
                        href={tool.href}
                        className="flex items-start gap-3 p-2.5 w-full"
                      >
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-300">
                          <tool.icon className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">{tool.name}</p>
                          <p className="text-[10px] text-muted-foreground">{tool.description}</p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </li>

            <li>
              <Link
                href="/guides"
                className={cn(
                  "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors hover:bg-violet-500/10 hover:text-foreground inline-block",
                  pathname.startsWith("/guides") ? "text-foreground font-semibold bg-violet-500/10" : "text-muted-foreground"
                )}
              >
                Study Guides
              </Link>
            </li>

            <li>
              <Link
                href="/about"
                className={cn(
                  "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors hover:bg-violet-500/10 hover:text-foreground inline-block",
                  pathname === "/about" ? "text-foreground font-semibold bg-violet-500/10" : "text-muted-foreground"
                )}
              >
                About
              </Link>
            </li>

            <li>
              <Link
                href="/contact"
                className={cn(
                  "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors hover:bg-violet-500/10 hover:text-foreground inline-block",
                  pathname === "/contact" ? "text-foreground font-semibold bg-violet-500/10" : "text-muted-foreground"
                )}
              >
                Contact
              </Link>
            </li>
          </ul>

          {/* Desktop Auth Buttons */}
          <div className="hidden items-center gap-2 md:flex">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="font-medium text-xs rounded-xl"
            >
              <Link href="/login" onClick={() => openAuth("login")}>
                Login
              </Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-xs font-semibold shadow-md shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/40 hover:brightness-110 rounded-xl"
            >
              <Link href="/signup" onClick={() => openAuth("signup")}>
                Get Started
                <ArrowRight className="size-3.5 ml-1" />
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Trigger & Content */}
          {mounted && (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-80 border-violet-500/10 bg-background/95 backdrop-blur-xl flex flex-col justify-between"
              >
                <div>
                  <SheetTitle className="px-2 pt-2">
                    <Logo onClick={goHome} />
                  </SheetTitle>
                  <div className="flex flex-col gap-1 px-2 pt-6">
                    <Link
                      href="/features"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-violet-500/10"
                    >
                      Features
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </Link>

                    <Link
                      href="/guides"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-violet-500/10"
                    >
                      Study Guides
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </Link>

                    <Link
                      href="/about"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-violet-500/10"
                    >
                      About
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </Link>

                    <Link
                      href="/contact"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-violet-500/10"
                    >
                      Contact
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </Link>

                    {/* Mobile Tools Subsection */}
                    <div className="my-2 border-y border-violet-500/10 py-2">
                      <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                        Free Student Tools
                      </p>
                      {TOOLS.map((t) => (
                        <Link
                          key={t.href}
                          href={t.href}
                          onClick={() => setOpen(false)}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:text-foreground transition-colors hover:bg-violet-500/10"
                        >
                          <span className="flex items-center gap-2">
                            <t.icon className="size-3.5 text-violet-500" />
                            {t.name}
                          </span>
                          <ArrowRight className="size-3 text-muted-foreground" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 border-t border-violet-500/10 p-4">
                  <SheetClose asChild>
                    <Button
                      variant="outline"
                      asChild
                      className="w-full rounded-xl"
                    >
                      <Link href="/login" onClick={() => openAuth("login")}>
                        Login
                      </Link>
                    </Button>
                  </SheetClose>
                  <SheetClose asChild>
                    <Button
                      asChild
                      className="w-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/25 hover:brightness-110 rounded-xl"
                    >
                      <Link href="/signup" onClick={() => openAuth("signup")}>
                        Get Started
                        <ArrowRight className="size-4 ml-1" />
                      </Link>
                    </Button>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </nav>
      </motion.header>
    </LazyMotion>
  );
}
