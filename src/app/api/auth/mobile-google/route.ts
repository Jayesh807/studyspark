import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { signToken, signGooglePending } from "@/lib/auth";
import { verifyGoogleAccessToken } from "@/lib/google-auth";

/**
 * Mobile-specific Google Sign-In endpoint.
 * 
 * Flow:
 *  1. Mobile gets an access_token via expo-auth-session (Google OAuth)
 *  2. POST this endpoint with { accessToken }
 *  3a. If user exists ? returns { token, user, profile }  (JWT for Bearer auth)
 *  3b. If user is NEW ? returns { pendingToken, requiresUsername: true }
 *      Mobile then asks for a username and calls /api/auth/mobile-google-complete
 */

const schema = z.object({
  accessToken: z.string().min(1, "Google access token is required"),
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

    const googleProfile = await verifyGoogleAccessToken(parsed.data.accessToken);

    // -- Existing Google user -----------------------------------------------
    const existingGoogleUser = await db.user.findUnique({
      where: { googleId: googleProfile.googleId },
    });

    if (existingGoogleUser) {
      const profile = await db.profile.findUnique({
        where: { userId: existingGoogleUser.id },
      });
      const token = signToken(existingGoogleUser.id);
      return NextResponse.json({
        token,
        user: {
          id:       existingGoogleUser.id,
          username: existingGoogleUser.username,
          email:    existingGoogleUser.email,
        },
        profile,
        requiresUsername: false,
      });
    }

    // -- Email already registered with password -----------------------------
    const existingEmailUser = await db.user.findUnique({
      where: { email: googleProfile.email },
    });

    if (existingEmailUser) {
      return NextResponse.json(
        { error: "That email already has a password account. Sign in with your password instead." },
        { status: 409 }
      );
    }

    // -- New Google user — needs to pick a username -------------------------
    const pendingToken = signGooglePending(googleProfile);
    return NextResponse.json({ requiresUsername: true, pendingToken });
  } catch (error) {
    console.error("Mobile Google sign-in error:", error);
    return NextResponse.json(
      { error: "Google sign-in failed. Please try again." },
      { status: 500 }
    );
  }
}
