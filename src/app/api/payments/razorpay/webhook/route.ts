import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getRazorpayEntitlements, isRazorpayPlanId } from "@/lib/payments/razorpay-plans";

export const runtime = "nodejs";

function verifyWebhookSignature(rawBody: string, signature: string, secret: string) {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  const expected = Buffer.from(expectedSignature, "hex");
  const received = Buffer.from(signature, "hex");

  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

async function unlockForOrder(orderId: string, razorpayPaymentId?: string) {
  if (!(db as any).payment) return;

  const payment = await (db as any).payment.findUnique({
    where: { razorpayOrderId: orderId },
  });

  if (!payment || !isRazorpayPlanId(payment.planId)) return;

  await (db as any).payment.update({
    where: { razorpayOrderId: orderId },
    data: {
      ...(razorpayPaymentId ? { razorpayPaymentId } : {}),
      status: "paid",
    },
  });

  const { unlockTenQuestions, unlockResume } = getRazorpayEntitlements(payment.planId);

  await (db.profile as any).upsert({
    where: { userId: payment.userId },
    create: {
      userId: payment.userId,
      hasUnlockedTenQuestions: unlockTenQuestions,
      hasUnlockedResume: unlockResume,
    },
    update: {
      ...(unlockTenQuestions ? { hasUnlockedTenQuestions: true } : {}),
      ...(unlockResume ? { hasUnlockedResume: true } : {}),
    },
  });
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "RAZORPAY_WEBHOOK_SECRET missing on server" },
      { status: 500 }
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature || !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const paymentEntity = event?.payload?.payment?.entity;
  const orderEntity = event?.payload?.order?.entity;

  if (event?.event === "payment.captured" && paymentEntity?.order_id) {
    await unlockForOrder(paymentEntity.order_id, paymentEntity.id);
  }

  if (event?.event === "order.paid" && orderEntity?.id) {
    await unlockForOrder(orderEntity.id);
  }

  return NextResponse.json({ received: true });
}
