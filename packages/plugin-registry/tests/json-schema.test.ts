import { describe, expect, test } from "bun:test";
import { validateAgainstSchema } from "../src/json-schema.ts";
import { agentsSchema } from "../src/schema-loader.ts";

describe("validateAgainstSchema — against the committed agents.schema.json", () => {
  const validEntry = {
    name: "reviewer",
    sourcePlugin: "crew",
    version: "1.2.3",
    generatedAt: "2026-07-08T00:00:00.000Z",
  };

  test("a well-shaped batch has no errors", () => {
    expect(validateAgainstSchema(agentsSchema, [validEntry])).toEqual([]);
  });

  test("a missing required property is reported", () => {
    const { version: _version, ...withoutVersion } = validEntry;
    const errors = validateAgainstSchema(agentsSchema, [withoutVersion]);
    expect(errors.some((e) => e.includes("version"))).toBe(true);
  });

  test("an additional property is reported (additionalProperties: false)", () => {
    const errors = validateAgainstSchema(agentsSchema, [{ ...validEntry, extra: "nope" }]);
    expect(errors.some((e) => e.includes("extra"))).toBe(true);
  });

  test("a non-array top-level value is reported", () => {
    expect(validateAgainstSchema(agentsSchema, validEntry)).toEqual(["$: expected array"]);
  });

  test("a name violating the schema pattern is reported", () => {
    const errors = validateAgainstSchema(agentsSchema, [{ ...validEntry, name: "../evil" }]);
    expect(errors.some((e) => e.includes("pattern"))).toBe(true);
  });
});
