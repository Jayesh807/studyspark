import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  buildGoogleAuthUrl,
  createGoogleOAuthState,
} from "@/lib/google-auth";
import { GOOGLE_OAUTH_STATE_COOKIE } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const origin = new URL(req.url).origin;
    const state = createGoogleOAuthState();
    const cookieStore = await cookies();

    cookieStore.set(GOOGLE_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 10,
      path: "/",
    });

    return NextResponse.redirect(buildGoogleAuthUrl(state, origin));
  } catch {
    console.warn(
      "Google sign-in is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI."
    );
    return NextResponse.redirect(
      new URL(
        "/login?error=google_config",
        process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin
      )
    );
  }
}
