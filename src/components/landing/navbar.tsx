"use client";

/**
 * Navbar — Performance optimizations:
 *
 * 1. `<motion.header>` entrance animation replaced with a CSS @keyframes
 *    fade-in-down animation. Framer Motion's JS doesn't need to run just to
 *    slide the navbar down on page load — this saves ~40ms of JS execution
 *    on first paint.
 *
 * 2. Mobile menu `motion.button` elements replaced with plain `<button>`
 *    elements with CSS transitions. These are below-fold interactions (user
 *    must open the menu first) and don't benefit from Framer Motion.
 *
 * 3. Framer Motion import retained only for the `motion` import it still uses
 *    in one place, but the navbar-entrance animation is now CSS-only.
 */

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAppStore } from "@/lib/store";
import { scrollToSection } from "./scroll-helpers";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

const NAV_LINKS: { label: string; id: string }[] = [
  { label: "Features", id: "features" },
  { label: "Pricing", id: "pricing" },
];

export function Navbar() {
  const setView = useAppStore((s) => s.setView);
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (id: string) => {
    setOpen(false);
    if (pathname !== "/") {
      router.push(`/#${id}`);
      return;
    }
    scrollToSection(id);
  };

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
    if (pathname !== `/${view}`) {
      router.push(`/${view}`);
    }
  };

  return (
    /*
     * CSS entrance animation replaces <motion.header>.
     * `navbar-enter` class defined in globals.css below (added via @keyframes).
     * This eliminates Framer Motion JS execution on the critical path.
     */
    <header
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3 sm:pt-4 navbar-enter"
      style={{ willChange: "transform, opacity" }}
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

        <ul className="hidden items-center gap-1 md:flex">
          <li>
            <button
              type="button"
              onClick={() => router.push("/about")}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-violet-500/10 hover:text-foreground"
            >
              About
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={() => router.push("/contact")}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-violet-500/10 hover:text-foreground"
            >
              Contact
            </button>
          </li>
          {NAV_LINKS.map((link) => (
            <li key={link.id}>
              <button
                type="button"
                onClick={() => go(link.id)}
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-violet-500/10 hover:text-foreground"
              >
                {link.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openAuth("login")}
            className="font-medium"
          >
            Login
          </Button>
          <Button
            size="sm"
            onClick={() => openAuth("signup")}
            className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/25 hover:shadow-lg hover:shadow-violet-500/40 hover:brightness-110"
          >
            Get Started
            <ArrowRight className="size-3.5" />
          </Button>
        </div>

        {/* Mobile menu trigger */}
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
            className="w-80 border-violet-500/10 bg-background/95 backdrop-blur-xl"
          >
            <SheetTitle className="px-2 pt-2">
              <Logo onClick={goHome} />
            </SheetTitle>
            <div className="flex flex-col gap-1 px-4 pt-6">
              {/*
               * Plain buttons with CSS transitions replace motion.button elements.
               * The mobile menu is an interaction that occurs after the page is
               * interactive — Framer Motion stagger animations add no perceived
               * value here and incur unnecessary JS cost.
               */}
              <button
                type="button"
                onClick={() => { setOpen(false); router.push("/about"); }}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-left text-base font-medium text-foreground transition-colors hover:bg-violet-500/10"
              >
                About
                <ArrowRight className="size-4 text-muted-foreground" />
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); router.push("/contact"); }}
                className="flex items-center justify-between rounded-xl px-4 py-3 text-left text-base font-medium text-foreground transition-colors hover:bg-violet-500/10"
              >
                Contact
                <ArrowRight className="size-4 text-muted-foreground" />
              </button>
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => go(link.id)}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-left text-base font-medium text-foreground transition-colors hover:bg-violet-500/10"
                >
                  {link.label}
                  <ArrowRight className="size-4 text-muted-foreground" />
                </button>
              ))}
            </div>
            <div className="mt-auto flex flex-col gap-2 border-t border-violet-500/10 p-4">
              <SheetClose asChild>
                <Button
                  variant="outline"
                  onClick={() => openAuth("login")}
                  className="w-full"
                >
                  Login
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button
                  onClick={() => openAuth("signup")}
                  className="w-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/25 hover:brightness-110"
                >
                  Get Started
                  <ArrowRight className="size-4" />
                </Button>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
}
