/**
 * @astragenie/plugin-registry
 *
 * Registry JSON Schema + local generator CLI (FEAT-009 SLICE-1). Generates
 * a versioned, per-producer-plugin registry of agent/skill names from that
 * plugin's own `agents/*.md` + `skills/**\/SKILL.md` frontmatter, so
 * consumers can resolve names against a committed manifest instead of a
 * hand-frozen allowlist (closing the FEAT-240 stale-rename class of bug).
 *
 * See `.claude/artifacts/crew/designs/2026-07-08-feat-009-slice-2-registry-publish-model-adr.md`
 * for the binding cross-repo design this package's SLICE-1 scope targets.
 */
export {
  generateRegistry,
  type GenerateOptions,
  type GenerateResult,
  type RegistryEntry,
} from "./generate.ts";
export {
  RegistryReadInvalidError,
  RegistrySourceInvalidError,
  RegistryUnsafeNameError,
} from "./errors.ts";
export { isUnsafeName } from "./unsafe-name.ts";
export { emitRegistryLog, type RegistryLogLine } from "./log.ts";
export { type JsonSchema, validateAgainstSchema } from "./json-schema.ts";
export { agentsSchema, skillsSchema } from "./schema-loader.ts";
export {
  type ReadRegistryResult,
  readRegistry,
  type ResolveOptions,
  resolveName,
  type ResolveResult,
} from "./read.ts";
