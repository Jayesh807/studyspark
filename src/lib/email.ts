interface SendPasswordResetOtpParams {
  to: string;
  otp: string;
}

export function isPasswordResetEmailConfigured() {
  return Boolean(
    process.env.BREVO_API_KEY &&
      (process.env.RESET_EMAIL_FROM_EMAIL || process.env.RESET_EMAIL_FROM)
  );
}

export async function sendPasswordResetOtp({
  to,
  otp,
}: SendPasswordResetOtpParams) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail =
    process.env.RESET_EMAIL_FROM_EMAIL || process.env.RESET_EMAIL_FROM;
  const fromName = process.env.RESET_EMAIL_FROM_NAME || "StudySpark";

  if (!isPasswordResetEmailConfigured() || !apiKey || !fromEmail) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`Password reset OTP for ${to}: ${otp}`);
      return;
    }
    throw new Error("Password reset email is not configured");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: fromName },
      to: [{ email: to }],
      subject: "Your StudySpark password reset OTP",
      htmlContent: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
          <h2>Reset your StudySpark password</h2>
          <p>Your verification code is:</p>
          <p style="font-size:28px;font-weight:700;letter-spacing:6px">${otp}</p>
          <p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>
        </div>
      `,
      textContent: `Your StudySpark password reset OTP is ${otp}. It expires in 10 minutes.`,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Failed to send reset email: ${body || response.status}`);
  }
}
