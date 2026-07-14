import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { clearAuthCookie, hashPassword } from "@/lib/auth";
import { hashResetSecret } from "@/lib/password-reset";

const resetSchema = z
  .object({
    resetToken: z.string().min(32, "Invalid reset session"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(72, "Password must be at most 72 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const record = await db.passwordResetOtp.findFirst({
      where: {
        resetTokenHash: hashResetSecret(parsed.data.resetToken),
        verifiedAt: { not: null },
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Reset session expired. Please request a new OTP." },
        { status: 400 }
      );
    }

    const hashed = await hashPassword(parsed.data.password);
    await db.$transaction([
      db.user.update({
        where: { id: record.userId },
        data: { password: hashed },
      }),
      db.passwordResetOtp.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    await clearAuthCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password reset error:", error);
    return NextResponse.json(
      { error: "Could not reset password. Please try again." },
      { status: 500 }
    );
  }
}

