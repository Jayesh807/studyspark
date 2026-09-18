import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { signToken, verifyGooglePending } from "@/lib/auth";

/**
 * Complete Google sign-up on mobile: 
 * receives { pendingToken, username } and creates the user account,
 * returning a proper JWT { token, user, profile }.
 */

const schema = z.object({
  pendingToken: z.string().min(1, "Pending token is required"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers and underscores"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const { pendingToken, username } = parsed.data;

    const pendingProfile = verifyGooglePending(pendingToken);
    if (!pendingProfile) {
      return NextResponse.json(
        { error: "Google sign-up session expired. Please try again." },
        { status: 401 }
      );
    }

    // Check username uniqueness
    const existingUsername = await db.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    // Check if email was registered already
    const existingEmailUser = await db.user.findUnique({ where: { email: pendingProfile.email } });
    if (existingEmailUser) {
      return NextResponse.json(
        { error: "That email already has a password account. Log in with password first." },
        { status: 409 }
      );
    }

    // If googleId already exists (race condition), just return existing
    const existingGoogleUser = await db.user.findUnique({
      where: { googleId: pendingProfile.googleId },
    });
    if (existingGoogleUser) {
      const profile = await db.profile.findUnique({ where: { userId: existingGoogleUser.id } });
      const token = signToken(existingGoogleUser.id);
      return NextResponse.json({
        token,
        user: { id: existingGoogleUser.id, username: existingGoogleUser.username, email: existingGoogleUser.email },
        profile,
      });
    }

    // Create new user
    const user = await db.user.create({
      data: {
        username,
        email: pendingProfile.email,
        password: null,
        authProvider: "google",
        googleId: pendingProfile.googleId,
        usernameCompleted: true,
        profile: {
          create: {
            bio: "",
            goal: "Master my studies and ace every exam",
            targetHours: 6,
            college: "",
            course: "",
            semester: 1,
            avatar: pendingProfile.avatar || "",
          },
        },
      },
      select: { id: true, username: true, email: true },
    });

    const profile = await db.profile.findUnique({ where: { userId: user.id } });
    const token = signToken(user.id);

    return NextResponse.json({
      token,
      user: { id: user.id, username: user.username, email: user.email },
      profile,
    });
  } catch (error) {
    console.error("Mobile Google complete error:", error);
    return NextResponse.json(
      { error: "Could not complete Google sign-up. Please try again." },
      { status: 500 }
    );
  }
}
