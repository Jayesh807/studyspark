import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getCurrentUser } from "@/lib/auth";
import { isRazorpayPlanId, RAZORPAY_PLANS } from "@/lib/payments/razorpay-plans";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { planId, origin } = body || {};

    if (!planId || typeof planId !== "string" || !isRazorpayPlanId(planId)) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      );
    }

    const rawKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "";
    const rawKeySecret = process.env.RAZORPAY_KEY_SECRET || "";
    const keyId = rawKeyId.trim();
    const keySecret = rawKeySecret.trim();

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay API credentials are not configured on the server." },
        { status: 500 }
      );
    }

    const RazorpayClass = (typeof Razorpay === "function" ? Razorpay : (Razorpay as any).default) || Razorpay;
    const razorpay = new RazorpayClass({
      key_id: keyId,
      key_secret: keySecret,
    });

    const planInfo = RAZORPAY_PLANS[planId];
    const cleanUsername = user.username.replace(/[^a-zA-Z0-9]/g, "") || "student";
    const customerEmail = user.email && user.email.includes("@") ? user.email : `${cleanUsername}@studysparks.cloud`;

    // Determine the exact callback URL so user returns to the right environment
    let callbackBaseUrl = typeof origin === "string" && origin.startsWith("http") ? origin.trim() : "";
    if (!callbackBaseUrl) {
      const envAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
      callbackBaseUrl = envAppUrl || req.nextUrl.origin;
    }
    callbackBaseUrl = callbackBaseUrl.replace(/\/+$/, "");

    const callbackUrl = `${callbackBaseUrl}/api/payments/razorpay/callback?planId=${encodeURIComponent(planId)}&userId=${encodeURIComponent(user.id)}`;

    // Create official Razorpay hosted payment link (https://rzp.io/rzp/...)
    // Full HTTPS top-level window natively opens Google Pay, PhonePe, Paytm on mobile with 0 iframe restrictions
    const paymentLink = await razorpay.paymentLink.create({
      amount: planInfo.amountPaise,
      currency: "INR",
      accept_partial: false,
      description: `StudySpark: ${planInfo.name}`,
      customer: {
        name: user.username,
        email: customerEmail,
      },
      notify: {
        sms: false,
        email: false,
      },
      reminder_enable: false,
      notes: {
        userId: user.id,
        planId,
        planName: planInfo.name,
      },
      callback_url: callbackUrl,
      callback_method: "get",
    });

    return NextResponse.json({
      paymentUrl: paymentLink.short_url,
      paymentLinkId: paymentLink.id,
      amount: planInfo.amountPaise,
      currency: "INR",
      planId,
    });
  } catch (error) {
    console.error("[Razorpay] create-payment-link error:", error);
    const message = error instanceof Error ? error.message : "Failed to create payment link";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
