// In-memory per-session turn counter backing the "every N turns -> profile
// injection" cadence (profile.ts). Deliberately NOT persisted: it resets on
// gateway restart, which just means the first N turns after a restart don't
// trigger an early profile refresh — acceptable for a periodic nice-to-have,
// and it avoids taking a dependency on OpenClaw's session-extension
// persistence API (`api.session.state.registerSessionExtension`, per
// docs.openclaw.ai/plugins/hooks), which this plugin hasn't exercised
// against a live gateway.

const counts = new Map<string, number>();

/** Increment the counter for `key` and report whether it just reached a
 * multiple of `everyN` (true on turns N, 2N, 3N, ...). */
export function bumpAndCheck(key: string, everyN: number): boolean {
  const next = (counts.get(key) ?? 0) + 1;
  counts.set(key, next);
  return everyN > 0 && next % everyN === 0;
}

/** Test seam: clear all counters between test cases. */
export function _resetTurnCounters(): void {
  counts.clear();
}
