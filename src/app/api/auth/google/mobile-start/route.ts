import { NextResponse } from "next/server";
import {
  isValidMobileGoogleChallenge,
  isValidMobileRedirect,
  signMobileGoogleState,
} from "@/lib/auth";
import { buildGoogleAuthUrl } from "@/lib/google-auth";

/**
 * Starts Google sign-in for the mobile app. The app opens this URL in an in-app browser
 * and passes:
 *   challenge - base64url(SHA-256(verifier)); the app keeps the verifier secret
 *   redirect  - the app deep link to return to (studyspark:// or exp://)
 * It reuses the website's Google client and redirect URI, so no extra Google setup is needed.
 * The matching callback is /api/auth/google/callback.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const challenge = url.searchParams.get("challenge");
  const redirect = url.searchParams.get("redirect");

  if (!isValidMobileGoogleChallenge(challenge) || !isValidMobileRedirect(redirect)) {
    return NextResponse.json({ error: "Invalid mobile sign-in request." }, { status: 400 });
  }

  try {
    const state = signMobileGoogleState(challenge, redirect);
    return NextResponse.redirect(buildGoogleAuthUrl(state, url.origin));
  } catch (error) {
    console.error("Mobile Google start error:", error);
    return NextResponse.json({ error: "Google sign-in is not configured." }, { status: 500 });
  }
}
