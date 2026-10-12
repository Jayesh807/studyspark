import crypto from "crypto";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

/** Thrown when a Google token can't be verified; the message is safe to show to the client. */
export class GoogleAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GoogleAuthError";
  }
}

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

function getAllowedGoogleClientIds() {
  const ids = [
    process.env.GOOGLE_CLIENT_ID,
    ...(process.env.GOOGLE_ALLOWED_CLIENT_IDS || "").split(","),
  ]
    .map((id) => id?.trim())
    .filter((id): id is string => Boolean(id));

  return new Set(ids);
}

export async function verifyGoogleAccessToken(
  accessToken: string
): Promise<GoogleProfile> {
  const allowedClientIds = getAllowedGoogleClientIds();
  if (allowedClientIds.size === 0) {
    throw new Error("Google OAuth environment variables are not configured.");
  }

  // Make sure the token was issued to one of our own OAuth clients, otherwise a
  // token minted for any other app could be used to sign in here.
  const tokenInfoResponse = await fetch(
    `${GOOGLE_TOKEN_INFO_URL}?access_token=${encodeURIComponent(accessToken)}`
  );
  const tokenInfo = (await tokenInfoResponse.json().catch(() => ({}))) as GoogleTokenInfo & {
    azp?: string;
  };

  if (!tokenInfoResponse.ok || tokenInfo.error) {
    throw new GoogleAuthError(
      tokenInfo.error_description || tokenInfo.error || "Could not verify Google account."
    );
  }

  const issuedTo = [tokenInfo.aud, tokenInfo.azp].filter(Boolean) as string[];
  if (!issuedTo.some((id) => allowedClientIds.has(id))) {
    console.error(
      `[Google Auth] Access token was issued to client(s) [${issuedTo.join(", ")}], which are not in ` +
        "GOOGLE_CLIENT_ID / GOOGLE_ALLOWED_CLIENT_IDS. If this is your mobile app's OAuth client, add its ID to GOOGLE_ALLOWED_CLIENT_IDS."
    );
    throw new GoogleAuthError(
      "Google sign-in isn't enabled for this app yet. Please contact support."
    );
  }

  const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const info = (await userInfoResponse.json().catch(() => ({}))) as GoogleUserInfo;

  if (!userInfoResponse.ok || info.error) {
    throw new GoogleAuthError(
      info.error_description || info.error || "Could not verify Google account."
    );
  }

  if (!info.sub || !info.email) {
    throw new GoogleAuthError("Google account verification failed.");
  }

  if (info.email_verified !== true) {
    throw new GoogleAuthError("Google email is not verified.");
  }

  return {
    googleId: info.sub,
    email: info.email.toLowerCase(),
    name: info.name,
    avatar: info.picture,
  };
}
