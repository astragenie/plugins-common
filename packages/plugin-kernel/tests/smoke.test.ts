import { describe, expect, test } from "bun:test";
import * as kernel from "../src/index.ts";

describe("@astragenie/plugin-kernel smoke", () => {
  test("index module imports without error", () => {
    expect(kernel).toBeDefined();
  });
});
