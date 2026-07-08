/**
 * Minimal git subprocess spawn wrapper.
 *
 * Seed: dev-team's `briefing/git.ts:51-58` (byte-identical twin in
 * `branch-cleanup.ts` — both die at extraction) and the diverged
 * `gepa-killswitch-cmds.ts:51-65` sync variant (cross-repo consolidation
 * review, 2026-07-07 Phase 3 plan §1.7). This module keeps only the
 * intersection all three seeds agree on: spawn `git`, capture
 * stdout/stderr/exit status, done.
 *
 * Scope guard (plan §1.7): spawn ONLY. NO worktree logic, no branch
 * policy, no merge/prune, no retry/backoff. Callers that need those build
 * them on top of `runGit` — they do not belong in this package.
 *
 * Error policy (matches `jsonl.ts` / `http.ts`'s throw/Result split): a
 * non-zero git exit is a NORMAL result (`{ok: false, status, stderr}`),
 * not a thrown error — most git subcommands use exit status as a
 * documented signal (e.g. `rev-parse --verify` on a missing ref). A
 * genuine spawn failure (git binary missing, EACCES, etc. — the process
 * never ran) throws a `TransientError` (`E_GIT_SPAWN`), since retrying the
 * same spawn after fixing the environment could plausibly succeed. A
 * `maxBuffer` overflow (the process ran fine but produced more output than
 * `opts.maxBuffer` allows) throws a `DeterministicError` (`E_GIT_MAXBUFFER`)
 * instead — retrying identical args always overflows the same way. Frozen
 * API at extraction.
 */
import { execFile } from "node:child_process";
import type { ExecFileOptionsWithStringEncoding } from "node:child_process";
import { DeterministicError, TransientError } from "./errors.ts";

/** Result of a `runGit` invocation — mirrors the process's own exit contract. */
export interface RunGitResult {
  /** `true` iff the process ran and exited with status `0`. */
  readonly ok: boolean;
  /** Captured stdout, trimmed of a single trailing newline (if any). */
  readonly stdout: string;
  /** Captured stderr, trimmed of a single trailing newline (if any). */
  readonly stderr: string;
  /** Process exit code. `-1` when the process was terminated by a signal. */
  readonly status: number;
}

/** Options for `runGit`. All optional — plain `runGit(["--version"])` works. */
export interface RunGitOptions {
  /** Working directory for the git invocation. Defaults to `process.cwd()`. */
  readonly cwd?: string;
  /** Abort the spawn via `AbortController`/`AbortSignal`. */
  readonly signal?: AbortSignal;
  /** Kill the process if it runs longer than this many milliseconds. */
  readonly timeoutMs?: number;
  /** Max buffered stdout/stderr in bytes (`execFile`'s `maxBuffer`). */
  readonly maxBuffer?: number;
}

/** Strip exactly one trailing `\n` (or `\r\n`), matching `git`'s own output convention. */
function chomp(s: string): string {
  return s.replace(/\r?\n$/, "");
}

/**
 * Spawn `git <args>` and capture the result. Never throws on a non-zero
 * git exit — that comes back as `{ok: false, status, stderr}`. A genuine
 * spawn failure (binary missing, EACCES, aborted before start) throws
 * `TransientError`; a `maxBuffer` overflow throws `DeterministicError`.
 */
export async function runGit(args: string[], opts: RunGitOptions = {}): Promise<RunGitResult> {
  // `encoding: "utf8"` pins execFile's overload to the string-returning
  // form — without it TS widens stdout/stderr to `string | Buffer` since
  // the encoding can't be inferred from a spread options object.
  const execOpts: ExecFileOptionsWithStringEncoding = {
    encoding: "utf8",
    cwd: opts.cwd,
    signal: opts.signal,
    timeout: opts.timeoutMs,
    maxBuffer: opts.maxBuffer,
  };

  return new Promise<RunGitResult>((resolve, reject) => {
    execFile("git", args, execOpts, (error, stdout, stderr) => {
      if (error === null) {
        resolve({ ok: true, stdout: chomp(stdout), stderr: chomp(stderr), status: 0 });
        return;
      }

      // `error.code` discriminates three distinct failure classes:
      //   - a number: the process ran and exited non-zero.
      //   - the string "ERR_CHILD_PROCESS_STDIO_MAXBUFFER": the process ran
      //     and produced MORE output than `opts.maxBuffer` allows — not a
      //     spawn failure, and not transient (identical args will always
      //     overflow the same way on retry).
      //   - any other string (e.g. "ENOENT", "EACCES") or absent with no
      //     `error.signal`: a genuine spawn failure — the process never ran.
      // Absent `error.code` WITH `error.signal` set means OS/timeout signal
      // termination, handled separately below.
      if (typeof error.code === "number") {
        resolve({
          ok: false,
          stdout: chomp(stdout),
          stderr: chomp(stderr),
          status: error.code,
        });
        return;
      }

      if (error.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER") {
        reject(
          new DeterministicError(
            `runGit: git ${args.join(" ")} produced more output than maxBuffer ` +
              `(${execOpts.maxBuffer ?? "1048576 (Node default)"} bytes) allows; raise opts.maxBuffer`,
            { code: "E_GIT_MAXBUFFER", cause: error },
          ),
        );
        return;
      }

      if (error.signal) {
        resolve({ ok: false, stdout: chomp(stdout), stderr: chomp(stderr), status: -1 });
        return;
      }

      reject(
        new TransientError(`runGit: failed to spawn git ${args.join(" ")}`, {
          code: "E_GIT_SPAWN",
          cause: error,
        }),
      );
    });
  });
}
