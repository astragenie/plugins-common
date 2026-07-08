/**
 * Typed error taxonomy for the Astragenie plugin ecosystem.
 *
 * Merges the two conventions the cross-repo review blessed (2026-07-07 Phase 2 §4a):
 *   - astramem's `DeterministicError` / `TransientError` retry-kind split
 *     (`astramemory-plugin/src/lib/errors.ts`)
 *   - dev-team's "throw typed for infrastructure, convert at the boundary" policy
 *     (`dev-team/scripts/lib/result.ts` header)
 *
 * Every thrown error in a plugins-common package should be a `PluginError` so
 * callers can branch on `code` (stable, machine-readable) and `transient`
 * (retry-safe?) instead of string-matching messages.
 */

/** Optional context attached at throw time. */
export interface ErrorContext {
  /** HTTP status or numeric provider code, when the failure carries one. */
  readonly status?: number;
  /** Underlying cause (e.g. a `TypeError` from fetch, a `ZodError`). */
  readonly cause?: unknown;
}

/**
 * Base class for every error a plugins-common package throws on purpose.
 *
 * `code` is abstract so no `PluginError` is thrown without a stable identifier;
 * `transient` tells a caller whether an automatic retry could succeed.
 */
export abstract class PluginError extends Error {
  /** Stable, machine-readable error identifier (e.g. `E_DETERMINISTIC`). */
  abstract readonly code: string;
  /** True when retrying the same operation could plausibly succeed. */
  readonly transient: boolean = false;
  /** HTTP status / numeric provider code, or `undefined` when not applicable. */
  readonly status: number | undefined;

  constructor(message: string, ctx?: ErrorContext) {
    // Only pass ErrorOptions when a cause exists (exactOptionalPropertyTypes).
    super(message, ctx?.cause !== undefined ? { cause: ctx.cause } : undefined);
    this.status = ctx?.status;
    // Maintain the prototype chain in transpiled / cross-realm output.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * A failure that will not succeed on retry with the same input:
 * validation rejection, 4xx, malformed data, contract violation.
 */
export class DeterministicError extends PluginError {
  override readonly transient = false;
  readonly code: string;

  constructor(message: string, ctx?: ErrorContext & { code?: string }) {
    super(message, ctx);
    this.name = "DeterministicError";
    this.code = ctx?.code ?? "E_DETERMINISTIC";
  }
}

/**
 * A failure that may succeed on retry: network blip, 5xx, timeout, transient
 * lock contention.
 */
export class TransientError extends PluginError {
  override readonly transient = true;
  readonly code: string;

  constructor(message: string, ctx?: ErrorContext & { code?: string }) {
    super(message, ctx);
    this.name = "TransientError";
    this.code = ctx?.code ?? "E_TRANSIENT";
  }
}

/** Type guard: is `err` one of our typed plugin errors? */
export function isPluginError(err: unknown): err is PluginError {
  return err instanceof PluginError;
}

/** Convenience: is `err` a plugin error the caller may safely retry? */
export function isTransient(err: unknown): boolean {
  return err instanceof PluginError && err.transient;
}
