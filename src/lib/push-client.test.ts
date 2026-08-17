/// <reference types="bun-types" />

import { afterEach, describe, expect, test } from "bun:test";
import { getPushSubscription, saveBrowserPushSubscription } from "./push-client";

function installPushGlobals({
  permission = "default",
  existingSubscription = null,
}: {
  permission?: NotificationPermission;
  existingSubscription?: PushSubscription | null;
} = {}) {
  let requestPermissionCalls = 0;
  let subscribeCalls = 0;
  let fetchCalls = 0;

  const subscription =
    existingSubscription ??
    ({
      endpoint: "https://push.example/subscription",
      keys: { auth: "auth", p256dh: "p256dh" },
    } as unknown as PushSubscription);

  const registration = {
    pushManager: {
      getSubscription: async () => existingSubscription,
      subscribe: async () => {
        subscribeCalls += 1;
        return subscription;
      },
    },
  };

  const notificationApi = {
    get permission() {
      return permission;
    },
    requestPermission: async () => {
      requestPermissionCalls += 1;
      permission = "granted";
      return permission;
    },
  };

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      Notification: notificationApi,
      PushManager: function PushManager() {},
      atob: (value: string) => Buffer.from(value, "base64").toString("binary"),
      localStorage: {
        getItem: () => null,
        setItem: () => undefined,
      },
    },
  });

  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      serviceWorker: {
        getRegistration: async () => registration,
        ready: Promise.resolve(registration),
      },
    },
  });

  Object.defineProperty(globalThis, "Notification", {
    configurable: true,
    value: notificationApi,
  });

  Object.defineProperty(globalThis, "fetch", {
    configurable: true,
    value: async () => {
      fetchCalls += 1;
      return new Response(JSON.stringify({ configured: true, publicKey: "test-key" }));
    },
  });

  return {
    get requestPermissionCalls() {
      return requestPermissionCalls;
    },
    get subscribeCalls() {
      return subscribeCalls;
    },
    get fetchCalls() {
      return fetchCalls;
    },
  };
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
  Reflect.deleteProperty(globalThis, "navigator");
  Reflect.deleteProperty(globalThis, "Notification");
  Reflect.deleteProperty(globalThis, "fetch");
});

describe("getPushSubscription", () => {
  test("does not request notification permission in passive mode", async () => {
    const globals = installPushGlobals({ permission: "default" });

    const subscription = await getPushSubscription({
      promptForPermission: false,
      createIfMissing: false,
    });

    expect(subscription).toBeNull();
    expect(globals.requestPermissionCalls).toBe(0);
    expect(globals.subscribeCalls).toBe(0);
    expect(globals.fetchCalls).toBe(0);
  });

  test("does not create a new subscription in passive mode", async () => {
    const globals = installPushGlobals({
      permission: "granted",
      existingSubscription: null,
    });

    const subscription = await getPushSubscription({
      promptForPermission: false,
      createIfMissing: false,
    });

    expect(subscription).toBeNull();
    expect(globals.requestPermissionCalls).toBe(0);
    expect(globals.subscribeCalls).toBe(0);
    expect(globals.fetchCalls).toBe(0);
  });

  test("reuses an existing subscription in passive mode", async () => {
    const existingSubscription = {
      endpoint: "https://push.example/existing",
      keys: { auth: "auth", p256dh: "p256dh" },
    } as unknown as PushSubscription;
    const globals = installPushGlobals({
      permission: "granted",
      existingSubscription,
    });

    const subscription = await saveBrowserPushSubscription({
      promptForPermission: false,
      createIfMissing: false,
    });

    expect(subscription).toBe(existingSubscription);
    expect(globals.requestPermissionCalls).toBe(0);
    expect(globals.subscribeCalls).toBe(0);
    expect(globals.fetchCalls).toBe(1);
  });
});
