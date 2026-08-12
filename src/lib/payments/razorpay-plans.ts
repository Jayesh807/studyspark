export type RazorpayPlanId = "exam_10q" | "resume" | "combo";

export const RAZORPAY_PLANS: Record<
  RazorpayPlanId,
  { amountPaise: number; name: string }
> = {
  exam_10q: { amountPaise: 1900, name: "10-Q Exam Mode Lifetime" },
  resume: { amountPaise: 1900, name: "AI Resume Builder Lifetime" },
  combo: { amountPaise: 2900, name: "All-Access AI Combo Pack" },
};

export function isRazorpayPlanId(planId: string): planId is RazorpayPlanId {
  return Object.prototype.hasOwnProperty.call(RAZORPAY_PLANS, planId);
}

export function getRazorpayEntitlements(planId: RazorpayPlanId) {
  return {
    unlockTenQuestions: planId === "exam_10q" || planId === "combo",
    unlockResume: planId === "resume" || planId === "combo",
  };
}
