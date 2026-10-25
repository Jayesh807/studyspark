import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import {
  clearGooglePendingCookie,
  GOOGLE_OAUTH_STATE_COOKIE,
  setAuthCookie,
  setGooglePendingCookie,
  signMobileGoogleTicket,
  verifyMobileGoogleState,
} from "@/lib/auth";
import { exchangeGoogleCodeForProfile } from "@/lib/google-auth";

function appUrl(path: string, origin: string) {
  return new URL(path, process.env.NEXT_PUBLIC_APP_URL || origin);
}

function appRedirect(redirect: string, params: Record<string, string>) {
  const query = new URLSearchParams(params).toString();
  const target = `${redirect}${redirect.includes("?") ? "&" : "?"}${query}`;
  return new NextResponse(null, { status: 302, headers: { Location: target } });
}

/** Mobile app flow: hand the result back to the app via its deep link (see mobile-start). */
async function handleMobileCallback(
  mobile: { challenge: string; redirect: string },
  code: string | null,
  error: string | null,
  origin: string
) {
  if (error || !code) {
    return appRedirect(mobile.redirect, { error: "google_cancelled" });
  }

  try {
    const profile = await exchangeGoogleCodeForProfile(code, origin);

    const existingGoogleUser = await db.user.findUnique({
      where: { googleId: profile.googleId },
    });
    if (existingGoogleUser) {
      return appRedirect(mobile.redirect, {
        ticket: signMobileGoogleTicket(mobile.challenge, { uid: existingGoogleUser.id }),
      });
    }

    const existingEmailUser = await db.user.findUnique({
      where: { email: profile.email },
    });
    if (existingEmailUser) {
      return appRedirect(mobile.redirect, { error: "google_email_exists" });
    }

    return appRedirect(mobile.redirect, {
      ticket: signMobileGoogleTicket(mobile.challenge, {
        pending: {
          googleId: profile.googleId,
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar,
        },
      }),
    });
  } catch (err) {
    console.error("Mobile Google callback error:", err);
    return appRedirect(mobile.redirect, { error: "google_failed" });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  const mobile = state ? verifyMobileGoogleState(state) : null;
  if (mobile) {
    return handleMobileCallback(mobile, code, error, origin);
  }

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
