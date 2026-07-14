import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  clearGooglePendingCookie,
  getGooglePendingProfile,
  setAuthCookie,
} from "@/lib/auth";

const usernameSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be at most 20 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers and underscores"
    ),
});

export async function POST(req: Request) {
  try {
    const pendingProfile = await getGooglePendingProfile();
    if (!pendingProfile) {
      return NextResponse.json(
        { error: "Google sign-up session expired. Please try again." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = usernameSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid username" },
        { status: 400 }
      );
    }

    const { username } = parsed.data;

    const existingUsername = await db.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      );
    }

    const existingGoogleUser = await db.user.findUnique({
      where: { googleId: pendingProfile.googleId },
    });
    if (existingGoogleUser) {
      await clearGooglePendingCookie();
      await setAuthCookie(existingGoogleUser.id);
      const profile = await db.profile.findUnique({
        where: { userId: existingGoogleUser.id },
      });
      return NextResponse.json({
        user: {
          id: existingGoogleUser.id,
          username: existingGoogleUser.username,
          email: existingGoogleUser.email,
        },
        profile,
      });
    }

    const existingEmailUser = await db.user.findUnique({
      where: { email: pendingProfile.email },
    });
    if (existingEmailUser) {
      return NextResponse.json(
        {
          error:
            "That email already has a password account. Log in with password first.",
        },
        { status: 409 }
      );
    }

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

    await clearGooglePendingCookie();
    await setAuthCookie(user.id);

    const profile = await db.profile.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({
      user: { id: user.id, username: user.username, email: user.email },
      profile,
    });
  } catch (error) {
    console.error("Google username completion error:", error);
    return NextResponse.json(
      { error: "Could not complete Google sign-up. Please try again." },
      { status: 500 }
    );
  }
}
