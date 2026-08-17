"use client";

const LAST_PUSH_ENDPOINT_KEY = "studyspark:lastPushEndpoint";

interface PushSubscriptionOptions {
  promptForPermission?: boolean;
  createIfMissing?: boolean;
}

const DEFAULT_PUSH_SUBSCRIPTION_OPTIONS: Required<PushSubscriptionOptions> = {
  promptForPermission: true,
  createIfMissing: true,
};

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function readLastPushEndpoint() {
  try {
    return window.localStorage.getItem(LAST_PUSH_ENDPOINT_KEY);
  } catch {
    return null;
  }
}

function rememberLastPushEndpoint(endpoint: string) {
  try {
    window.localStorage.setItem(LAST_PUSH_ENDPOINT_KEY, endpoint);
  } catch {
    // Push still works without localStorage; reminder migration just cannot use the old endpoint.
  }
}

async function getReadyServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) return null;

  const existing = await navigator.serviceWorker.getRegistration("/");
  if (!existing) {
    await navigator.serviceWorker.register("/sw.js");
  }

  return navigator.serviceWorker.ready;
}

export async function getOrRegisterPushSubscription(): Promise<PushSubscription | null> {
  return getPushSubscription();
}

export async function getPushSubscription(
  options: PushSubscriptionOptions = {}
): Promise<PushSubscription | null> {
  const { promptForPermission, createIfMissing } = {
    ...DEFAULT_PUSH_SUBSCRIPTION_OPTIONS,
    ...options,
  };

  if (
    typeof window === "undefined" ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return null;
  }

  let permission = Notification.permission;
  if (permission === "default") {
    if (!promptForPermission) return null;
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") return null;

  try {
    const registration = await getReadyServiceWorkerRegistration();
    if (!registration) return null;

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      if (!createIfMissing) return null;

      const keyRes = await fetch("/api/push/subscribe").catch(() => null);
      if (!keyRes || !keyRes.ok) return null;
      const { configured, publicKey } = await keyRes.json();
      if (!configured || !publicKey) return null;

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    return subscription;
  } catch (err) {
    console.warn("[Web Push Subscription Warning]:", err);
    return null;
  }
}

export async function saveBrowserPushSubscription(options: PushSubscriptionOptions = {}) {
  const subscription = await getPushSubscription(options);
  if (!subscription) return null;

  const previousEndpoint = readLastPushEndpoint();
  const replacementEndpoint =
    previousEndpoint && previousEndpoint !== subscription.endpoint
      ? previousEndpoint
      : undefined;

  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription, previousEndpoint: replacementEndpoint }),
  });

  if (!response.ok) return null;

  rememberLastPushEndpoint(subscription.endpoint);
  return subscription;
}
