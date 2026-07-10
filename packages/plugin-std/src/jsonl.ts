/**
 * Newline-delimited JSON (JSONL) helpers shared across the Astragenie plugin
 * ecosystem: `append`, `appendBatch`, `readSafe`, `tail`, and opt-in `rotate`.
 *
 * Seed: runner's `src/scripts/lib/jsonl-append.mts` (most stable append
 * candidate found in the cross-repo review, 2026-07-07 Phase 3 plan §1.2) +
 * gepa-core's guarded-read pattern (`src/store/file-store.ts:13-31`).
 *
 * Error policy (matches `result.ts`'s throw/Result split): every op here is
 * infrastructure (filesystem), so failures throw a typed `PluginError`
 * instead of returning a `Result` — callers catch at their own boundary.
 * `readSafe` is the one deliberate exception to "fs errors throw": a torn or
 * malformed line is an *expected* outcome of crash recovery, not a failure,
 * so it is counted (`skipped`) rather than thrown (closes the
 * two-swallow-disciplines defect, M2 — torn-line counting is the default).
 */
import { appendFile, mkdir, readFile, rename, stat } from "node:fs/promises";
import { dirname } from "node:path";
import { DeterministicError, TransientError } from "./errors.ts";

function isEnoent(cause: unknown): boolean {
  return (
    typeof cause === "object" &&
    cause !== null &&
    "code" in cause &&
    (cause as NodeJS.ErrnoException).code === "ENOENT"
  );
}

function serializeLines(records: readonly unknown[]): string {
  try {
    return records.map((record) => `${JSON.stringify(record)}\n`).join("");
  } catch (cause) {
    throw new DeterministicError("jsonl: record is not JSON-serializable", {
      code: "E_JSONL_SERIALIZE",
      cause,
    });
  }
}

async function writeLines(path: string, lines: string): Promise<void> {
  try {
    await mkdir(dirname(path), { recursive: true });
    await appendFile(path, lines, "utf8");
  } catch (cause) {
    throw new TransientError(`jsonl: append failed for ${path}`, {
      code: "E_JSONL_WRITE",
      cause,
    });
  }
}

/** Append a single record as one JSONL line. Creates the parent dir + file as needed. */
export async function append(path: string, record: unknown): Promise<void> {
  await writeLines(path, serializeLines([record]));
}

/**
 * Append multiple records in one write call (atomic-ish: a single `appendFile`
 * syscall instead of N, so a concurrent reader never observes an interleaved
 * partial record from this batch).
 */
export async function appendBatch(path: string, records: readonly unknown[]): Promise<void> {
  if (records.length === 0) return;
  await writeLines(path, serializeLines(records));
}

/** Result of a `readSafe` call: well-formed records plus a count of skipped torn/malformed lines. */
export interface JsonlReadResult<T> {
  readonly records: readonly T[];
  readonly skipped: number;
}

/**
 * Read + parse every line of a JSONL file, never throwing on a missing file
 * or a torn/malformed line — the two failure modes a crash-recovery reader
 * must expect. Returns well-formed records plus a `skipped` count instead.
 *
 * `parse` defaults to `JSON.parse`; pass a schema-validating parser (e.g.
 * `(raw) => MySchema.parse(JSON.parse(raw))`) to also count schema
 * violations as skipped lines rather than well-formed-but-wrong records.
 */
export async function readSafe<T = unknown>(
  path: string,
  parse: (raw: string) => T = (raw) => JSON.parse(raw) as T,
): Promise<JsonlReadResult<T>> {
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (cause) {
    if (isEnoent(cause)) return { records: [], skipped: 0 };
    throw new TransientError(`jsonl: read failed for ${path}`, { code: "E_JSONL_READ", cause });
  }

  const records: T[] = [];
  let skipped = 0;
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    try {
      records.push(parse(trimmed));
    } catch {
      // Torn (partially-written) or malformed line — crash-recovery invariant: count, don't throw.
      skipped++;
    }
  }
  return { records, skipped };
}

/** Return the last `count` well-formed records in the file (order preserved). */
export async function tail<T = unknown>(
  path: string,
  count: number,
  parse?: (raw: string) => T,
): Promise<readonly T[]> {
  const { records } = await readSafe(path, parse);
  return count >= records.length ? records : records.slice(records.length - count);
}

/** Options for the opt-in `rotate` op. */
export interface RotateOptions {
  /** Only rotate when the file is at least this many bytes. Omit to always rotate. */
  readonly maxBytes?: number;
  /** Destination for the rotated-out file. Defaults to `${path}.<epoch-ms>`. */
  readonly archivePath?: string;
}

/**
 * Opt-in rotation: rename the current file out of the way once it crosses
 * `maxBytes` (or unconditionally, if omitted), so the next `append` starts a
 * fresh file. Returns `true` when a rotation happened, `false` when skipped
 * (file absent, or under the size threshold).
 */
export async function rotate(path: string, opts: RotateOptions = {}): Promise<boolean> {
  let size: number;
  try {
    size = (await stat(path)).size;
  } catch (cause) {
    if (isEnoent(cause)) return false;
    throw new TransientError(`jsonl: rotate stat failed for ${path}`, {
      code: "E_JSONL_ROTATE_STAT",
      cause,
    });
  }

  if (opts.maxBytes !== undefined && size <= opts.maxBytes) return false;

  const archivePath = opts.archivePath ?? `${path}.${Date.now()}`;
  try {
    await rename(path, archivePath);
  } catch (cause) {
    throw new TransientError(`jsonl: rotate rename failed for ${path}`, {
      code: "E_JSONL_ROTATE_RENAME",
      cause,
    });
  }
  return true;
}
