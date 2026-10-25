import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies, headers } from "next/headers";
import { db } from "./db";

const JWT_SECRET =
  process.env.JWT_SECRET || "studyspark-super-secret-key-change-in-production";
const TOKEN_NAME = "studyspark_token";
const AUTH_SESSION_EXPIRES_IN = "30d";
const AUTH_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const GOOGLE_PENDING_MAX_AGE_SECONDS = 60 * 15;
export const GOOGLE_OAUTH_STATE_COOKIE = "studyspark_google_oauth_state";
export const GOOGLE_PENDING_COOKIE = "studyspark_google_pending";

export interface GooglePendingProfile {
  googleId: string;
  email: string;
  name?: string;
  avatar?: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(
  password: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

export function signToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: AUTH_SESSION_EXPIRES_IN,
  });
}

export function signGooglePending(profile: GooglePendingProfile): string {
  return jwt.sign({ kind: "google-pending", ...profile }, JWT_SECRET, {
    expiresIn: "15m",
  });
}

export function verifyGooglePending(token: string): GooglePendingProfile | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as GooglePendingProfile & {
      kind?: string;
    };
    if (
      payload.kind !== "google-pending" ||
      !payload.googleId ||
      !payload.email
    ) {
      return null;
    }
    return {
      googleId: payload.googleId,
      email: payload.email,
      name: payload.name,
      avatar: payload.avatar,
    };
  } catch {
    return null;
  }
}

// ---- Mobile Google sign-in (browser redirect + PKCE-style hand-off) -----------------
// NOTE: these payloads deliberately avoid a `userId` field, because verifyToken() would
// otherwise accept them as session tokens.

export const MOBILE_GOOGLE_STATE_PREFIX = "m.";
const MOBILE_REDIRECT_PATTERN = /^(studyspark|exp|exps):\/\//;
const MOBILE_CHALLENGE_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function isValidMobileGoogleChallenge(value: string | null): value is string {
  return !!value && MOBILE_CHALLENGE_PATTERN.test(value);
}

export function isValidMobileRedirect(value: string | null): value is string {
  return !!value && value.length <= 500 && MOBILE_REDIRECT_PATTERN.test(value);
}

export function signMobileGoogleState(challenge: string, redirect: string): string {
  const token = jwt.sign({ kind: "mobile-google-state", challenge, redirect }, JWT_SECRET, {
    expiresIn: "10m",
  });
  return MOBILE_GOOGLE_STATE_PREFIX + token;
}

export function verifyMobileGoogleState(
  state: string
): { challenge: string; redirect: string } | null {
  if (!state.startsWith(MOBILE_GOOGLE_STATE_PREFIX)) return null;
  try {
    const payload = jwt.verify(state.slice(MOBILE_GOOGLE_STATE_PREFIX.length), JWT_SECRET) as {
      kind?: string;
      challenge?: string;
      redirect?: string;
    };
    if (
      payload.kind !== "mobile-google-state" ||
      !isValidMobileGoogleChallenge(payload.challenge ?? null) ||
      !isValidMobileRedirect(payload.redirect ?? null)
    ) {
      return null;
    }
    return { challenge: payload.challenge!, redirect: payload.redirect! };
  } catch {
    return null;
  }
}

export type MobileGoogleOutcome =
  | { uid: string }
  | { pending: GooglePendingProfile };

export function signMobileGoogleTicket(challenge: string, outcome: MobileGoogleOutcome): string {
  return jwt.sign({ kind: "mobile-google-ticket", challenge, ...outcome }, JWT_SECRET, {
    expiresIn: "5m",
  });
}

export function verifyMobileGoogleTicket(
  ticket: string
): ({ challenge: string } & MobileGoogleOutcome) | null {
  try {
    const payload = jwt.verify(ticket, JWT_SECRET) as {
      kind?: string;
      challenge?: string;
      uid?: string;
      pending?: GooglePendingProfile;
    };
    if (payload.kind !== "mobile-google-ticket" || !payload.challenge) return null;
    if (payload.uid) return { challenge: payload.challenge, uid: payload.uid };
    if (payload.pending?.googleId && payload.pending.email) {
      return { challenge: payload.challenge, pending: payload.pending };
    }
    return null;
  } catch {
    return null;
  }
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    return payload;
  } catch {
    return null;
  }
}

export async function getToken(): Promise<string | undefined> {
  try {
    const headersList = await headers();
    const authHeader = headersList.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }
  } catch (e) {
    // Ignore error if headers() is called outside of request context
  }

  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_NAME)?.value;
}

export async function getCurrentUser() {
  const token = await getToken();
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = await db.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, username: true, email: true, createdAt: true },
  });
  if (user) {
    await setAuthCookie(user.id);
  }
  return user;
}

export async function setAuthCookie(userId: string) {
  const token = signToken(userId);
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: AUTH_SESSION_MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function setGooglePendingCookie(profile: GooglePendingProfile) {
  const token = signGooglePending(profile);
  const cookieStore = await cookies();
  cookieStore.set(GOOGLE_PENDING_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: GOOGLE_PENDING_MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function getGooglePendingProfile() {
  const cookieStore = await cookies();
  const token = cookieStore.get(GOOGLE_PENDING_COOKIE)?.value;
  if (!token) return null;
  return verifyGooglePending(token);
}

export async function clearGooglePendingCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(GOOGLE_PENDING_COOKIE);
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

export { TOKEN_NAME };
