const CACHE_NAME = "studyspark-pwa-v2";
const APP_SHELL = [
  "/",
  "/site.webmanifest",
  "/favicon.ico",
  "/favicon-48x48.png",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip service worker caching on localhost development and API calls
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/") ||
    url.hostname === "localhost" ||
    url.hostname === "127.0.0.1"
  ) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("/", copy));
          return response;
        })
        .catch(() => caches.match("/") || Response.error())
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }

        return response;
      });
    })
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Native Mobile & Web Push Notification Event Handlers
// ─────────────────────────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || "StudySpark Notification 📚";
    const options = {
      body: data.body || "You have a new study update!",
      icon: data.icon || "/icon-192.png",
      badge: "/favicon-48x48.png",
      vibrate: [100, 50, 100],
      data: { url: data.url || "/" },
      actions: data.actions || [],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification("StudySpark 📚", {
        body: text,
        icon: "/icon-192.png",
        vibrate: [100, 50, 100],
      })
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// In-session reminder timers. Closed-browser delivery comes from server Web Push.
// ─────────────────────────────────────────────────────────────────────────────

const activeReminderTimers = new Map();

self.addEventListener("message", (event) => {
  if (!event.data || !event.data.type) return;

  if (event.data.type === "SCHEDULE_REMINDER") {
    const { id, title, note, remindAt } = event.data.payload || {};
    if (!id || !remindAt) return;

    const delay = new Date(remindAt).getTime() - Date.now();
    if (delay <= 0) return;

    if (activeReminderTimers.has(id)) {
      clearTimeout(activeReminderTimers.get(id));
    }

    const timerId = setTimeout(() => {
      self.registration.showNotification(`Reminder: ${title}`, {
        body: note || "Time for your study task!",
        icon: "/icon-192.png",
        badge: "/favicon-48x48.png",
        vibrate: [200, 100, 200, 100, 200],
        tag: `studyspark-reminder-${id}`,
        data: { url: "/" },
      });
      activeReminderTimers.delete(id);
    }, delay);

    activeReminderTimers.set(id, timerId);
  }

  if (event.data.type === "CANCEL_REMINDER") {
    const { id } = event.data.payload || {};
    if (id && activeReminderTimers.has(id)) {
      clearTimeout(activeReminderTimers.get(id));
      activeReminderTimers.delete(id);
    }
  }
});
