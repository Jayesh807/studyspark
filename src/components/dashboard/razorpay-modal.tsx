"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Crown,
  FileText,
  HelpCircle,
  Loader2,
  Sparkles,
  Zap,
  X,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, handleError } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type PlanId = "exam_10q" | "resume" | "combo";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: {
    name?: string;
    email?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
    };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function RazorpayModal({
  isOpen,
  initialPlan = "combo",
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  initialPlan?: PlanId;
  onClose: () => void;
  onSuccess: (planId: PlanId) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>(initialPlan);
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedPlan(initialPlan);
    }
  }, [isOpen, initialPlan]);

  if (!mounted || !isOpen) return null;

  const handlePay = async (planId: PlanId) => {
    setLoadingPlan(planId);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        toast.error("Failed to load Razorpay payment gateway. Please check your internet connection.");
        setLoadingPlan(null);
        return;
      }

      const orderData = await apiFetch<{
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
      }>("/api/payments/razorpay/create-order", {
        method: "POST",
        body: JSON.stringify({ planId }),
      });

      const options: RazorpayOptions = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "StudySpark AI",
        description:
          planId === "exam_10q"
            ? "10-Q Exam Mode Lifetime Pass"
            : planId === "resume"
            ? "AI Resume Builder Lifetime Pass"
            : "All-Access AI Combo Pack",
        order_id: orderData.orderId,
        theme: {
          color: "#8b5cf6",
        },
        handler: async (response) => {
          try {
            toast.loading("Verifying payment...", { id: "razorpay-verify" });
            const verifyData = await apiFetch<{ success: boolean }>(
              "/api/payments/razorpay/verify-payment",
              {
                method: "POST",
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  planId,
                }),
              }
            );

            if (verifyData.success) {
              toast.success("Payment successful! Premium features unlocked.", {
                id: "razorpay-verify",
              });
              onSuccess(planId);
              onClose();
            }
          } catch (err) {
            toast.error("Payment verification failed", { id: "razorpay-verify" });
            handleError(err, "Payment verification failed");
          } finally {
            setLoadingPlan(null);
          }
        },
        modal: {
          ondismiss: () => {
            setLoadingPlan(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      handleError(error, "Could not initiate payment");
      setLoadingPlan(null);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl rounded-3xl border border-white/15 bg-slate-900/90 p-5 sm:p-7 shadow-2xl backdrop-blur-2xl my-auto text-slate-100 overflow-hidden"
        >
          {/* Subtle Ambient Mesh */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl" />

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-all z-10"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="text-center space-y-2 mb-6 sm:mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-3.5 py-1 text-xs font-extrabold uppercase text-amber-300 shadow-sm">
              <Crown className="h-4 w-4 text-amber-300 animate-bounce" />
              Sparks AI Premium Pass
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Upgrade Your AI Study Powers
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Get one-time lifetime unlocks with Razorpay. No subscriptions, pay once, use forever.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Card 1: 10-Q Exam Mode */}
            <div
              onClick={() => setSelectedPlan("exam_10q")}
              className={cn(
                "relative cursor-pointer rounded-2xl border p-4 sm:p-5 transition-all flex flex-col justify-between",
                selectedPlan === "exam_10q"
                  ? "border-cyan-400 bg-cyan-500/10 ring-2 ring-cyan-400/50 shadow-xl shadow-cyan-500/10 scale-[1.02]"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]"
              )}
            >
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">
                    Exam Mode
                  </span>
                  <span className="rounded-full bg-cyan-400/10 border border-cyan-400/30 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                    60% OFF
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">10-Q Test Generator</h3>
                <p className="text-xs text-slate-400 mb-4">Unlimited 10-Question AI test generations</p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-sm font-semibold text-slate-400 line-through">₹49</span>
                  <span className="text-3xl font-extrabold text-white">₹19</span>
                  <span className="text-xs text-slate-400 font-medium">/ lifetime</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 mb-5">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>Unlimited 10-Question tests</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>5-Q exams 100% Free forever</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span>Instant score diagnostics</span>
                  </li>
                </ul>
              </div>
              <Button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handlePay("exam_10q");
                }}
                disabled={loadingPlan !== null}
                className="w-full rounded-xl bg-cyan-600 hover:bg-cyan-500 font-bold text-white shadow-md shadow-cyan-600/20"
              >
                {loadingPlan === "exam_10q" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Unlock 10-Q (₹19)"
                )}
              </Button>
            </div>

            {/* Card 2: Combo Pack (BEST VALUE) */}
            <div
              onClick={() => setSelectedPlan("combo")}
              className={cn(
                "relative cursor-pointer rounded-2xl border p-4 sm:p-5 transition-all flex flex-col justify-between md:-translate-y-2",
                selectedPlan === "combo"
                  ? "border-amber-400 bg-amber-500/15 ring-2 ring-amber-400 shadow-2xl shadow-amber-500/20 scale-[1.03]"
                  : "border-amber-400/60 bg-amber-500/10 hover:border-amber-400 hover:bg-amber-500/15"
              )}
            >
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-0.5 text-[10px] font-extrabold uppercase text-slate-950 shadow-md">
                ⭐ BEST VALUE - 70% OFF ⭐
              </div>
              <div>
                <div className="mb-3 flex items-center justify-between pt-1">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                    All-Access Bundle
                  </span>
                  <span className="rounded-full bg-amber-400/20 border border-amber-400/40 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                    Save ₹69
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">AI Combo Pack</h3>
                <p className="text-xs text-amber-200/90 mb-4">Unlocks BOTH 10-Q Exams & AI Resume</p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-sm font-semibold text-slate-400 line-through">₹98</span>
                  <span className="text-3xl font-extrabold text-amber-300">₹29</span>
                  <span className="text-xs text-slate-400 font-medium">/ lifetime</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-200 mb-5">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                    <span className="font-bold text-white">Lifetime 10-Q Exam Generator</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                    <span className="font-bold text-white">Lifetime AI Resume Maker</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                    <span>Free Ask Doubts & Text-to-PDF</span>
                  </li>
                </ul>
              </div>
              <Button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handlePay("combo");
                }}
                disabled={loadingPlan !== null}
                className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 hover:brightness-110 font-extrabold text-slate-950 shadow-lg shadow-amber-500/25"
              >
                {loadingPlan === "combo" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                ) : (
                  "Unlock Combo (₹29)"
                )}
              </Button>
            </div>

            {/* Card 3: AI Resume Builder */}
            <div
              onClick={() => setSelectedPlan("resume")}
              className={cn(
                "relative cursor-pointer rounded-2xl border p-4 sm:p-5 transition-all flex flex-col justify-between",
                selectedPlan === "resume"
                  ? "border-violet-400 bg-violet-500/10 ring-2 ring-violet-400/50 shadow-xl shadow-violet-500/10 scale-[1.02]"
                  : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.08]"
              )}
            >
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-violet-300">
                    Resume Maker
                  </span>
                  <span className="rounded-full bg-violet-400/10 border border-violet-400/30 px-2 py-0.5 text-[10px] font-bold text-violet-300">
                    60% OFF
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">AI Resume Builder</h3>
                <p className="text-xs text-slate-400 mb-4">Unlimited recruiter-ready ATS resumes</p>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-sm font-semibold text-slate-400 line-through">₹49</span>
                  <span className="text-3xl font-extrabold text-white">₹19</span>
                  <span className="text-xs text-slate-400 font-medium">/ lifetime</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 mb-5">
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                    <span>Unlimited AI Resume exports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                    <span>2 Free generations for testing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                    <span>Live preview & PDF printing</span>
                  </li>
                </ul>
              </div>
              <Button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handlePay("resume");
                }}
                disabled={loadingPlan !== null}
                className="w-full rounded-xl bg-violet-600 hover:bg-violet-500 font-bold text-white shadow-md shadow-violet-600/20"
              >
                {loadingPlan === "resume" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Unlock Resume (₹19)"
                )}
              </Button>
            </div>
          </div>

          {/* Footer security badge */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 border-t border-white/10 pt-4">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              256-bit Secure Razorpay Payment
            </span>
            <span>•</span>
            <span>Instant Access</span>
            <span>•</span>
            <span>100% Refund Guarantee</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
