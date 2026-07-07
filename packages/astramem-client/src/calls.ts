// Wallclock-capped, fail-silent call wrappers over the resolved wire
// provider. The cap covers resolution + the call itself in one envelope so a
// cold first resolution cannot stack with a slow provider call (the lesson
// from runner-plugin#360: "silent" without "bounded" still hangs the hot
// path). Losing branches are abandoned, not cancelled — the plugin's
// providers carry their own internal fetch timeouts, so strays settle and
// do not keep a short-lived CLI process alive indefinitely.

import { resolveWireProvider } from "./resolve.ts";
import type { IngestPayload, RecallRequest, RecallResponse } from "./types.ts";

/** Default wallclock envelope per operation (matches the 2s fire-and-forget
 * contract shared by dev-team capture and runner-plugin's memory sink). */
export const DEFAULT_CAP_MS = 2000;

export interface CallOptions {
  /** Wallclock envelope in ms (resolution + call). Default DEFAULT_CAP_MS. */
  capMs?: number | undefined;
}

/** Race a promise against the cap; resolve `fallback` on timeout or
 * rejection. Never rejects. */
async function withCap<T>(p: Promise<T>, fallback: T, capMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const capped = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), capMs);
  });
  try {
    return await Promise.race([p.catch(() => fallback), capped]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fire a `remember` at the resolved provider. Resolves `true` when the
 * provider accepted the payload, `false` on ANY failure (no provider,
 * rejection, cap exceeded). Never throws.
 */
export async function rememberSilent(
  payload: IngestPayload,
  opts: CallOptions = {},
): Promise<boolean> {
  const capMs = opts.capMs ?? DEFAULT_CAP_MS;
  const deadline = Date.now() + capMs;
  try {
    const provider = await withCap(resolveWireProvider(), null, capMs);
    if (!provider) return false;
    const remaining = deadline - Date.now();
    if (remaining <= 0) return false;
    return await withCap(
      provider.remember(payload).then(() => true),
      false,
      remaining,
    );
  } catch {
    return false;
  }
}

/**
 * Run a `recall` against the resolved provider. Resolves the response or
 * `null` on ANY failure. Never throws.
 */
export async function recallSilent(
  req: RecallRequest,
  opts: CallOptions = {},
): Promise<RecallResponse | null> {
  const capMs = opts.capMs ?? DEFAULT_CAP_MS;
  const deadline = Date.now() + capMs;
  try {
    const provider = await withCap(resolveWireProvider(), null, capMs);
    if (!provider) return null;
    const remaining = deadline - Date.now();
    if (remaining <= 0) return null;
    return await withCap(
      provider.recall(req).then((res) => res ?? null),
      null,
      remaining,
    );
  } catch {
    return null;
  }
}
