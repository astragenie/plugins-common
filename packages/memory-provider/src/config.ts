// @astragenie/memory-provider — config.ts
//
// Parses the unified `memory` config block and resolves the enabled x
// provider precedence rule:
//   - provider:"none" forces effective-disabled regardless of `enabled`.
//   - enabled:"never" disables emit/recall regardless of `provider`.
//   - provider:"file"|"astramem" with enabled:"auto" is active.
//   - recall.enabled is a separate kill-switch scoped to recall only.
//
// Extracted verbatim from dev-team's scripts/lib/memory/config.ts
// (FEAT-188 S2) — astragenie/plugins-common W3a. Not called out by name in
// the original T0-A extraction map, but it is resolve-provider.ts's only
// non-schema dependency and carries zero dev-team-specific coupling, so it
// travels with resolve-provider.ts.
import { type MemoryConfig, MemoryConfigSchema, type MemoryProviderKind } from "./schema.ts";

/** Parse + validate a raw `memory` config block. Absent/undefined -> all defaults (provider:"none"). */
export function parseMemoryConfig(raw: unknown): MemoryConfig {
  return MemoryConfigSchema.parse(raw ?? {});
}

export interface EffectiveMemoryConfig {
  captureEnabled: boolean;
  recallEnabled: boolean;
  provider: MemoryProviderKind;
  dualWrite: boolean;
  recall: { k: number; timeoutMs: number; maxTokens: number };
  project: string | undefined;
}

/** Resolve the enabled x provider precedence rule into a single effective config. */
export function resolveEffectiveConfig(config: MemoryConfig): EffectiveMemoryConfig {
  const providerDisabled = config.provider === "none";
  const enabledDisabled = config.enabled === "never";
  const captureEnabled = !providerDisabled && !enabledDisabled;

  return {
    captureEnabled,
    recallEnabled: captureEnabled && config.recall.enabled,
    provider: config.provider,
    dualWrite: config.dualWrite,
    recall: {
      k: config.recall.k,
      timeoutMs: config.recall.timeoutMs,
      maxTokens: config.recall.maxTokens,
    },
    project: config.project,
  };
}
