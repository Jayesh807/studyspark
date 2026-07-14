import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendPasswordResetOtp } from "@/lib/email";
import {
  generateOtp,
  hashResetSecret,
  normalizeEmail,
  PASSWORD_RESET_RESEND_SECONDS,
  resetOtpExpiry,
} from "@/lib/password-reset";

const requestSchema = z.object({
  email: z
    .string()
    .trim()
    .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
      message: "Enter a valid email address",
    }),
});

const genericResponse = {
  message: "If that email is linked to an account, an OTP has been sent.",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const email = normalizeEmail(parsed.data.email);
    const user = await db.user.findUnique({ where: { email } });

    if (!user) {
      return NextResponse.json(genericResponse);
    }

    const recent = await db.passwordResetOtp.findFirst({
      where: {
        userId: user.id,
        usedAt: null,
        createdAt: {
          gt: new Date(Date.now() - PASSWORD_RESET_RESEND_SECONDS * 1000),
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recent) {
      return NextResponse.json(genericResponse);
    }

    const otp = generateOtp();
    await db.passwordResetOtp.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await db.passwordResetOtp.create({
      data: {
        userId: user.id,
        email,
        otpHash: hashResetSecret(otp),
        expiresAt: resetOtpExpiry(),
      },
    });

    await sendPasswordResetOtp({ to: email, otp });
    return NextResponse.json(genericResponse);
  } catch (error) {
    console.error("Forgot password request error:", error);
    return NextResponse.json(
      { error: "Could not send reset OTP. Please try again." },
      { status: 500 }
    );
  }
}
