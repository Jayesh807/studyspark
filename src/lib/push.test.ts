/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test";
import { isPermanentPushSubscriptionError } from "./push";

describe("isPermanentPushSubscriptionError", () => {
  test("treats gone and missing push endpoints as permanent failures", () => {
    expect(isPermanentPushSubscriptionError({ statusCode: 410 })).toBe(true);
    expect(isPermanentPushSubscriptionError({ statusCode: 404 })).toBe(true);
  });

  test("does not treat transient push failures as stale subscriptions", () => {
    expect(isPermanentPushSubscriptionError({ statusCode: 429 })).toBe(false);
    expect(isPermanentPushSubscriptionError(new Error("network timeout"))).toBe(false);
  });
});
