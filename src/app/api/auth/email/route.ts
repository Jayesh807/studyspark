import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { normalizeEmail } from "@/lib/password-reset";

const emailSchema = z.object({
  email: z
    .string()
    .trim()
    .refine((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
      message: "Enter a valid email address",
    }),
});

export async function PUT(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = emailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const email = normalizeEmail(parsed.data.email);
    const existing = await db.user.findFirst({
      where: { email, NOT: { id: user.id } },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This email is already used by another account" },
        { status: 409 }
      );
    }

    const updated = await db.user.update({
      where: { id: user.id },
      data: { email },
      select: { id: true, username: true, email: true, createdAt: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    console.error("Email update error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
