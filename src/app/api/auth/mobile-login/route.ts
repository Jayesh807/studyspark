import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword, signToken } from "@/lib/auth";

// Mobile-specific login endpoint: returns JWT in body (not in httpOnly cookie)
// so React Native apps can store and send it as a Bearer token.

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;

    const user = await db.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    if (!user.password) {
      return NextResponse.json(
        {
          error:
            "This account uses Google Sign-In. Please continue with Google.",
        },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Return JWT in body for mobile clients
    const token = signToken(user.id);

    const profile = await db.profile.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
      profile,
    });
  } catch (error) {
    console.error("Mobile login error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
