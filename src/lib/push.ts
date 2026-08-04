import webpush from "web-push";

// Default VAPID keys for immediate out-of-the-box functionality if env vars are missing
const DEFAULT_VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BEl62iUYgUivxIkv69yViEuiBIa1L3u213_5k5K84pM2xY1Z46Sg8Z033p_3Z87214-436152-7";
const DEFAULT_VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  "e4Y53112-9214-4361-5270-362228514112";

const vapidDetails = {
  subject: process.env.VAPID_SUBJECT || "mailto:support@studysparks.cloud",
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY || DEFAULT_VAPID_PRIVATE_KEY,
};

try {
  webpush.setVapidDetails(
    vapidDetails.subject,
    vapidDetails.publicKey,
    vapidDetails.privateKey
  );
} catch (err) {
  console.warn("[WebPush]: VAPID initialization warning:", err);
}

export { webpush, vapidDetails };

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
    console.error("[WebPush Error]: Could not send notification:", error);
    return { success: false, error: String(error) };
  }
}
