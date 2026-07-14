// @astragenie/memory-provider — noop-provider.ts
//
// Default provider when no `memory` block is configured (or when the
// enabled x provider precedence resolves to effective-disabled). Zero disk
// I/O, zero side effects.
//
// Extracted verbatim from dev-team's scripts/lib/memory/noop-provider.ts
// (FEAT-188 S2) — astragenie/plugins-common W3a.
import type { MemoryProvider } from "./types.ts";

export function noopProvider(): MemoryProvider {
  return {
    describe: () => ({ provider: "noop" }),
    async capture() {
      // Intentionally a no-op.
    },
    async recall() {
      return [];
    },
    async supersede() {
      // Intentionally a no-op.
    },
    async invalidate() {
      // Intentionally a no-op.
    },
    async profile() {
      return null;
    },
    async feedback() {
      return false;
    },
  };
}
