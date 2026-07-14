"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "studyspark:pwa-install-dismissed-at";
const INSTALLED_KEY = "studyspark:pwa-installed";
export const PWA_INSTALL_REQUEST_EVENT = "studyspark:request-pwa-install";
const DISMISS_DAYS = 7;

function isStandalone() {
  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

function isDismissedRecently() {
  const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY) || 0);
  if (!dismissedAt) return false;

  const dismissWindow = DISMISS_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() - dismissedAt < dismissWindow;
}

function isIosSafari() {
  const ua = window.navigator.userAgent.toLowerCase();
  const isIos = /iphone|ipad|ipod/.test(ua);
  const isWebKit = /webkit/.test(ua);
  const isExcludedBrowser = /crios|fxios|edgios/.test(ua);

  return isIos && isWebKit && !isExcludedBrowser;
}

function isMobileViewport() {
  return window.matchMedia("(max-width: 768px)").matches;
}

export function PwaInstallPrompt() {
  const currentView = useAppStore((s) => s.currentView);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  const shouldRender = showPrompt || showIosGuide;

  const copy = useMemo(() => {
    if (showIosGuide) {
      return {
        title: "Add StudySpark to your Home Screen",
        body: "Tap Share, then choose Add to Home Screen.",
        action: "Got it",
      };
    }

    return {
      title: "Install StudySpark",
      body: "Open your study dashboard faster from your phone.",
      action: "Install",
    };
  }, [showIosGuide]);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      console.warn("StudySpark service worker registration failed.");
    });
  }, []);

  useEffect(() => {
    let timerId: number | undefined;

    if (typeof window !== "undefined" && currentView !== "landing") {
      timerId = window.setTimeout(() => {
        setShowPrompt(false);
        setShowIosGuide(false);
      }, 0);
      return () => window.clearTimeout(timerId);
    }

    if (
      typeof window === "undefined" ||
      isStandalone() ||
      isDismissedRecently() ||
      window.localStorage.getItem(INSTALLED_KEY) === "true"
    ) {
      return;
    }

    timerId = window.setTimeout(() => {
      if (isIosSafari() && isMobileViewport()) {
        setShowIosGuide(true);
        setShowPrompt(false);
        return;
      }

      setShowPrompt(true);
      setShowIosGuide(false);
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [currentView]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      isStandalone() ||
      isDismissedRecently() ||
      window.localStorage.getItem(INSTALLED_KEY) === "true"
    ) {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);

      if (currentView === "landing" && !isStandalone() && !isDismissedRecently()) {
        setShowPrompt(true);
        setShowIosGuide(false);
      }
    };

    const handleAppInstalled = () => {
      window.localStorage.setItem(INSTALLED_KEY, "true");
      setShowPrompt(false);
      setShowIosGuide(false);
      setInstallPrompt(null);
      toast.success("StudySpark installed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [currentView]);

  useEffect(() => {
    if (typeof window === "undefined" || isStandalone()) {
      return;
    }

    const handleInstallRequest = () => {
      if (isStandalone()) {
        toast.info("StudySpark is already installed.");
        return;
      }

      window.localStorage.removeItem(DISMISS_KEY);

      if (isIosSafari() && isMobileViewport()) {
        setShowIosGuide(true);
        setShowPrompt(false);
        return;
      }

      if (installPrompt) {
        setShowPrompt(true);
        setShowIosGuide(false);
        return;
      }

      toast.info("Use your browser menu and choose Install app or Add to Home screen.");
    };

    window.addEventListener(PWA_INSTALL_REQUEST_EVENT, handleInstallRequest);

    return () => {
      window.removeEventListener(PWA_INSTALL_REQUEST_EVENT, handleInstallRequest);
    };
  }, [installPrompt]);

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShowPrompt(false);
    setShowIosGuide(false);
  };

  const install = async () => {
    if (showIosGuide) {
      dismiss();
      return;
    }

    if (!installPrompt) {
      toast.info("Install is not available in this browser yet.");
      dismiss();
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      window.localStorage.setItem(INSTALLED_KEY, "true");
      toast.success("StudySpark installed");
    } else {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    }

    setInstallPrompt(null);
    setShowPrompt(false);
  };

  if (!shouldRender) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[120] mx-auto max-w-md rounded-lg border border-border bg-background/95 p-3 text-foreground shadow-2xl backdrop-blur md:bottom-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Smartphone className="size-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-5">{copy.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                {copy.body}
              </p>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="-mr-2 -mt-2 size-8 shrink-0"
              onClick={dismiss}
              aria-label="Dismiss install prompt"
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="mt-3 flex gap-2">
            <Button type="button" size="sm" onClick={install}>
              {showIosGuide ? (
                <Share className="size-4" aria-hidden="true" />
              ) : (
                <Download className="size-4" aria-hidden="true" />
              )}
              {copy.action}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={dismiss}>
              Not now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
