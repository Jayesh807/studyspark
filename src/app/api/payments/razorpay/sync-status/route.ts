import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getRazorpayEntitlements, isRazorpayPlanId } from "@/lib/payments/razorpay-plans";

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

    // Fetch recent payments from Razorpay to auto-detect any captured transaction for this user
    const paymentList = await razorpay.payments.all({ count: 25 });
    const userPaidItems = paymentList.items.filter(
      (p: any) =>
        p.status === "captured" &&
        (p.notes?.userId === user.id || (user.email && p.email === user.email))
    );

    let newlyUnlocked = false;
    let unlockedPlan = "";

    for (const p of userPaidItems) {
      const planId = p.notes?.planId;
      if (planId && isRazorpayPlanId(planId)) {
        unlockedPlan = planId;
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

        if ((db as any).payment && p.order_id) {
          await (db as any).payment.updateMany({
            where: { razorpayOrderId: p.order_id, userId: user.id },
            data: {
              status: "paid",
              razorpayPaymentId: p.id,
            },
          }).catch(() => null);
        }

        newlyUnlocked = true;
      }
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
