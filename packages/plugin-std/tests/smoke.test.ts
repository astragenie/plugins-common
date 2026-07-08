import { describe, expect, test } from "bun:test";
import * as pluginStd from "../src/index.ts";

describe("@astragenie/plugin-std smoke", () => {
  test("index module imports without error", () => {
    expect(pluginStd).toBeDefined();
  });
});
