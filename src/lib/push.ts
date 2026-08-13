import webpush from "web-push";

const vapidDetails = {
  subject: process.env.VAPID_SUBJECT || "mailto:support@studysparks.cloud",
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  privateKey: process.env.VAPID_PRIVATE_KEY || "",
};

const hasVapidKeys = Boolean(vapidDetails.publicKey && vapidDetails.privateKey);

if (hasVapidKeys) {
  try {
    webpush.setVapidDetails(
      vapidDetails.subject,
      vapidDetails.publicKey,
      vapidDetails.privateKey
    );
  } catch (err) {
    console.warn("[WebPush]: VAPID initialization warning:", err);
  }
} else {
  console.warn("[WebPush]: VAPID keys are not configured.");
}

export { webpush, vapidDetails, hasVapidKeys };

function pushErrorStatusCode(error: unknown) {
  if (typeof error !== "object" || error === null) return undefined;

  const candidate = error as { statusCode?: unknown; status?: unknown };
  const statusCode = candidate.statusCode ?? candidate.status;
  return typeof statusCode === "number" ? statusCode : undefined;
}

export function isPermanentPushSubscriptionError(error: unknown) {
  const statusCode = pushErrorStatusCode(error);
  return statusCode === 404 || statusCode === 410;
}

export async function sendNotificationToSubscription(
  subscription: webpush.PushSubscription,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    url?: string;
    actions?: Array<{ action: string; title: string }>;
  }
) {
  if (!hasVapidKeys) {
    return { success: false, error: "VAPID keys are not configured" };
  }

  try {
    const result = await webpush.sendNotification(
      subscription,
      JSON.stringify(payload),
      {
        TTL: 24 * 60 * 60, // 24 hours
        urgency: "high",
      }
    );
    return { success: true, statusCode: result.statusCode };
  } catch (error) {
    const statusCode = pushErrorStatusCode(error);
    const gone = isPermanentPushSubscriptionError(error);
    const message = error instanceof Error ? error.message : String(error);

    console.error("[WebPush Error]: Could not send notification:", {
      statusCode,
      gone,
      error: message,
    });

    return { success: false, statusCode, gone, error: message };
  }
}
