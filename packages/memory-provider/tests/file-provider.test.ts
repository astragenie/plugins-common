import * as assert from "node:assert/strict";
// tests/file-provider.test.ts
// fileProvider: atomic O_APPEND JSONL, torn-line discard on read, legacy-row
// adapter, recency x severity ranking with token-budget truncation +
// supersede-chain resolution.
//
// Adapted from dev-team tests/memory-provider-file.test.ts (FEAT-188 S2).
// Two changes from the source beyond import paths:
//   1. Dropped the "writes into the SAME store S1a's captureFailureLearning
//      uses" test — that assertion is about dev-team-local integration
//      between two of ITS OWN writers (capture-learning.ts + fileProvider),
//      which has no equivalent in a standalone package. Re-verified on the
//      consumer side when dev-team's own fileProvider usage is wired up.
//   2. The legacy S1a-shape-row test constructs the raw row directly
//      instead of going through dev-team-local capture-learning.ts's
//      captureFailureLearning() — same row shape, no cross-package import.
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import { DEFAULT_STORE_PATH, fileProvider } from "../src/file-provider.ts";
import { MemoryEntrySchema } from "../src/schema.ts";

async function makeTempRepo(prefix: string) {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function cleanup(dir: string) {
  await fs.rm(dir, { recursive: true, force: true });
}

function storeFilePath(repo: string) {
  return path.join(repo, ...DEFAULT_STORE_PATH);
}

test("fileProvider describes itself as file", () => {
  assert.deepEqual(fileProvider("/tmp/whatever").describe(), { provider: "file" });
});

test("fileProvider.capture appends a JSONL row that recall() can read back", async () => {
  const repo = await makeTempRepo("memory-file-capture-");
  try {
    const provider = fileProvider(repo);
    await provider.capture({
      kind: "failure",
      severity: "high",
      summary: "review rejected: missing null guard",
      tags: ["stack:typescript"],
      source: "review_fail",
    });
    const results = await provider.recall({ k: 5 });
    assert.equal(results.length, 1);
    assert.equal(results[0]?.summary, "review rejected: missing null guard");
    assert.equal(results[0]?.severity, "high");
    assert.ok(results[0]?.id, "capture assigns an id when the caller omits one");
  } finally {
    await cleanup(repo);
  }
});

test("fileProvider.recall discards a torn (corrupt) trailing line instead of throwing", async () => {
  const repo = await makeTempRepo("memory-file-torn-");
  try {
    const provider = fileProvider(repo);
    await provider.capture({ kind: "failure", severity: "high", summary: "good row", source: "t" });
    // Simulate a crash mid-write: append a truncated JSON fragment.
    await fs.appendFile(storeFilePath(repo), '{"kind":"failure","ts":"2026-0', "utf8");

    const results = await provider.recall({ k: 5 });
    assert.equal(results.length, 1);
    assert.equal(results[0]?.summary, "good row");
  } finally {
    await cleanup(repo);
  }
});

test("fileProvider.recall includes legacy capture-repair-shape rows (kind/ts/agent/severity/tags/summary/source, no id) via the default adapter", async () => {
  const repo = await makeTempRepo("memory-file-legacy-gen2-");
  try {
    const target = storeFilePath(repo);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.appendFile(
      target,
      `${JSON.stringify({
        kind: "failure",
        ts: new Date().toISOString(),
        agent: "reviewer",
        severity: "critical",
        tags: [],
        summary: "legacy capture-repair-shape row",
        source: "review_fail",
      })}\n`,
      "utf8",
    );
    const provider = fileProvider(repo);
    const results = await provider.recall({ k: 5 });
    assert.equal(results.length, 1);
    assert.equal(results[0]?.summary, "legacy capture-repair-shape row");
    assert.equal(results[0]?.kind, "failure");
  } finally {
    await cleanup(repo);
  }
});

test("fileProvider.recall includes pre-capture-repair legacy rows (id/timestamp/key/insight/confidence) via the default adapter", async () => {
  const repo = await makeTempRepo("memory-file-legacy-gen1-");
  try {
    const target = storeFilePath(repo);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.appendFile(
      target,
      `${JSON.stringify({
        id: "old-1",
        timestamp: new Date().toISOString(),
        key: "grade-template-rot",
        insight: "grades kept the unfilled placeholder bullet",
        confidence: 0.8,
      })}\n`,
      "utf8",
    );
    const provider = fileProvider(repo);
    const results = await provider.recall({ k: 5 });
    assert.equal(results.length, 1);
    assert.equal(results[0]?.summary, "grades kept the unfilled placeholder bullet");
    assert.deepEqual(results[0]?.tags, ["grade-template-rot"]);
  } finally {
    await cleanup(repo);
  }
});

test("fileProvider.recall ranks by recency x severity (higher severity + more recent wins)", async () => {
  const repo = await makeTempRepo("memory-file-ranking-");
  try {
    const provider = fileProvider(repo);
    const now = Date.now();
    const oldTs = new Date(now - 40 * 24 * 60 * 60 * 1000).toISOString();
    const freshTs = new Date(now - 1 * 60 * 1000).toISOString();

    await provider.capture({
      id: "old-low",
      ts: oldTs,
      kind: "lesson",
      severity: "low",
      summary: "old and low severity",
      source: "t",
    });
    await provider.capture({
      id: "fresh-critical",
      ts: freshTs,
      kind: "failure",
      severity: "critical",
      summary: "fresh and critical",
      source: "t",
    });

    const results = await provider.recall({ k: 5 });
    assert.equal(results[0]?.id, "fresh-critical", "fresh+critical should outrank old+low");
  } finally {
    await cleanup(repo);
  }
});

test("fileProvider.recall truncates results to a token budget (recall.maxTokens)", async () => {
  const repo = await makeTempRepo("memory-file-truncate-");
  try {
    const provider = fileProvider(repo);
    for (let i = 0; i < 5; i += 1) {
      await provider.capture({
        id: `entry-${i}`,
        kind: "lesson",
        severity: "high",
        summary: "x".repeat(200),
        source: "t",
      });
    }
    // Each ~200-char summary costs ~50 estimated tokens; a 60-token budget
    // should allow through at most one entry.
    const results = await provider.recall({ k: 5, maxTokens: 60 });
    assert.ok(
      results.length <= 1,
      `expected <=1 entry under a tight token budget, got ${results.length}`,
    );
  } finally {
    await cleanup(repo);
  }
});

test("fileProvider.recall resolves supersede chains — only the latest entry in a chain is returned", async () => {
  const repo = await makeTempRepo("memory-file-supersede-");
  try {
    const provider = fileProvider(repo);
    await provider.capture({
      id: "v1",
      kind: "decision",
      severity: "medium",
      summary: "original decision",
      source: "t",
    });
    await provider.supersede("v1", {
      id: "v2",
      kind: "decision",
      severity: "medium",
      summary: "revised decision",
      source: "t",
    });

    const results = await provider.recall({ k: 5 });
    const ids = results.map((r) => r.id);
    assert.ok(ids.includes("v2"), "the superseding entry should be present");
    assert.ok(!ids.includes("v1"), "the superseded entry should be excluded");
  } finally {
    await cleanup(repo);
  }
});

test("fileProvider.recall reads entries buried beyond the legacy 64KB tail window in a large store", async () => {
  const repo = await makeTempRepo("memory-file-large-store-");
  try {
    const provider = fileProvider(repo);
    // Pad the store well past the old tailReadJsonl default 64KB byte window
    // (~500 bytes/entry * 400 entries ≈ 200KB) before writing the entry
    // recall() must still surface.
    const padding = "x".repeat(400);
    for (let i = 0; i < 400; i += 1) {
      await provider.capture({
        id: `pad-${i}`,
        kind: "lesson",
        severity: "low",
        summary: `padding ${i} ${padding}`,
        source: "t",
      });
    }
    await provider.capture({
      id: "buried-critical",
      kind: "decision",
      severity: "critical",
      summary: "buried early in a large store but must remain recallable",
      source: "t",
    });
    for (let i = 0; i < 50; i += 1) {
      await provider.capture({
        id: `tail-${i}`,
        kind: "lesson",
        severity: "low",
        summary: `tail padding ${i}`,
        source: "t",
      });
    }

    const results = await provider.recall({ k: 1000, maxTokens: 1_000_000 });
    assert.ok(
      results.some((r) => r.id === "buried-critical"),
      "recall() must not silently drop an entry buried beyond the legacy 64KB tail window",
    );
  } finally {
    await cleanup(repo);
  }
});

test("fileProvider.invalidate excludes an entry from future recall() calls", async () => {
  const repo = await makeTempRepo("memory-file-invalidate-");
  try {
    const provider = fileProvider(repo);
    await provider.capture({
      id: "bad-entry",
      kind: "lesson",
      severity: "high",
      summary: "turned out to be wrong",
      source: "t",
    });
    let results = await provider.recall({ k: 5 });
    assert.ok(results.some((r) => r.id === "bad-entry"));

    await provider.invalidate("bad-entry");
    results = await provider.recall({ k: 5 });
    assert.ok(!results.some((r) => r.id === "bad-entry"));
  } finally {
    await cleanup(repo);
  }
});

test("fileProvider accepts a custom storePath option", async () => {
  const repo = await makeTempRepo("memory-file-custom-path-");
  try {
    const provider = fileProvider(repo, { storePath: ["custom", "store.jsonl"] });
    await provider.capture({
      kind: "lesson",
      severity: "low",
      summary: "custom path",
      source: "t",
    });
    const raw = await fs.readFile(path.join(repo, "custom", "store.jsonl"), "utf8");
    assert.ok(raw.includes("custom path"));
    await assert.rejects(fs.access(storeFilePath(repo)), "default store path must not be touched");
  } finally {
    await cleanup(repo);
  }
});

test("fileProvider accepts a custom normalizeRow option that overrides the legacy adapter", async () => {
  const repo = await makeTempRepo("memory-file-custom-normalize-");
  try {
    const target = storeFilePath(repo);
    await fs.mkdir(path.dirname(target), { recursive: true });
    // A row that the default legacy adapter WOULD normalize (gen1 shape) —
    // a strict-only normalizer should reject it instead.
    await fs.appendFile(
      target,
      `${JSON.stringify({
        id: "old-1",
        timestamp: new Date().toISOString(),
        key: "k",
        insight: "would normally be adapted",
        confidence: 0.5,
      })}\n`,
      "utf8",
    );
    const strictOnly = fileProvider(repo, {
      normalizeRow: (raw) => {
        const parsed = MemoryEntrySchema.safeParse(raw);
        return parsed.success ? parsed.data : null;
      },
    });
    const results = await strictOnly.recall({ k: 5 });
    assert.equal(results.length, 0, "strict-only normalizer must reject the legacy-shape row");
  } finally {
    await cleanup(repo);
  }
});
