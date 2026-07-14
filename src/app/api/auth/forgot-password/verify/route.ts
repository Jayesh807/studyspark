import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  generateResetToken,
  hashResetSecret,
  normalizeEmail,
  PASSWORD_RESET_MAX_ATTEMPTS,
} from "@/lib/password-reset";

const verifySchema = z.object({
  email: z
    .string()
    .trim()
    .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
      message: "Enter a valid email address",
    }),
  otp: z.string().regex(/^\d{6}$/, "Enter the 6-digit OTP"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const email = normalizeEmail(parsed.data.email);
    const record = await db.passwordResetOtp.findFirst({
      where: {
        email,
        usedAt: null,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!record || record.attempts >= PASSWORD_RESET_MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    const otpHash = hashResetSecret(parsed.data.otp);
    if (otpHash !== record.otpHash) {
      await db.passwordResetOtp.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    const resetToken = generateResetToken();
    await db.passwordResetOtp.update({
      where: { id: record.id },
      data: {
        verifiedAt: new Date(),
        resetTokenHash: hashResetSecret(resetToken),
      },
    });

    return NextResponse.json({ resetToken });
  } catch (error) {
    console.error("Forgot password verify error:", error);
    return NextResponse.json(
      { error: "Could not verify OTP. Please try again." },
      { status: 500 }
    );
  }
}
