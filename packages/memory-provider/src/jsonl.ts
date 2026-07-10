// @astragenie/memory-provider — jsonl.ts
//
// Self-contained JSONL append/tail-read primitives for fileProvider. Ported
// from dev-team's scripts/lib/jsonl.mjs (tailReadJsonl) and
// scripts/lib/memory/capture-learning.ts (appendJsonlEntry) —
// astragenie/plugins-common W3a.
//
// Deliberately NOT swapped for @astragenie/plugin-std's `./jsonl` `tail()`:
// that helper reads the whole file, which is a perf regression on a large
// recall log (the same reason dev-team kept this local through W2). This
// module's tailReadJsonl seeks to a bounded byte window from the end of the
// file instead of reading it in full.
import { appendFile, mkdir, open } from "node:fs/promises";
import * as path from "node:path";

const DEFAULT_TAIL_BYTES = 64 * 1024;

/**
 * Append one JSON line to `repoPath/segments...`. Creates parent
 * directories as needed. Fire-and-forget: never throws.
 */
export async function appendJsonlEntry(
  repoPath: string,
  segments: string[],
  entry: Record<string, unknown>,
): Promise<void> {
  try {
    const targetPath = path.join(repoPath, ...segments);
    await mkdir(path.dirname(targetPath), { recursive: true });
    // O_APPEND — atomic append, safe under concurrent writers.
    await appendFile(targetPath, `${JSON.stringify(entry)}\n`, { flag: "a" });
  } catch {
    // Fire-and-forget: never propagate.
  }
}

/**
 * Reads the last `maxBytes` of a JSONL file and returns up to `count` parsed
 * objects from the tail. Discards the first (possibly truncated) line when
 * the read starts mid-file. Returns an empty array when the file is absent
 * or empty.
 */
export async function tailReadJsonl(
  filePath: string,
  count: number,
  options: { maxBytes?: number } = {},
): Promise<Record<string, unknown>[]> {
  const maxBytes = options.maxBytes ?? DEFAULT_TAIL_BYTES;
  let handle: Awaited<ReturnType<typeof open>>;
  try {
    handle = await open(filePath, "r");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  try {
    const stat = await handle.stat();
    if (stat.size === 0) return [];

    const start = Math.max(0, stat.size - maxBytes);
    const length = stat.size - start;
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, start);

    let raw = buffer.toString("utf8");
    if (start > 0) {
      const firstNewline = raw.indexOf("\n");
      raw = firstNewline === -1 ? "" : raw.slice(firstNewline + 1);
    }

    return raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(-count)
      .map((line) => {
        try {
          return JSON.parse(line) as Record<string, unknown>;
        } catch {
          return {};
        }
      });
  } finally {
    await handle.close();
  }
}
