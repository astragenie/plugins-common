/**
 * Typed Result for domain operations with expected failure modes.
 *
 * Use for: validation errors, business-rule violations, not-found, conflicts,
 * and "resource unavailable due to contention" (e.g. a lock already held by
 * a live process) — all of these are *expected* domain outcomes, not
 * failures.
 * Do NOT use for: infrastructure errors (fs ENOENT/EACCES, network) — those
 * are genuinely unexpected and still throw (as a typed `PluginError`) and are
 * caught at the entrypoint / boundary.
 *
 * Convert at the function boundary: never leak a `throw` out of a Result-typed
 * function, and never return a Result from a function documented to throw.
 *
 * The line to draw (DEC-002, `.claude/artifacts/loop/decisions/DEC-002.md`):
 * ask "would a caller reasonably retry / branch on this as routine control
 * flow?" If yes (contention, not-found, validation) → `Result`. If the
 * answer is "no, something is actually broken" (disk full, permission
 * denied, connection refused) → `throw`. Do not fold an unexpected infra
 * failure into the same `Result` error channel as an expected domain
 * outcome just because a caller happens to poll in a loop — a real fs/network
 * fault masquerading as "try again" is the exact anti-pattern DEC-002
 * corrected in `file-lock-manager.ts`'s `acquire()`/`tryAtomicWrite()`.
 *
 * Seed: `dev-team/scripts/lib/result.ts` (policy header verbatim), the only
 * repo whose Result/throw split was both documented and followed (review §4a).
 */
import type { PluginError } from "./errors.ts";

export type Result<T, E = PluginError> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });

export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export const map = <T, U, E>(r: Result<T, E>, f: (t: T) => U): Result<U, E> =>
  r.ok ? ok(f(r.value)) : r;

export const flatMap = <T, U, E>(r: Result<T, E>, f: (t: T) => Result<U, E>): Result<U, E> =>
  r.ok ? f(r.value) : r;

/** Unwrap a Result, throwing the error branch. Use only at a boundary. */
export const unwrap = <T, E>(r: Result<T, E>): T => {
  if (r.ok) return r.value;
  throw r.error;
};
