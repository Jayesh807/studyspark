import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  getRazorpayEntitlements,
  isRazorpayPlanId,
  RAZORPAY_PLANS,
  type RazorpayPlanId,
} from "@/lib/payments/razorpay-plans";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "";
    const rawKeySecret = process.env.RAZORPAY_KEY_SECRET || "";
    const keyId = rawKeyId.trim();
    const keySecret = rawKeySecret.trim();

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Razorpay credentials not configured" }, { status: 500 });
    }

    const RazorpayClass = (typeof Razorpay === "function" ? Razorpay : (Razorpay as any).default) || Razorpay;
    const razorpay = new RazorpayClass({ key_id: keyId, key_secret: keySecret });

    let newlyUnlocked = false;
    let unlockedPlan = "";

    const applyEntitlements = async (planId: RazorpayPlanId) => {
      const { unlockTenQuestions, unlockResume } = getRazorpayEntitlements(planId);
      await db.profile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          hasUnlockedTenQuestions: unlockTenQuestions,
          hasUnlockedResume: unlockResume,
        },
        update: {
          ...(unlockTenQuestions ? { hasUnlockedTenQuestions: true } : {}),
          ...(unlockResume ? { hasUnlockedResume: true } : {}),
        },
      });
      unlockedPlan = planId;
      newlyUnlocked = true;
    };

    // Recover from this user's own payment records only (never other customers' payments or the
    // payer-typed email). "paid" rows whose unlock write failed are re-applied; "created" rows are
    // checked against Razorpay for a captured payment that covers the plan price.
    const paymentModel = (db as any).payment;
    const userPayments: any[] = paymentModel
      ? await paymentModel
          .findMany({
            where: { userId: user.id, status: { in: ["created", "paid"] } },
            orderBy: { createdAt: "desc" },
            take: 20,
          })
          .catch(() => [])
      : [];

    for (const record of userPayments) {
      if (!isRazorpayPlanId(record.planId)) continue;
      const planId: RazorpayPlanId = record.planId;

      if (record.status === "paid") {
        await applyEntitlements(planId);
        continue;
      }

      // Only real Razorpay orders (not payment-link placeholders) can be looked up
      if (typeof record.razorpayOrderId !== "string" || !record.razorpayOrderId.startsWith("order_")) {
        continue;
      }

      const orderPayments = await razorpay.orders
        .fetchPayments(record.razorpayOrderId)
        .catch(() => null);
      const captured = orderPayments?.items?.find(
        (p: any) =>
          p.status === "captured" &&
          p.order_id === record.razorpayOrderId &&
          Number(p.amount) >= RAZORPAY_PLANS[planId].amountPaise
      );
      if (!captured) continue;

      await applyEntitlements(planId);
      await paymentModel
        .updateMany({
          where: { razorpayOrderId: record.razorpayOrderId, userId: user.id },
          data: { status: "paid", razorpayPaymentId: captured.id },
        })
        .catch(() => null);
    }

    // Return the fresh profile status
    const currentProfile = await db.profile.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      success: true,
      synced: newlyUnlocked,
      planId: unlockedPlan,
      hasUnlockedTenQuestions: currentProfile?.hasUnlockedTenQuestions ?? false,
      hasUnlockedResume: currentProfile?.hasUnlockedResume ?? false,
    });
  } catch (error) {
    console.error("[Razorpay Sync] error:", error);
    const message = error instanceof Error ? error.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
