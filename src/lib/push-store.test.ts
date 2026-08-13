/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test";
import { replacementReminderId } from "./push-store";

describe("replacementReminderId", () => {
  test("moves per-subscription scheduled reminder ids to the replacement subscription", () => {
    expect(
      replacementReminderId(
        "task:abc:due:old-subscription",
        "old-subscription",
        "new-subscription"
      )
    ).toBe("task:abc:due:new-subscription");
  });

  test("keeps single-device reminder ids stable while moving their subscription", () => {
    expect(replacementReminderId("reminder-123", "old-subscription", "new-subscription")).toBe(
      "reminder-123"
    );
  });
});
