import { describe, expect, test } from "bun:test";
import { emitRegistryLog } from "../src/log.ts";

describe("emitRegistryLog — AC-4: one structured JSON log line", () => {
  test("emits exactly one JSON line shaped { plugin, agentCount, skillCount, durationMs, outcome } on success", () => {
    const lines: string[] = [];
    emitRegistryLog(
      { plugin: "crew", agentCount: 3, skillCount: 5, durationMs: 42, outcome: "success" },
      (s) => lines.push(s),
    );
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0] as string)).toEqual({
      plugin: "crew",
      agentCount: 3,
      skillCount: 5,
      durationMs: 42,
      outcome: "success",
    });
  });

  test("emits exactly one JSON line with outcome 'failure' on the failure path", () => {
    const lines: string[] = [];
    emitRegistryLog(
      { plugin: "crew", agentCount: 0, skillCount: 0, durationMs: 7, outcome: "failure" },
      (s) => lines.push(s),
    );
    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0] as string).outcome).toBe("failure");
  });
});
