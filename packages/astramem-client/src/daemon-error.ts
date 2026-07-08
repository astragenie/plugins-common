// Typed error for AstramemDaemonClient — mirrors astramemory-plugin's
// src/providers/local.ts error bands (DeterministicError / TransientError)
// under one class so callers switch on `.band` instead of `instanceof`.

export type DaemonErrorBand = "deterministic" | "transient";

export interface DaemonErrorOptions {
  /** 'deterministic' — 4xx, do not retry. 'transient' — 5xx/network/timeout, safe to retry. */
  band: DaemonErrorBand;
  /** HTTP status code, when the failure came from a response (absent for network/timeout errors). */
  status?: number;
  /** Parsed JSON body when the response was JSON, else raw text; undefined if the body couldn't be read. */
  body?: unknown;
  cause?: unknown;
}

export class DaemonError extends Error {
  readonly band: DaemonErrorBand;
  readonly status: number | undefined;
  readonly body: unknown;

  constructor(message: string, opts: DaemonErrorOptions) {
    super(message, opts.cause !== undefined ? { cause: opts.cause } : undefined);
    this.name = "DaemonError";
    this.band = opts.band;
    this.status = opts.status;
    this.body = opts.body;
  }

  /** 4xx — the request itself was rejected; retrying unchanged will not help. */
  get isDeterministic(): boolean {
    return this.band === "deterministic";
  }

  /** 5xx / network / timeout — may succeed on retry. */
  get isTransient(): boolean {
    return this.band === "transient";
  }
}
