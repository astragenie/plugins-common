import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import * as fs from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TransientError } from "@astragenie/plugin-std";
import { fileLockManager } from "../../src/lock/file-lock-manager.ts";

let locksDir: string;

beforeEach(() => {
  locksDir = mkdtempSync(join(tmpdir(), "gepa-locks-"));
});

afterEach(() => {
  rmSync(locksDir, { recursive: true, force: true });
});

describe("fileLockManager", () => {
  test("acquire-when-free: returns a release handle", async () => {
    const mgr = fileLockManager(locksDir);
    const result = await mgr.acquire("fullstack-dev", "eval");
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable: expected ok result");
    expect(result.value).not.toBeNull();
    await result.value?.released();
  });

  test("acquire-when-held-returns-ok-null: second acquire on same agent+op does not throw, resolves ok(null)", async () => {
    const mgr = fileLockManager(locksDir);
    const first = await mgr.acquire("fullstack-dev", "eval");
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error("unreachable: expected ok result");
    expect(first.value).not.toBeNull();

    const second = await mgr.acquire("fullstack-dev", "eval");
    expect(second.ok).toBe(true);
    if (!second.ok) throw new Error("unreachable: expected ok result");
    expect(second.value).toBeNull();

    await first.value?.released();
  });

  test("reclaim-stale-PID: lock file with dead PID is reclaimed and acquire succeeds", async () => {
    const mgr = fileLockManager(locksDir);

    // Write a stale lock file referencing a non-existent PID (999999)
    // with a heartbeat in the past (epoch 0 = definitely stale)
    const staleLock = {
      pid: 999999,
      op: "eval",
      agent: "fullstack-dev",
      heartbeat: 0, // epoch 0 = stale
    };
    writeFileSync(join(locksDir, "fullstack-dev__eval.lock"), JSON.stringify(staleLock));

    // Should reclaim the stale lock and succeed
    const result = await mgr.acquire("fullstack-dev", "eval");
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable: expected ok result");
    expect(result.value).not.toBeNull();
    await result.value?.released();
  });

  test("isLocked-state: reflects acquired and released states correctly", async () => {
    const mgr = fileLockManager(locksDir);

    // Initially not locked
    const initialState = await mgr.isLocked("fullstack-dev");
    expect(initialState).toBe(false);

    // After acquire: locked
    const result = await mgr.acquire("fullstack-dev", "eval");
    if (!result.ok) throw new Error("unreachable: expected ok result");
    const heldState = await mgr.isLocked("fullstack-dev");
    expect(heldState).toBe(true);

    // After release: not locked
    await result.value?.released();
    const releasedState = await mgr.isLocked("fullstack-dev");
    expect(releasedState).toBe(false);
  });

  // Gate Zero (FEAT-001 SLICE-01, AC-2): file-lock-manager.ts:63 used to `throw err`
  // for any non-EEXIST filesystem failure during acquire(). Simulate that failure
  // mode (e.g. EACCES) and assert acquire() never throws — it returns a typed,
  // transient-retryable error instead.
  test("acquire-fs-failure: unexpected filesystem error during lock acquisition never throws, surfaces as TransientError", async () => {
    const mgr = fileLockManager(locksDir);
    const spy = spyOn(fs, "writeFileSync").mockImplementation(() => {
      const error = new Error("permission denied") as NodeJS.ErrnoException;
      error.code = "EACCES";
      throw error;
    });

    try {
      let result: Awaited<ReturnType<typeof mgr.acquire>> | undefined;
      let thrown: unknown;
      try {
        result = await mgr.acquire("fullstack-dev", "eval");
      } catch (caught) {
        thrown = caught;
      }

      expect(thrown).toBeUndefined();
      expect(result).toBeDefined();
      expect(result?.ok).toBe(false);
      if (result?.ok !== false) throw new Error("unreachable: expected err result");
      expect(result.error).toBeInstanceOf(TransientError);
      expect(result.error.transient).toBe(true);
      expect(result.error.code).toBe("E_LOCK_WRITE");
    } finally {
      spy.mockRestore();
    }
  });
});
