import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  hashPassword,
  setAuthCookie,
  verifyPassword,
} from "@/lib/auth";

const signupSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers and underscores"
    ),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password must be at most 72 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;

    const existing = await db.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    const hashed = await hashPassword(password);
    const user = await db.user.create({
      data: {
        username,
        password: hashed,
        profile: {
          create: {
            bio: "",
            goal: "Master my studies and ace every exam",
            targetHours: 6,
            college: "",
            course: "",
            semester: 1,
          },
        },
      },
      select: { id: true, username: true },
    });

    await setAuthCookie(user.id);

    const profile = await db.profile.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      user: { id: user.id, username: user.username },
      profile,
    });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
