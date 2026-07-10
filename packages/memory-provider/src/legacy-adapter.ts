// @astragenie/memory-provider — legacy-adapter.ts
//
// A JSONL memory store can accumulate multiple row generations as the
// schema evolves. normalizeLegacyRow() reconciles three known dev-team
// generations into MemoryEntry, and returns null for anything unrecognized
// — including torn/corrupt trailing lines from a mid-write crash, which is
// how "torn-line discard on read" is satisfied: an unparseable row simply
// fails every shape check below.
//
//   1. pre-capture-repair legacy:  { id, timestamp, key, insight, confidence }
//   2. capture-repair shape:       { kind, ts, agent, severity, tags, summary, source }
//      (no id, no supersedes)
//   3. MemoryEntrySchema:          the full shape, already valid as-is.
//
// Ported from dev-team's scripts/lib/memory/legacy-adapter.ts (FEAT-188 S2)
// — astragenie/plugins-common W3a. This is pure normalization logic with no
// I/O and no hardcoded artifact paths, so — unlike capture-learning.ts,
// inject-recall.ts, and drift-check.ts — it travels with the package rather
// than staying consumer-local. fileProvider's default `normalizeRow` is
// this function; generation 3 (already-schema-valid rows) is the only case
// a brand-new consumer with no legacy store ever exercises, so bringing
// generations 1-2 along costs nothing for a fresh store and preserves exact
// behavioral parity for a consumer (like dev-team) migrating an existing one.
import {
  type MemoryEntry,
  MemoryEntrySchema,
  type MemoryKind,
  type MemorySeverity,
} from "./schema.ts";

const MAX_SUMMARY_LENGTH = 280;
const DEFAULT_SEVERITY: MemorySeverity = "medium";
const VALID_KINDS: MemoryKind[] = ["failure", "lesson", "decision", "standard_violation"];

function isValidKind(value: unknown): value is MemoryKind {
  return typeof value === "string" && (VALID_KINDS as string[]).includes(value);
}

function isValidSeverity(value: unknown): value is MemorySeverity {
  return typeof value === "string" && ["critical", "high", "medium", "low"].includes(value);
}

function fromCaptureRepairShape(
  raw: Record<string, unknown>,
  indexHint: number,
): MemoryEntry | null {
  const candidate = {
    id: typeof raw.id === "string" && raw.id.length > 0 ? raw.id : `legacy-gen2-${indexHint}`,
    ts: raw.ts,
    kind: isValidKind(raw.kind) ? raw.kind : "failure",
    severity: isValidSeverity(raw.severity) ? raw.severity : DEFAULT_SEVERITY,
    agent: typeof raw.agent === "string" ? raw.agent : null,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    summary: (raw.summary as string).slice(0, MAX_SUMMARY_LENGTH),
    source: raw.source,
  };
  const parsed = MemoryEntrySchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

function fromPreCaptureRepairShape(
  raw: Record<string, unknown>,
  indexHint: number,
): MemoryEntry | null {
  const candidate = {
    id: typeof raw.id === "string" && raw.id.length > 0 ? raw.id : `legacy-gen1-${indexHint}`,
    ts: raw.timestamp,
    kind: "lesson" as const,
    severity: DEFAULT_SEVERITY,
    agent: null,
    tags: typeof raw.key === "string" ? [raw.key] : [],
    summary: (raw.insight as string).slice(0, MAX_SUMMARY_LENGTH),
    source: "legacy",
  };
  const parsed = MemoryEntrySchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

/** Normalize one raw JSONL row into a MemoryEntry, or null when unrecognized/torn. */
export function normalizeLegacyRow(raw: unknown, indexHint: number): MemoryEntry | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;

  // Generation 3: already schema-valid as-is.
  const direct = MemoryEntrySchema.safeParse(row);
  if (direct.success) return direct.data;

  // Generation 2: capture-repair shape.
  if (
    typeof row.summary === "string" &&
    typeof row.source === "string" &&
    typeof row.ts === "string"
  ) {
    return fromCaptureRepairShape(row, indexHint);
  }

  // Generation 1: pre-capture-repair legacy shape.
  if (typeof row.insight === "string" && typeof row.timestamp === "string") {
    return fromPreCaptureRepairShape(row, indexHint);
  }

  return null;
}
