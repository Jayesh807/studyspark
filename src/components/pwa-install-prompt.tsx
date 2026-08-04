"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Download, Plus, Share, Smartphone, X } from "lucide-react";
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

function isIosDevice() {
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
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

// ─── iOS Step-by-Step Guide Modal ─────────────────────────────────────────────
function IosInstallGuide({ onDismiss }: { onDismiss: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: <Share className="size-6 text-blue-500" />,
      title: "Tap the Share button",
      description: "Find the Share icon at the bottom of Safari's toolbar",
      visual: (
        <div className="mx-auto mt-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 ring-2 ring-blue-500/30 animate-bounce">
          <Share className="size-6 text-blue-500" />
        </div>
      ),
    },
    {
      icon: <Plus className="size-6 text-emerald-500" />,
      title: "Tap 'Add to Home Screen'",
      description: "Scroll down in the share menu and tap the 'Add to Home Screen' option",
      visual: (
        <div className="mx-auto mt-3 flex items-center gap-3 rounded-xl bg-muted/60 px-4 py-3 text-sm font-medium border border-border/60">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
            <Plus className="size-4 text-emerald-500" />
          </div>
          <span>Add to Home Screen</span>
          <ChevronRight className="ml-auto size-4 text-muted-foreground" />
        </div>
      ),
    },
    {
      icon: <Download className="size-6 text-violet-500" />,
      title: "Tap 'Add' to confirm",
      description: "Tap the 'Add' button in the top-right corner to install StudySpark",
      visual: (
        <div className="mx-auto mt-3 flex items-center justify-end gap-2">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
            Cancel
          </Button>
          <Button size="sm" className="bg-blue-500 text-white text-xs hover:bg-blue-600 animate-pulse">
            Add
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onDismiss}
      />

      {/* Modal */}
      <div className="relative z-10 mx-3 mb-3 w-full max-w-sm animate-in slide-in-from-bottom-4 duration-300 rounded-2xl border border-border/70 bg-background p-5 shadow-2xl sm:mb-0">
        {/* Close button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 size-8"
          onClick={onDismiss}
          aria-label="Close install guide"
        >
          <X className="size-4" />
        </Button>

        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-lg shadow-violet-500/25">
            <Smartphone className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold">Install StudySpark</h3>
            <p className="text-xs text-muted-foreground">Add to your iPhone Home Screen</p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="mb-4 flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= currentStep
                  ? "bg-gradient-to-r from-violet-500 to-blue-500"
                  : "bg-muted"
                }`}
            />
          ))}
        </div>

        {/* Current step */}
        <div className="min-h-[140px]">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {currentStep + 1}
            </span>
            <h4 className="text-sm font-semibold">{steps[currentStep].title}</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed pl-8">
            {steps[currentStep].description}
          </p>
          <div className="mt-2 pl-8">
            {steps[currentStep].visual}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-4 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={onDismiss}
          >
            Maybe later
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Back
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button
                type="button"
                size="sm"
                className="bg-gradient-to-r from-violet-500 to-blue-500 text-white text-xs"
                onClick={() => setCurrentStep(currentStep + 1)}
              >
                Next Step
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs"
                onClick={onDismiss}
              >
                Got it!
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Android / Generic Fallback Guide ─────────────────────────────────────────
function AndroidFallbackGuide({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 z-[130] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onDismiss}
      />
      <div className="relative z-10 mx-3 mb-3 w-full max-w-sm animate-in slide-in-from-bottom-4 duration-300 rounded-2xl border border-border/70 bg-background p-5 shadow-2xl sm:mb-0">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-2 top-2 size-8"
          onClick={onDismiss}
          aria-label="Close install guide"
        >
          <X className="size-4" />
        </Button>

        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-lg shadow-violet-500/25">
            <Download className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-bold">Install StudySpark</h3>
            <p className="text-xs text-muted-foreground">Quick access from your home screen</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3 border border-border/50">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-500 mt-0.5">1</span>
            <div>
              <p className="text-sm font-medium">Open browser menu</p>
              <p className="text-xs text-muted-foreground">Tap the ⋮ (3 dots) icon in the top-right corner of your browser</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3 border border-border/50">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-xs font-bold text-emerald-500 mt-0.5">2</span>
            <div>
              <p className="text-sm font-medium">Tap &ldquo;Install app&rdquo; or &ldquo;Add to Home screen&rdquo;</p>
              <p className="text-xs text-muted-foreground">Look for the install option in the menu</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-muted/40 p-3 border border-border/50">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-xs font-bold text-violet-500 mt-0.5">3</span>
            <div>
              <p className="text-sm font-medium">Confirm installation</p>
              <p className="text-xs text-muted-foreground">Tap &ldquo;Install&rdquo; in the popup dialog</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            type="button"
            size="sm"
            className="bg-gradient-to-r from-violet-500 to-blue-500 text-white text-xs"
            onClick={onDismiss}
          >
            Got it!
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main PWA Install Prompt Component ────────────────────────────────────────
export function PwaInstallPrompt() {
  const currentView = useAppStore((s) => s.currentView);
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);

  const shouldRender = showPrompt || showIosGuide || showAndroidGuide;

  const copy = useMemo(() => {
    if (showIosGuide) {
      return {
        title: "Add StudySpark to your Home Screen",
        body: "Get the full app experience — works offline and launches instantly!",
        action: "Show me how",
      };
    }

    if (!installPrompt) {
      return {
        title: "Install StudySpark App",
        body: "Get quick access from your home screen with a full-screen experience.",
        action: "How to Install",
      };
    }

    return {
      title: "📲 Install StudySpark App",
      body: "Install StudySpark on your phone for quick access and a full-screen experience.",
      action: "Install Now",
    };
  }, [showIosGuide, installPrompt]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  // Auto-show on landing page only (not on dashboard views)
  useEffect(() => {
    let timerId: number | undefined;

    if (typeof window !== "undefined" && currentView !== "landing") {
      // On non-landing views, hide the auto-prompt (but still respond to manual requests)
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
      setShowAndroidGuide(false);
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

  // Handle manual install requests (from topbar / sidebar / anywhere)
  useEffect(() => {
    if (typeof window === "undefined" || isStandalone()) {
      return;
    }

    const handleInstallRequest = async () => {
      if (isStandalone()) {
        toast.info("StudySpark is already installed on your device.");
        return;
      }

      window.localStorage.removeItem(DISMISS_KEY);

      // Try native Android/Chrome install prompt first
      if (installPrompt) {
        try {
          await installPrompt.prompt();
          const choice = await installPrompt.userChoice;
          if (choice.outcome === "accepted") {
            window.localStorage.setItem(INSTALLED_KEY, "true");
            toast.success("StudySpark installed successfully!");
          }
          setInstallPrompt(null);
          setShowPrompt(false);
          setShowIosGuide(false);
          setShowAndroidGuide(false);
          return;
        } catch {
          // fallback to guide if prompt fails
        }
      }

      // Show iOS guide for iOS Safari
      if (isIosDevice()) {
        setShowIosGuide(true);
        setShowPrompt(false);
        setShowAndroidGuide(false);
        return;
      }

      // Show Android/generic fallback guide
      setShowAndroidGuide(true);
      setShowIosGuide(false);
      setShowPrompt(true);
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
    setShowAndroidGuide(false);
  };

  const install = async () => {
    if (showIosGuide) {
      // Already showing iOS guide, just toggle the detailed modal
      return;
    }

    if (isIosDevice()) {
      setShowIosGuide(true);
      return;
    }

    if (!installPrompt) {
      setShowAndroidGuide(true);
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

  // Render iOS modal guide
  if (showIosGuide) {
    return <IosInstallGuide onDismiss={dismiss} />;
  }

  // Render Android fallback guide modal
  if (showAndroidGuide) {
    return <AndroidFallbackGuide onDismiss={dismiss} />;
  }

  if (!shouldRender) return null;

  // Bottom banner prompt (for Android with native install available)
  return (
    <div className="fixed inset-x-3 bottom-3 z-[120] mx-auto max-w-md animate-in slide-in-from-bottom-3 duration-300 rounded-2xl border border-border/70 bg-background/95 p-4 text-foreground shadow-2xl backdrop-blur-xl md:bottom-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 text-white shadow-lg shadow-violet-500/25">
          <Smartphone className="size-5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <div className="min-w-0">
              <p className="text-sm font-bold leading-5">{copy.title}</p>
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
            <Button
              type="button"
              size="sm"
              onClick={install}
              className="bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-md shadow-violet-500/20 hover:from-violet-600 hover:to-blue-600"
            >
              {showIosGuide ? (
                <Share className="size-4" aria-hidden="true" />
              ) : (
                <Download className="size-4 animate-bounce" aria-hidden="true" />
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
