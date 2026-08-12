import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getRazorpayEntitlements, isRazorpayPlanId } from "@/lib/payments/razorpay-plans";

export const runtime = "nodejs";

function signaturesMatch(generatedSignature: string, receivedSignature: string) {
  const generated = Buffer.from(generatedSignature, "hex");
  const received = Buffer.from(receivedSignature, "hex");

  return generated.length === received.length && crypto.timingSafeEqual(generated, received);
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
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

    if (!(db as any).payment) {
      return NextResponse.json(
        { error: "Payment storage is unavailable on the server" },
        { status: 500 }
      );
    }

    const payment = await (db as any).payment.findFirst({
      where: { razorpayOrderId: razorpay_order_id, userId: user.id },
    });

    if (!payment || !isRazorpayPlanId(payment.planId)) {
      return NextResponse.json(
        { error: "Payment order was not found for this user" },
        { status: 404 }
      );
    }

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!signaturesMatch(generatedSignature, razorpay_signature)) {
      await (db as any).payment.updateMany({
        where: { razorpayOrderId: razorpay_order_id, userId: user.id },
        data: { status: "failed" },
      }).catch(() => null);

      return NextResponse.json(
        { error: "Payment verification failed. Invalid signature." },
        { status: 400 }
      );
    }

    await (db as any).payment.updateMany({
      where: { razorpayOrderId: razorpay_order_id, userId: user.id },
      data: {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "paid",
      },
    }).catch(() => null);

    const { unlockTenQuestions, unlockResume } = getRazorpayEntitlements(payment.planId);

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
      planId: payment.planId,
      unlockedTenQuestions: unlockTenQuestions,
      unlockedResume: unlockResume,
    });
  } catch (error) {
    console.error("verify-payment error:", error);
    const message = error instanceof Error ? error.message : "Payment verification failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
