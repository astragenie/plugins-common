import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { append, appendBatch, readSafe, rotate, tail } from "../src/jsonl.ts";

let root: string;
let file: string;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "plugin-std-jsonl-"));
  file = join(root, "records.jsonl");
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("jsonl.append", () => {
  test("happy path: appends one record, creating the parent dir + file", async () => {
    const nested = join(root, "nested", "dir", "records.jsonl");
    await append(nested, { id: 1, name: "a" });
    const { records, skipped } = await readSafe<{ id: number; name: string }>(nested);
    expect(records).toEqual([{ id: 1, name: "a" }]);
    expect(skipped).toBe(0);
  });

  test("happy path: successive appends accumulate lines in order", async () => {
    await append(file, { id: 1 });
    await append(file, { id: 2 });
    const { records } = await readSafe<{ id: number }>(file);
    expect(records).toEqual([{ id: 1 }, { id: 2 }]);
  });
});

describe("jsonl.appendBatch", () => {
  test("happy path: writes all records in one call", async () => {
    await appendBatch(file, [{ id: 1 }, { id: 2 }, { id: 3 }]);
    const { records, skipped } = await readSafe<{ id: number }>(file);
    expect(records).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(skipped).toBe(0);
  });

  test("empty batch is a no-op and does not create the file", async () => {
    await appendBatch(file, []);
    const { records } = await readSafe(file);
    expect(records).toEqual([]);
  });
});

describe("jsonl.readSafe", () => {
  test("missing file returns empty result, never throws", async () => {
    const result = await readSafe(join(root, "does-not-exist.jsonl"));
    expect(result).toEqual({ records: [], skipped: 0 });
  });

  // AC-2 / M2: a torn (partially-written) final line must be dropped and
  // counted, never thrown, so a reader survives a crash mid-append.
  test("torn final line: returns well-formed lines plus a skipped count, does not throw", async () => {
    await appendBatch(file, [{ id: 1 }, { id: 2 }]);
    const existing = readFileSync(file, "utf8");
    // Simulate a crash mid-write: append a truncated JSON line with no trailing newline.
    writeFileSync(file, `${existing}{"id":3,"name":"unfinis`);

    let thrown: unknown;
    let result: Awaited<ReturnType<typeof readSafe>> | undefined;
    try {
      result = await readSafe(file);
    } catch (caught) {
      thrown = caught;
    }

    expect(thrown).toBeUndefined();
    expect(result?.records).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result?.skipped).toBe(1);
  });

  test("custom parse function can also count schema violations as skipped", async () => {
    await appendBatch(file, [{ id: 1 }, { id: "not-a-number" }]);
    const parse = (raw: string) => {
      const parsed = JSON.parse(raw) as { id: unknown };
      if (typeof parsed.id !== "number") throw new Error("id must be a number");
      return parsed as { id: number };
    };
    const { records, skipped } = await readSafe(file, parse);
    expect(records).toEqual([{ id: 1 }]);
    expect(skipped).toBe(1);
  });
});

describe("jsonl.tail", () => {
  test("happy path: returns the last N well-formed records in order", async () => {
    await appendBatch(
      file,
      Array.from({ length: 5 }, (_, i) => ({ id: i })),
    );
    const lastTwo = await tail<{ id: number }>(file, 2);
    expect(lastTwo).toEqual([{ id: 3 }, { id: 4 }]);
  });

  test("count larger than record count returns all records", async () => {
    await appendBatch(file, [{ id: 1 }, { id: 2 }]);
    const result = await tail<{ id: number }>(file, 10);
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });
});

describe("jsonl.rotate", () => {
  test("happy path: rotates the file out of the way and returns true", async () => {
    await append(file, { id: 1 });
    const archivePath = join(root, "records.archived.jsonl");
    const rotated = await rotate(file, { archivePath });
    expect(rotated).toBe(true);
    const archived = await readSafe<{ id: number }>(archivePath);
    expect(archived.records).toEqual([{ id: 1 }]);
    const current = await readSafe(file);
    expect(current.records).toEqual([]);
  });

  test("below maxBytes threshold: skipped, returns false", async () => {
    await append(file, { id: 1 });
    const rotated = await rotate(file, { maxBytes: 1_000_000 });
    expect(rotated).toBe(false);
    const { records } = await readSafe<{ id: number }>(file);
    expect(records).toEqual([{ id: 1 }]);
  });

  // Primary branch (SLICE-02 review gap): file size actually exceeds maxBytes,
  // so rotation must trigger — archive gets the prior content, active path is reset.
  test("above maxBytes threshold: rotates the file out of the way and returns true", async () => {
    await appendBatch(file, [{ id: 1 }, { id: 2 }, { id: 3 }]);
    const sizeBytes = Buffer.byteLength(readFileSync(file, "utf8"), "utf8");
    const archivePath = join(root, "records.rotated.jsonl");

    const rotated = await rotate(file, { maxBytes: sizeBytes - 1, archivePath });

    expect(rotated).toBe(true);
    const archived = await readSafe<{ id: number }>(archivePath);
    expect(archived.records).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const current = await readSafe(file);
    expect(current.records).toEqual([]);
  });

  // Boundary: rotate() checks `size <= maxBytes` to skip, so a size exactly
  // equal to maxBytes must NOT rotate (only strictly-greater sizes do).
  test("size exactly at maxBytes threshold: boundary is inclusive, not rotated", async () => {
    await appendBatch(file, [{ id: 1 }, { id: 2 }]);
    const sizeBytes = Buffer.byteLength(readFileSync(file, "utf8"), "utf8");

    const rotated = await rotate(file, { maxBytes: sizeBytes });

    expect(rotated).toBe(false);
    const { records } = await readSafe<{ id: number }>(file);
    expect(records).toEqual([{ id: 1 }, { id: 2 }]);
  });

  test("missing file: skipped, returns false, does not throw", async () => {
    const rotated = await rotate(join(root, "does-not-exist.jsonl"));
    expect(rotated).toBe(false);
  });
});
