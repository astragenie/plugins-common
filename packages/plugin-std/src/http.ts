/**
 * Transport-policy HTTP helpers: `fetchWithTimeout` fetches with an
 * `AbortSignal` that fires on EITHER a caller-supplied timeout OR an external
 * signal — whichever comes first. `fetchJson` layers a `res.ok` check + JSON
 * decode on top for callers who want a parsed body instead of a raw
 * `Response`.
 *
 * Seed: gepa-core azure-openai's `linkSignal(external, internal)` pattern
 * (`packages/gepa-core/src/providers/azure-openai/index.ts:205-210`),
 * generalized so every judge provider shares one timeout implementation
 * instead of five near-duplicates — two of which (generic-openai, groq) had
 * **no timeout at all** (cross-repo consolidation review, 2026-07-07 Phase 3
 * plan §1.5). astramem's `local.ts` / `saas.ts` half of the same seed is
 * DEFERRED per plan §8.2 (mid-churn adopting `astramem-contracts`) — resume
 * only after that work settles.
 *
 * Not a full HTTP client: no retries, no interceptors, no base-URL config —
 * a thin policy wrapper over native `fetch`. Callers keep their own
 * request/response typing.
 *
 * Error policy (matches `jsonl.ts` / `result.ts`'s throw/Result split): every
 * failure here is infrastructure (network, timeout, non-2xx, malformed
 * body), so it throws a typed `TransientError` instead of returning a
 * `Result` — callers catch at their own boundary. Frozen API at extraction.
 */
import { TransientError } from "./errors.ts";

/** `RequestInit` plus a required timeout; `signal` (if given) is linked, not replaced. */
export interface FetchWithTimeoutInit extends Omit<RequestInit, "signal"> {
  /** Abort the request after this many milliseconds. */
  timeoutMs: number;
  /** Optional external signal — the request also aborts when this fires. */
  signal?: AbortSignal | undefined;
}

/** A linked timeout signal plus its cleanup handle. */
export interface TimeoutSignal {
  /** Aborts on timeout elapse or external abort, whichever fires first. */
  readonly signal: AbortSignal;
  /**
   * Clear the timeout timer. Callers MUST call this once the operation
   * settles (success or failure) so the timer doesn't leak / keep the event
   * loop alive.
   */
  readonly clear: () => void;
}

/**
 * Build an `AbortSignal` that aborts when EITHER `timeoutMs` elapses OR
 * `external` (if given) aborts — generalizes gepa-core azure-openai's
 * `linkSignal(external, internal)` helper so timeout + external-signal
 * linking is implemented once instead of per-provider.
 */
export function withTimeoutSignal(timeoutMs: number, external?: AbortSignal): TimeoutSignal {
  const controller = new AbortController();

  let onExternalAbort: (() => void) | undefined;
  if (external) {
    if (external.aborted) {
      controller.abort(external.reason);
    } else {
      onExternalAbort = () => controller.abort(external.reason);
      external.addEventListener("abort", onExternalAbort, { once: true });
    }
  }

  const timer = setTimeout(() => {
    controller.abort(new DOMException("The operation timed out.", "TimeoutError"));
  }, timeoutMs);

  return {
    signal: controller.signal,
    clear: () => {
      clearTimeout(timer);
      // `{ once: true }` deregisters the listener once the signal actually
      // fires, but a shared external signal (e.g. one AbortSignal reused
      // across every candidate x case in a run) is typically never aborted
      // for most calls that use it — without an explicit removeEventListener
      // here, every completed call leaves a permanent listener behind and
      // accumulates without bound over the life of the shared signal.
      if (onExternalAbort) {
        external?.removeEventListener("abort", onExternalAbort);
      }
    },
  };
}

/**
 * `fetch` with a timeout linked to an optional external `AbortSignal`.
 * Throws a `TransientError` (`E_HTTP_FETCH`) on network failure, timeout, or
 * external cancellation — never a raw `Error`. Clears the timeout timer on
 * every exit path (success or failure) so no timer leaks.
 */
export async function fetchWithTimeout(
  input: string | URL,
  init: FetchWithTimeoutInit,
): Promise<Response> {
  const { timeoutMs, signal: external, ...rest } = init;
  const { signal, clear } = withTimeoutSignal(timeoutMs, external);
  try {
    return await fetch(input, { ...rest, signal });
  } catch (cause) {
    throw new TransientError(`fetchWithTimeout: request failed: ${String(input)}`, {
      code: "E_HTTP_FETCH",
      cause,
    });
  } finally {
    clear();
  }
}

/**
 * `fetchWithTimeout` + `res.ok` check + JSON decode. Throws `TransientError`
 * on non-2xx status (`E_HTTP_STATUS`, `status` carries the HTTP code) or a
 * malformed JSON body (`E_HTTP_PARSE`).
 */
export async function fetchJson<T = unknown>(
  input: string | URL,
  init: FetchWithTimeoutInit,
): Promise<T> {
  const res = await fetchWithTimeout(input, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new TransientError(`fetchJson: HTTP ${res.status}: ${text.slice(0, 200)}`, {
      code: "E_HTTP_STATUS",
      status: res.status,
    });
  }
  try {
    return (await res.json()) as T;
  } catch (cause) {
    throw new TransientError("fetchJson: response body is not valid JSON", {
      code: "E_HTTP_PARSE",
      cause,
    });
  }
}
