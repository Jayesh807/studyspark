import crypto from "crypto";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export interface GoogleProfile {
  googleId: string;
  email: string;
  name?: string;
  avatar?: string;
}

interface GoogleTokenResponse {
  id_token?: string;
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  error?: string;
  error_description?: string;
}

interface GoogleTokenInfo {
  aud?: string;
  sub?: string;
  email?: string;
  email_verified?: string;
  name?: string;
  picture?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  error?: string;
  error_description?: string;
}

export function getGoogleOAuthConfig(origin?: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.NODE_ENV === "production"
      ? process.env.GOOGLE_REDIRECT_URI ||
        (origin ? `${origin}/api/auth/google/callback` : undefined)
      : origin
        ? `${origin}/api/auth/google/callback`
        : process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google OAuth environment variables are not configured.");
  }

  return { clientId, clientSecret, redirectUri };
}

export function isGoogleOAuthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function createGoogleOAuthState() {
  return crypto.randomBytes(24).toString("base64url");
}

export function buildGoogleAuthUrl(state: string, origin?: string) {
  const { clientId, redirectUri } = getGoogleOAuthConfig(origin);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCodeForProfile(
  code: string,
  origin?: string
): Promise<GoogleProfile> {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig(origin);

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokenData = (await tokenResponse.json().catch(() => ({}))) as GoogleTokenResponse;

  if (!tokenResponse.ok || !tokenData.id_token) {
    throw new Error(
      tokenData.error_description || tokenData.error || "Google sign-in failed."
    );
  }

  const infoResponse = await fetch(
    `${GOOGLE_TOKEN_INFO_URL}?id_token=${encodeURIComponent(tokenData.id_token)}`
  );
  const info = (await infoResponse.json().catch(() => ({}))) as GoogleTokenInfo;

  if (!infoResponse.ok || info.error) {
    throw new Error(info.error_description || info.error || "Could not verify Google account.");
  }

  if (info.aud !== clientId || !info.sub || !info.email) {
    throw new Error("Google account verification failed.");
  }

  if (info.email_verified !== "true") {
    throw new Error("Google email is not verified.");
  }

  return {
    googleId: info.sub,
    email: info.email.toLowerCase(),
    name: info.name,
    avatar: info.picture,
  };
}

export async function verifyGoogleIdToken(
  idToken: string,
  clientId = process.env.GOOGLE_CLIENT_ID
): Promise<GoogleProfile> {
  if (!clientId) {
    throw new Error("Google OAuth environment variables are not configured.");
  }

  const infoResponse = await fetch(
    `${GOOGLE_TOKEN_INFO_URL}?id_token=${encodeURIComponent(idToken)}`
  );
  const info = (await infoResponse.json().catch(() => ({}))) as GoogleTokenInfo;

  if (!infoResponse.ok || info.error) {
    throw new Error(info.error_description || info.error || "Could not verify Google account.");
  }

  if (info.aud !== clientId || !info.sub || !info.email) {
    throw new Error("Google account verification failed.");
  }

  if (info.email_verified !== "true") {
    throw new Error("Google email is not verified.");
  }

  return {
    googleId: info.sub,
    email: info.email.toLowerCase(),
    name: info.name,
    avatar: info.picture,
  };
}

export async function verifyGoogleAccessToken(
  accessToken: string
): Promise<GoogleProfile> {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error("Google OAuth environment variables are not configured.");
  }

  const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const info = (await userInfoResponse.json().catch(() => ({}))) as GoogleUserInfo;

  if (!userInfoResponse.ok || info.error) {
    throw new Error(
      info.error_description || info.error || "Could not verify Google account."
    );
  }

  if (!info.sub || !info.email) {
    throw new Error("Google account verification failed.");
  }

  if (info.email_verified !== true) {
    throw new Error("Google email is not verified.");
  }

  return {
    googleId: info.sub,
    email: info.email.toLowerCase(),
    name: info.name,
    avatar: info.picture,
  };
}
