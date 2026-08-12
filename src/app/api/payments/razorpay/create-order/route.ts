import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isRazorpayPlanId, RAZORPAY_PLANS } from "@/lib/payments/razorpay-plans";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { planId } = body || {};

    if (!planId || typeof planId !== "string" || !isRazorpayPlanId(planId)) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay API keys are missing on the server. Please check .env settings." },
        { status: 500 }
      );
    }

    const RazorpayClass = (typeof Razorpay === "function" ? Razorpay : (Razorpay as any).default) || Razorpay;
    const razorpay = new RazorpayClass({
      key_id: keyId,
      key_secret: keySecret,
    });

    const planInfo = RAZORPAY_PLANS[planId];
    const receiptId = `rcpt_${user.id.slice(-8)}_${Date.now()}`;

    const order = await razorpay.orders.create({
      amount: planInfo.amountPaise,
      currency: "INR",
      receipt: receiptId,
      notes: {
        userId: user.id,
        planId,
        planName: planInfo.name,
      },
    });

    if ((db as any).payment) {
      await (db as any).payment.create({
        data: {
          userId: user.id,
          razorpayOrderId: order.id,
          planId,
          amount: planInfo.amountPaise,
          currency: "INR",
          status: "created",
        },
      }).catch((e: unknown) => console.warn("Payment record log warning:", e));
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      planId,
    });
  } catch (error) {
    console.error("razorpay create-order error:", error);
    const message = error instanceof Error ? error.message : "Failed to create payment order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
