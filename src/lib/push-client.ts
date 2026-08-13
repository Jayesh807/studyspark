"use client";

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

export async function getOrRegisterPushSubscription(): Promise<PushSubscription | null> {
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
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
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

export async function saveBrowserPushSubscription() {
  const subscription = await getOrRegisterPushSubscription();
  if (!subscription) return null;

  const response = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription }),
  });

  return response.ok ? subscription : null;
}
