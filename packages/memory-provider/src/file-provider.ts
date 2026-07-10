// @astragenie/memory-provider — file-provider.ts
//
// JSONL-backed MemoryProvider. Reads go through tailReadJsonl() (./jsonl.ts),
// which implements torn/truncated-line discard on the byte-window boundary;
// the configured `normalizeRow` (default: normalizeLegacyRow, ./legacy-adapter.ts)
// discards anything else unrecognized (including a genuinely corrupt row).
//
// Adapted from dev-team's scripts/lib/memory/file-provider.ts (FEAT-188 S2)
// — astragenie/plugins-common W3a. Two generalizations were required to make
// this reusable outside dev-team's own tree (see the package README for the
// full rationale):
//
//   1. `storePath` is now a caller-configurable option instead of a hardcoded
//      import of dev-team-local capture-learning.ts's LEARNINGS_PATH. It
//      defaults to [".claude", "artifacts", "loop", "learnings.jsonl"] — the
//      convention shared across the astra plugin family (crew/dev-team,
//      runner-plugin, memory-plugin) — but any consumer can override it.
//   2. `normalizeRow` is now a caller-configurable option (default:
//      normalizeLegacyRow) instead of a hardcoded import. A consumer with its
//      own historical row shapes can inject a custom normalizer; a fresh
//      consumer with no legacy store never exercises anything but the
//      generation-3 (already-schema-valid) branch.
//
// The atomic-append primitive (appendJsonlEntry) still lives in one place
// (./jsonl.ts) — this is not a second, forked JSONL writer.
import { randomUUID } from "node:crypto";
import * as path from "node:path";
import { appendJsonlEntry, tailReadJsonl } from "./jsonl.ts";
import { normalizeLegacyRow } from "./legacy-adapter.ts";
import { rankAndTruncate } from "./ranking.ts";
import { type MemoryEntry, type MemoryEntryInput, MemoryEntrySchema } from "./schema.ts";
import type { MemoryProvider, RecallQuery } from "./types.ts";

const DEFAULT_K = 5;
const DEFAULT_MAX_TOKENS = 800;
const MAX_SUMMARY_LENGTH = 280;
/**
 * tailReadJsonl's default byte window (64KB) could silently drop entries
 * older than the window in a large store — a correctness bug once decay
 * hygiene (ranking.ts) lets `critical` entries survive indefinitely: a
 * buried critical entry beyond the old 64KB window would never reach
 * rankAndTruncate at all, regardless of severity. FULL_STORE_MAX_BYTES
 * raises the window generously (16MB — several orders of magnitude past any
 * realistic learnings.jsonl size) so recall() effectively performs
 * full-file ranking. FULL_STORE_RECORD_CAP similarly removes the
 * record-count cap; `.slice(-count)` is safe even when `count` exceeds the
 * array length, so this is not a behavior change for small stores, only a
 * correctness fix for large ones.
 */
const FULL_STORE_MAX_BYTES = 16 * 1024 * 1024;
const FULL_STORE_RECORD_CAP = Number.MAX_SAFE_INTEGER;

const TOMBSTONE_MARKER = "__memory_invalidated__";

/** Default store location, relative to repoPath, when the caller does not override storePath. */
export const DEFAULT_STORE_PATH = [".claude", "artifacts", "loop", "learnings.jsonl"];

export interface FileProviderOptions {
  recall?: { k?: number; maxTokens?: number };
  /** Path segments (relative to repoPath) of the JSONL store. Defaults to DEFAULT_STORE_PATH. */
  storePath?: string[];
  /**
   * Row normalizer, invoked for every raw JSONL row that isn't a tombstone.
   * Defaults to normalizeLegacyRow (./legacy-adapter.ts), which reconciles
   * three known dev-team-era row generations plus the current schema.
   * Callers with a different legacy shape can inject their own normalizer.
   */
  normalizeRow?: (raw: unknown, indexHint: number) => MemoryEntry | null;
}

function toStoredEntry(input: MemoryEntryInput, supersedesOverride?: string): MemoryEntry {
  return MemoryEntrySchema.parse({
    id: input.id ?? randomUUID(),
    ts: input.ts ?? new Date().toISOString(),
    kind: input.kind,
    severity: input.severity,
    agent: input.agent ?? null,
    tags: input.tags ?? [],
    summary: input.summary.slice(0, MAX_SUMMARY_LENGTH),
    detail: input.detail,
    source: input.source,
    supersedes: supersedesOverride ?? input.supersedes,
  });
}

export function fileProvider(repoPath: string, options: FileProviderOptions = {}): MemoryProvider {
  const defaultK = options.recall?.k ?? DEFAULT_K;
  const defaultMaxTokens = options.recall?.maxTokens ?? DEFAULT_MAX_TOKENS;
  const storePath = options.storePath ?? DEFAULT_STORE_PATH;
  const normalizeRow = options.normalizeRow ?? normalizeLegacyRow;

  async function readAllRaw(): Promise<Record<string, unknown>[]> {
    const targetPath = path.join(repoPath, ...storePath);
    return tailReadJsonl(targetPath, FULL_STORE_RECORD_CAP, { maxBytes: FULL_STORE_MAX_BYTES });
  }

  return {
    describe: () => ({ provider: "file" }),

    async capture(input: MemoryEntryInput): Promise<void> {
      await appendJsonlEntry(repoPath, storePath, toStoredEntry(input));
    },

    async recall(query: RecallQuery): Promise<MemoryEntry[]> {
      const raw = await readAllRaw();
      const invalidated = new Set<string>();
      const entries: MemoryEntry[] = [];

      raw.forEach((row, index) => {
        if (row && row[TOMBSTONE_MARKER] === true && typeof row.targetId === "string") {
          invalidated.add(row.targetId);
          return;
        }
        const normalized = normalizeRow(row, index);
        if (normalized) entries.push(normalized);
      });

      return rankAndTruncate(entries, invalidated, {
        ...(query.agent !== undefined ? { agent: query.agent } : {}),
        ...(query.tags !== undefined ? { tags: query.tags } : {}),
        k: query.k ?? defaultK,
        maxTokens: query.maxTokens ?? defaultMaxTokens,
      });
    },

    async supersede(id: string, replacement: MemoryEntryInput): Promise<void> {
      await appendJsonlEntry(
        repoPath,
        storePath,
        toStoredEntry(replacement, replacement.supersedes ?? id),
      );
    },

    async invalidate(id: string): Promise<void> {
      await appendJsonlEntry(repoPath, storePath, {
        [TOMBSTONE_MARKER]: true,
        targetId: id,
        ts: new Date().toISOString(),
      });
    },
  };
}
