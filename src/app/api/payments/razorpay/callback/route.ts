import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { db } from "@/lib/db";
import { getRazorpayEntitlements, isRazorpayPlanId } from "@/lib/payments/razorpay-plans";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const planId = searchParams.get("planId") || "";
  const userId = searchParams.get("userId") || "";
  const razorpayPaymentId = searchParams.get("razorpay_payment_id") || "";
  const razorpayPaymentLinkId = searchParams.get("razorpay_payment_link_id") || "";
  const razorpayPaymentLinkRefId = searchParams.get("razorpay_payment_link_reference_id") || "";
  const razorpayPaymentLinkStatus = searchParams.get("razorpay_payment_link_status") || "";
  const razorpaySignature = searchParams.get("razorpay_signature") || "";

  const rawKeySecret = process.env.RAZORPAY_KEY_SECRET || "";
  const rawKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "";
  const keySecret = rawKeySecret.trim();
  const keyId = rawKeyId.trim();

  let isVerified = false;

  // 1. Signature Verification
  if (keySecret && razorpaySignature && razorpayPaymentLinkId && razorpayPaymentId) {
    try {
      isVerified = validatePaymentVerification(
        {
          payment_link_id: razorpayPaymentLinkId,
          payment_link_reference_id: razorpayPaymentLinkRefId,
          payment_link_status: razorpayPaymentLinkStatus || "paid",
          payment_id: razorpayPaymentId,
        },
        razorpaySignature,
        keySecret
      );
    } catch (sigErr) {
      console.warn("[Razorpay Callback] Signature verification error:", sigErr);
    }
  }

  // 2. Direct API Fallback check with Razorpay server if signature verification had any discrepancy
  if (!isVerified && keyId && keySecret && razorpayPaymentLinkId) {
    try {
      const RazorpayClass = (typeof Razorpay === "function" ? Razorpay : (Razorpay as any).default) || Razorpay;
      const rzp = new RazorpayClass({ key_id: keyId, key_secret: keySecret });
      const linkData = await rzp.paymentLink.fetch(razorpayPaymentLinkId);
      if (linkData && (linkData.status === "paid" || Number(linkData.amount_paid) > 0)) {
        isVerified = true;
      }
    } catch (apiErr) {
      console.warn("[Razorpay Callback] Direct API fallback check error:", apiErr);
    }
  }

  // If verified and we have userId & valid planId, unlock entitlements in database!
  if (isVerified && userId && isRazorpayPlanId(planId)) {
    const { unlockTenQuestions, unlockResume } = getRazorpayEntitlements(planId);

    try {
      await db.profile.upsert({
        where: { userId },
        create: {
          userId,
          hasUnlockedTenQuestions: unlockTenQuestions,
          hasUnlockedResume: unlockResume,
        },
        update: {
          ...(unlockTenQuestions ? { hasUnlockedTenQuestions: true } : {}),
          ...(unlockResume ? { hasUnlockedResume: true } : {}),
        },
      });
      console.log(`[Razorpay Callback] Successfully unlocked ${planId} for user ${userId}`);
    } catch (dbErr) {
      console.error("[Razorpay Callback] Database profile unlock error:", dbErr);
    }

    const appDeepLink = `studyspark://checkout?status=success&planId=${encodeURIComponent(planId)}`;

    // Render high-fidelity success page with automatic redirect back to StudySpark app
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Successful - StudySpark</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #090D16;
      color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      text-align: center;
    }
    .card {
      background: #0F172A;
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 24px;
      padding: 36px 28px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    }
    .icon-wrap {
      width: 72px;
      height: 72px;
      background: rgba(16, 185, 129, 0.15);
      border: 2px solid #10B981;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 36px;
    }
    h1 {
      font-size: 22px;
      font-weight: 800;
      margin-bottom: 8px;
      color: #FFFFFF;
    }
    p {
      font-size: 14px;
      color: #94A3B8;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .btn {
      display: block;
      background: linear-gradient(135deg, #8B5CF6, #6D28D9);
      color: #FFFFFF;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      padding: 16px 24px;
      border-radius: 14px;
      box-shadow: 0 10px 25px rgba(139, 92, 246, 0.35);
      transition: opacity 0.2s;
    }
    .btn:active {
      opacity: 0.85;
    }
    .subtext {
      margin-top: 18px;
      font-size: 12px;
      color: #64748B;
    }
  </style>
  <script>
    // Automatically redirect back to the StudySpark Expo mobile app
    window.location.href = "${appDeepLink}";
    setTimeout(function() {
      window.location.href = "${appDeepLink}";
    }, 1200);
  </script>
</head>
<body>
  <div class="card">
    <div class="icon-wrap">✓</div>
    <h1>Payment Verified! 🎉</h1>
    <p>Your lifetime access has been unlocked in your StudySpark account. You can now use all features without limits.</p>
    <a href="${appDeepLink}" class="btn">Return to StudySpark App</a>
    <div class="subtext">If the app doesn't open automatically, tap the button above.</div>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Payment failed, cancelled or unverified
  const cancelDeepLink = `studyspark://checkout?status=cancel`;
  const failHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Status - StudySpark</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background-color: #090D16;
      color: #F8FAFC;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      text-align: center;
    }
    .card {
      background: #0F172A;
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 24px;
      padding: 36px 28px;
      max-width: 420px;
      width: 100%;
    }
    .icon-wrap {
      width: 72px;
      height: 72px;
      background: rgba(239, 68, 68, 0.15);
      border: 2px solid #EF4444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 32px;
      color: #EF4444;
    }
    h1 {
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 8px;
    }
    p {
      font-size: 14px;
      color: #94A3B8;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .btn {
      display: block;
      background: #334155;
      color: #FFFFFF;
      text-decoration: none;
      font-weight: 700;
      font-size: 14px;
      padding: 14px 20px;
      border-radius: 12px;
    }
  </style>
  <script>
    setTimeout(function() {
      window.location.href = "${cancelDeepLink}";
    }, 2000);
  </script>
</head>
<body>
  <div class="card">
    <div class="icon-wrap">✕</div>
    <h1>Payment Incomplete</h1>
    <p>The payment was cancelled or could not be completed. No amount was charged to your account.</p>
    <a href="${cancelDeepLink}" class="btn">Back to StudySpark</a>
  </div>
</body>
</html>`;

  return new NextResponse(failHtml, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
