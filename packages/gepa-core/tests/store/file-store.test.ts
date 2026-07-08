import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DeterministicError } from "@astragenie/plugin-std";
import { fileStore } from "../../src/store/file-store.ts";
import type { Trial } from "../../src/types/trial.ts";
import { newTrialId } from "../../src/types/trial.ts";

let root: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "gepa-filestore-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

const sampleTrial = (overrides: Record<string, unknown> = {}) => ({
  id: newTrialId(),
  agent: "fullstack-dev",
  phase: "build" as const,
  candidate_prompt_hash: "abc",
  candidate_prompt_path: null,
  input: { case_id: "c1" },
  output: { ok: true },
  score: { pass: true, score: 1, cost_usd: 0.001, latency_ms: 100 },
  source: "eval" as const,
  pareto_rank: 1,
  created_at: new Date().toISOString(),
  ...overrides,
});

describe("fileStore", () => {
  test("put then recall returns the trial", async () => {
    const store = fileStore(root);
    const trial = sampleTrial();
    await store.put(trial);
    const recalled = await store.recall({ agent: "fullstack-dev" });
    expect(recalled).toHaveLength(1);
    expect(recalled[0]?.id).toBe(trial.id);
  });

  test("recall filters by source", async () => {
    const store = fileStore(root);
    await store.put(sampleTrial({ source: "eval" }));
    await store.put(sampleTrial({ source: "captured" }));
    const eval_ = await store.recall({ source: "eval" });
    expect(eval_).toHaveLength(1);
  });

  test("recall filters by failuresOnly", async () => {
    const store = fileStore(root);
    await store.put(sampleTrial({ score: { pass: true, score: 1, cost_usd: 0, latency_ms: 0 } }));
    await store.put(
      sampleTrial({ score: { pass: false, score: 0.2, cost_usd: 0, latency_ms: 0 } }),
    );
    const fails = await store.recall({ failuresOnly: true });
    expect(fails).toHaveLength(1);
    expect(fails[0]?.score.pass).toBe(false);
  });

  test("recall respects limit", async () => {
    const store = fileStore(root);
    for (let i = 0; i < 5; i++) await store.put(sampleTrial());
    const limited = await store.recall({ limit: 3 });
    expect(limited).toHaveLength(3);
  });

  test("invalidate by agent returns count purged", async () => {
    const store = fileStore(root);
    await store.put(sampleTrial({ agent: "fullstack-dev" }));
    await store.put(sampleTrial({ agent: "backend-dev" }));
    const purged = await store.invalidate({ agent: "fullstack-dev" });
    expect(purged).toBe(1);
    const remaining = await store.recall({});
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.agent).toBe("backend-dev");
  });

  // Gate Zero (FEAT-001 SLICE-01, AC-1 + AC-4): file-store.ts:46 used to call
  // `TrialSchema.parse(trial)`, which throws on invalid input. put() now uses
  // `safeParse` and returns a typed Result instead.
  test("put with invalid trial data never throws, returns err(DeterministicError)", async () => {
    const store = fileStore(root);
    const malformedTrial = sampleTrial({
      // `phase` must be one of build/review/validate/ship — this violates the schema.
      phase: "not-a-real-phase",
      score: "also-not-a-real-score",
    }) as unknown as Trial;

    let thrown: unknown;
    let result: Awaited<ReturnType<typeof store.put>> | undefined;
    try {
      result = await store.put(malformedTrial);
    } catch (caught) {
      thrown = caught;
    }

    expect(thrown).toBeUndefined();
    expect(result).toBeDefined();
    expect(result?.ok).toBe(false);
    if (result?.ok !== false) throw new Error("unreachable: expected err result");
    expect(result.error).toBeInstanceOf(DeterministicError);
    expect(result.error.code).toBeTruthy();
    expect(result.error.transient).toBe(false);

    // The malformed trial must not have been persisted.
    const recalled = await store.recall({});
    expect(recalled).toHaveLength(0);
  });

  test("put with valid trial returns ok(validated trial)", async () => {
    const store = fileStore(root);
    const trial = sampleTrial();
    const result = await store.put(trial);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable: expected ok result");
    expect(result.value.id).toBe(trial.id);
  });
});
