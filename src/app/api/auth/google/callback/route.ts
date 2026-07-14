import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import {
  clearGooglePendingCookie,
  GOOGLE_OAUTH_STATE_COOKIE,
  setAuthCookie,
  setGooglePendingCookie,
} from "@/lib/auth";
import { exchangeGoogleCodeForProfile } from "@/lib/google-auth";

function appUrl(path: string, origin: string) {
  return new URL(path, process.env.NEXT_PUBLIC_APP_URL || origin);
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;
  cookieStore.delete(GOOGLE_OAUTH_STATE_COOKIE);

  if (error) {
    return NextResponse.redirect(appUrl("/login?error=google_cancelled", origin));
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(appUrl("/login?error=google_state", origin));
  }

  try {
    const profile = await exchangeGoogleCodeForProfile(code, origin);

    const existingGoogleUser = await db.user.findUnique({
      where: { googleId: profile.googleId },
      include: { profile: true },
    });

    if (existingGoogleUser) {
      await clearGooglePendingCookie();
      await setAuthCookie(existingGoogleUser.id);
      return NextResponse.redirect(appUrl("/?auth=google_success", origin));
    }

    const existingEmailUser = await db.user.findUnique({
      where: { email: profile.email },
    });

    if (existingEmailUser) {
      return NextResponse.redirect(
        appUrl("/login?error=google_email_exists", origin)
      );
    }

    await setGooglePendingCookie(profile);
    return NextResponse.redirect(appUrl("/google-username", origin));
  } catch (err) {
    console.error("Google callback error:", err);
    return NextResponse.redirect(appUrl("/login?error=google_failed", origin));
  }
}
