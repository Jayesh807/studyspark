import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { setAuthCookie, setGooglePendingCookie } from "@/lib/auth";
import { verifyGoogleIdToken } from "@/lib/google-auth";

const credentialSchema = z.object({
  credential: z.string().min(1, "Google credential is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = credentialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid Google credential" },
        { status: 400 }
      );
    }

    const googleProfile = await verifyGoogleIdToken(parsed.data.credential);

    const existingGoogleUser = await db.user.findUnique({
      where: { googleId: googleProfile.googleId },
    });

    if (existingGoogleUser) {
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
        requiresUsername: false,
      });
    }

    const existingEmailUser = await db.user.findUnique({
      where: { email: googleProfile.email },
    });

    if (existingEmailUser) {
      return NextResponse.json(
        {
          error:
            "That email already has a password account. Sign in with your password first.",
        },
        { status: 409 }
      );
    }

    await setGooglePendingCookie(googleProfile);

    return NextResponse.json({
      requiresUsername: true,
    });
  } catch (error) {
    console.error("Google credential error:", error);
    return NextResponse.json(
      { error: "Google sign-in failed. Please try again." },
      { status: 500 }
    );
  }
}
