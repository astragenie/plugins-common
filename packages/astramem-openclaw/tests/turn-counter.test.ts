import { beforeEach, describe, expect, test } from "bun:test";
import { _resetTurnCounters, bumpAndCheck } from "../src/turn-counter.ts";

describe("bumpAndCheck", () => {
  beforeEach(() => {
    _resetTurnCounters();
  });

  test("is false for turns 1..N-1 and true on turn N", () => {
    for (let i = 1; i < 5; i++) {
      expect(bumpAndCheck("session-a", 5)).toBe(false);
    }
    expect(bumpAndCheck("session-a", 5)).toBe(true);
  });

  test("is true again at 2N, 3N, ...", () => {
    for (let i = 0; i < 4; i++) bumpAndCheck("session-b", 5);
    expect(bumpAndCheck("session-b", 5)).toBe(true); // turn 5
    for (let i = 0; i < 4; i++) bumpAndCheck("session-b", 5);
    expect(bumpAndCheck("session-b", 5)).toBe(true); // turn 10
  });

  test("tracks distinct sessions independently", () => {
    bumpAndCheck("session-c", 2);
    expect(bumpAndCheck("session-c", 2)).toBe(true); // turn 2 for c
    expect(bumpAndCheck("session-d", 2)).toBe(false); // turn 1 for d
  });
});
