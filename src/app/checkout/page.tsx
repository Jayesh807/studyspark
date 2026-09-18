"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Lock,
  ArrowRight,
  AlertCircle,
  X,
} from "lucide-react";

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (msg: string) => void;
    };
  }
}

type PlanId = "combo" | "resume" | "exam_10q";

interface PlanDetails {
  id: PlanId;
  name: string;
  tagline: string;
  price: number;
  badge?: string;
  features: string[];
  color: string;
}

const PLANS: Record<PlanId, PlanDetails> = {
  combo: {
    id: "combo",
    name: "All-Access AI Combo",
    tagline: "Best Value: Unlock all premium features forever",
    price: 29,
    badge: "RECOMMENDED",
    color: "#8B5CF6",
    features: [
      "Unlimited AI ATS Resume Builder generations",
      "Full 10-Question Interactive Exam Quizzes",
      "Lifetime access — Pay once, use forever",
      "Instant unlock across Mobile & Web",
    ],
  },
  resume: {
    id: "resume",
    name: "AI Resume Builder Lifetime",
    tagline: "Unlimited recruiter-ready ATS resumes",
    price: 19,
    color: "#EA580C",
    features: [
      "Unlimited AI Resume generations & regenerations",
      "Full Multi-Project & Work Experience inputs",
      "Instant PDF download & Native print support",
      "Lifetime unlock with no monthly fees",
    ],
  },
  exam_10q: {
    id: "exam_10q",
    name: "10-Q Exam Mode Lifetime",
    tagline: "Comprehensive 10-question PDF quizzes",
    price: 19,
    color: "#0284C7",
    features: [
      "Generate 10-question tests from any study PDF",
      "Detailed explanations & performance analysis",
      "Interactive timer and accuracy breakdown",
      "Lifetime unlock with no recurring subscriptions",
    ],
  },
};

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      return resolve(true);
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function CheckoutComponent() {
  const searchParams = useSearchParams();
  const initialPlanParam = searchParams.get("planId") as PlanId | null;
  const tokenParam = searchParams.get("token");

  const [selectedPlan, setSelectedPlan] = useState<PlanId>(
    initialPlanParam && PLANS[initialPlanParam] ? initialPlanParam : "combo"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [verifiedPlan, setVerifiedPlan] = useState<PlanId | null>(null);

  // Preload Razorpay checkout script
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const plan = PLANS[selectedPlan];

  const handlePay = async () => {
    setLoading(true);
    setError(null);

    try {
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady || !window.Razorpay) {
        throw new Error("Could not load Razorpay payment gateway. Please check your internet connection.");
      }

      // Build headers with bearer token if passed from mobile
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (tokenParam) {
        headers["Authorization"] = `Bearer ${tokenParam}`;
      }

      // 1. Create Order
      const orderRes = await fetch("/api/payments/razorpay/create-order", {
        method: "POST",
        headers,
        body: JSON.stringify({ planId: selectedPlan }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.orderId) {
        throw new Error(orderData.error || "Failed to create payment order.");
      }

      // 2. Open Razorpay Modal
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "StudySpark AI",
        description: plan.name,
        order_id: orderData.orderId,
        theme: {
          color: plan.color,
        },
        prefill: orderData.prefill || {},
        retry: {
          enabled: true,
          max_count: 2,
        },
        handler: async (response: any) => {
          try {
            setLoading(true);
            // 3. Verify Payment
            const verifyRes = await fetch("/api/payments/razorpay/verify-payment", {
              method: "POST",
              headers,
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: selectedPlan,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || "Payment signature verification failed.");
            }

            // Success!
            setPaymentSuccess(true);
            setVerifiedPlan(selectedPlan);

            // Signal Mobile App via WebView postMessage if in WebView
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  type: "PAYMENT_SUCCESS",
                  planId: selectedPlan,
                  orderId: response.razorpay_order_id,
                })
              );
            } else {
              // In browser/Chrome Custom Tab, redirect back to mobile app after 2s
              setTimeout(() => {
                window.location.href = "studyspark://checkout?status=success";
              }, 2000);
            }
          } catch (err: any) {
            setError(err.message || "Payment verification failed.");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({
                  type: "PAYMENT_CANCELLED",
                })
              );
            }
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      if (typeof rzp.on === "function") {
        rzp.on("payment.failed", (resp: any) => {
          setError(resp.error?.description || "Payment failed. Please try again.");
          setLoading(false);
        });
      }
      rzp.open();
    } catch (err: any) {
      setError(err.message || "An error occurred while launching payment.");
      setLoading(false);
    }
  };

  const handleCloseFromWeb = () => {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: "CLOSE_CHECKOUT" })
      );
    } else {
      window.location.href = "studyspark://checkout?status=close";
      setTimeout(() => {
        if (window.history.length > 1) {
          window.history.back();
        }
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 select-none">
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 leading-tight">
                StudySpark Premium
              </h1>
              <p className="text-xs text-slate-400">One-Time Lifetime AI Access</p>
            </div>
          </div>

          <button
            onClick={handleCloseFromWeb}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success State */}
        {paymentSuccess ? (
          <div className="py-8 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-pulse" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-100 mb-2">
              Payment Successful! 🎉
            </h2>
            <p className="text-sm text-slate-300 mb-6 max-w-xs mx-auto leading-relaxed">
              Your account has been upgraded to{" "}
              <span className="font-semibold text-emerald-400">
                {verifiedPlan ? PLANS[verifiedPlan].name : "Lifetime Access"}
              </span>
              . Premium features are now fully unlocked!
            </p>

            <button
              onClick={handleCloseFromWeb}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-600/20"
            >
              Continue to StudySpark
            </button>
          </div>
        ) : (
          <>
            {/* Error Notification */}
            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2.5 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            {/* Plan Selector Pills */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              {(Object.keys(PLANS) as PlanId[]).map((pId) => {
                const item = PLANS[pId];
                const isSelected = selectedPlan === pId;
                return (
                  <button
                    key={pId}
                    type="button"
                    onClick={() => {
                      setSelectedPlan(pId);
                      setError(null);
                    }}
                    className={`relative p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? "bg-violet-950/40 border-violet-500 shadow-md shadow-violet-500/10"
                        : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {item.badge && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        Best
                      </span>
                    )}
                    <div className="text-xs font-bold text-slate-200 truncate mt-1">
                      {pId === "combo" ? "All-Access" : pId === "resume" ? "Resume" : "Exam 10-Q"}
                    </div>
                    <div className="text-sm font-extrabold text-slate-100 mt-0.5">
                      ₹{item.price}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Plan Details Card */}
            <div className="mt-4 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-bold text-slate-100">{plan.name}</div>
                  <div className="text-xs text-slate-400">{plan.tagline}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-slate-100">₹{plan.price}</div>
                  <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">
                    One-time
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-800/80">
                {plan.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pay Button */}
            <div className="mt-5">
              <button
                type="button"
                onClick={handlePay}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.99]"
                style={{
                  backgroundColor: plan.color,
                  boxShadow: `0 8px 24px -6px ${plan.color}66`,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connecting to Razorpay...
                  </span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay ₹{plan.price} & Unlock Lifetime Access</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            {/* Trust Footer */}
            <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-slate-500">
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>256-bit SSL Encrypted</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-violet-400" />
                <span>Verified Razorpay Gateway</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading checkout...</p>
          </div>
        </div>
      }
    >
      <CheckoutComponent />
    </Suspense>
  );
}
