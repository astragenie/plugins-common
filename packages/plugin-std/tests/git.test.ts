import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DeterministicError, TransientError } from "../src/errors.ts";
import { runGit } from "../src/git.ts";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "plugin-std-git-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("runGit — AC-1: successful command", () => {
  test("git --version returns ok:true, status:0, captured stdout", async () => {
    const result = await runGit(["--version"]);
    expect(result.ok).toBe(true);
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/^git version/);
    expect(result.stderr).toBe("");
  });

  test("git init + git rev-parse in a temp dir returns ok:true with captured stdout", async () => {
    const init = await runGit(["init"], { cwd: tempDir });
    expect(init.ok).toBe(true);
    expect(init.status).toBe(0);

    const revParse = await runGit(["rev-parse", "--is-inside-work-tree"], { cwd: tempDir });
    expect(revParse.ok).toBe(true);
    expect(revParse.status).toBe(0);
    expect(revParse.stdout).toBe("true");
  });

  test("cwd option scopes the command to the given directory", async () => {
    await runGit(["init"], { cwd: tempDir });
    const revParse = await runGit(["rev-parse", "--show-toplevel"], { cwd: tempDir });
    expect(revParse.ok).toBe(true);
    // Resolve both sides through the same normalization so drive-letter /
    // trailing-slash / symlink formatting differences don't false-fail.
    expect(revParse.stdout.replace(/\\/g, "/").toLowerCase()).toContain(
      tempDir.replace(/\\/g, "/").toLowerCase().split(/[\\/]/).pop() as string,
    );
  });

  test("args are passed through positionally (no shell interpolation)", async () => {
    await runGit(["init"], { cwd: tempDir });
    // A literal string containing shell metacharacters must round-trip
    // untouched — proof args go straight to execFile, not through a shell.
    const message = "feat: add $HOME && echo pwned; `whoami`";
    await runGit(["config", "user.email", "test@example.test"], { cwd: tempDir });
    await runGit(["config", "user.name", "Test"], { cwd: tempDir });
    await runGit(["commit", "--allow-empty", "-m", message], { cwd: tempDir });
    const log = await runGit(["log", "-1", "--format=%s"], { cwd: tempDir });
    expect(log.ok).toBe(true);
    expect(log.stdout).toBe(message);
  });
});

describe("runGit — AC-2: non-zero exit does not throw", () => {
  test("git rev-parse --verify HEAD in a fresh empty repo returns ok:false with status + stderr", async () => {
    await runGit(["init"], { cwd: tempDir });
    const result = await runGit(["rev-parse", "--verify", "HEAD"], { cwd: tempDir });
    expect(result.ok).toBe(false);
    expect(result.status).not.toBe(0);
    expect(result.stderr.length).toBeGreaterThan(0);
  });

  test("an unknown git subcommand returns ok:false with non-zero status and stderr, no throw", async () => {
    const result = await runGit(["nonsense-subcommand"], { cwd: tempDir });
    expect(result.ok).toBe(false);
    expect(result.status).not.toBe(0);
    expect(result.stderr.length).toBeGreaterThan(0);
  });
});

describe("runGit — genuine spawn failure throws TransientError", () => {
  test("a missing binary throws TransientError (E_GIT_SPAWN), not a normal result", async () => {
    // execFile resolves the binary itself; point PATH-independent spawn at a
    // command that cannot exist by asking node to exec a bogus executable
    // name via a directly-invoked helper is not exposed by runGit's API, so
    // instead we force ENOENT via a cwd that does not exist — execFile fails
    // before the process ever starts, which is the same "never ran" failure
    // class as a missing git binary.
    const missingCwd = join(tempDir, "does-not-exist", "nested");
    let caught: unknown;
    try {
      await runGit(["--version"], { cwd: missingCwd });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(TransientError);
    expect(caught).toMatchObject({ code: "E_GIT_SPAWN", transient: true });
  });
});

describe("runGit — maxBuffer overflow throws DeterministicError", () => {
  test("output exceeding maxBuffer throws DeterministicError (E_GIT_MAXBUFFER), not TransientError", async () => {
    // `git --version` always produces output; a 1-byte maxBuffer guarantees
    // overflow regardless of the installed git's exact version string.
    let caught: unknown;
    try {
      await runGit(["--version"], { cwd: tempDir, maxBuffer: 1 });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(DeterministicError);
    expect(caught).not.toBeInstanceOf(TransientError);
    expect(caught).toMatchObject({ code: "E_GIT_MAXBUFFER", transient: false });
  });
});

describe("runGit — signal / timeout options", () => {
  test("an already-aborted signal rejects with TransientError instead of hanging", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(
      runGit(["--version"], { cwd: tempDir, signal: controller.signal }),
    ).rejects.toThrow(TransientError);
  });

  test("a timeoutMs shorter than the command duration kills the child and resolves ok:false, status:-1", async () => {
    // `git hash-object --stdin` blocks reading stdin for EOF that never
    // comes (runGit never writes to or closes the child's stdin), so it
    // hangs until killed — deterministically losing the race against any
    // timeoutMs, unlike a fast command such as `--version` which could
    // finish before the timer fires. On kill, execFile's callback receives
    // `error.signal === "SIGTERM"` with no numeric `error.code` — the same
    // "process ran, got killed" shape as any other signal termination, so
    // it resolves via the signal branch rather than throwing:
    // `{ok: false, status: -1}`, deterministically, never an actual hang.
    const result = await runGit(["hash-object", "--stdin"], { cwd: tempDir, timeoutMs: 1 });
    expect(result.ok).toBe(false);
    expect(result.status).toBe(-1);
  });
});
