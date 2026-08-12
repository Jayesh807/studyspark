import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planId) {
      return NextResponse.json(
        { error: "Missing required payment parameters" },
        { status: 400 }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "RAZORPAY_KEY_SECRET missing on server" },
        { status: 500 }
      );
    }

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      if ((db as any).payment) {
        await (db as any).payment.updateMany({
          where: { razorpayOrderId: razorpay_order_id, userId: user.id },
          data: { status: "failed" },
        }).catch(() => null);
      }
      return NextResponse.json(
        { error: "Payment verification failed. Invalid signature." },
        { status: 400 }
      );
    }

    if ((db as any).payment) {
      await (db as any).payment.updateMany({
        where: { razorpayOrderId: razorpay_order_id, userId: user.id },
        data: {
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: "paid",
        },
      }).catch(() => null);
    }

    const unlockTenQuestions = planId === "exam_10q" || planId === "combo";
    const unlockResume = planId === "resume" || planId === "combo";

    await (db.profile as any).upsert({
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

    return NextResponse.json({
      success: true,
      message: "Payment verified & entitlements unlocked successfully",
      planId,
      unlockedTenQuestions: unlockTenQuestions,
      unlockedResume: unlockResume,
    });
  } catch (error) {
    console.error("verify-payment error:", error);
    const message = error instanceof Error ? error.message : "Payment verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
