import crypto from "crypto";

const RESET_SECRET =
  process.env.PASSWORD_RESET_SECRET ||
  process.env.JWT_SECRET ||
  "studyspark-password-reset-secret-change-in-production";

export const PASSWORD_RESET_OTP_TTL_MINUTES = 10;
export const PASSWORD_RESET_MAX_ATTEMPTS = 5;
export const PASSWORD_RESET_RESEND_SECONDS = 60;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function generateResetToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashResetSecret(value: string) {
  return crypto
    .createHmac("sha256", RESET_SECRET)
    .update(value)
    .digest("hex");
}

export function resetOtpExpiry() {
  return new Date(Date.now() + PASSWORD_RESET_OTP_TTL_MINUTES * 60 * 1000);
}

