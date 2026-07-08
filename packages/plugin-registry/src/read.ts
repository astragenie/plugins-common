/**
 * Registry reader (FEAT-009 SLICE-3).
 *
 * Loads ONE producer plugin's committed `registry/<plugin>/agents.json` +
 * `skills.json` pair — the SLICE-1 generator's own per-producer output shape
 * (see `.claude/artifacts/crew/designs/2026-07-08-feat-009-slice-2-registry-publish-model-adr.md`)
 * — and resolves a name against it, applying the ADR's binding staleness
 * rule: `semver.lt(entry.version, expectedVersion)` -> a `stale_registry`
 * WARNING, never a throw and never a silent pass (AC-3, reproducing
 * FEAT-240's stale `inspector`-allowlist shape).
 *
 * Per DEC-002: a missing or malformed manifest file is an INFRA failure —
 * the producer's own generator guarantees both files exist and validate
 * (write-to-temp + atomic rename, only after full-batch schema validation
 * passes; see `generate.ts`) — so a reader encountering a broken manifest is
 * a contract violation of that guarantee, not a domain/expected outcome.
 * This module throws `RegistryReadInvalidError` for that case. Staleness, by
 * contrast, IS a domain outcome — expected, common, never fatal — so it is
 * reported as a warning string on `ResolveResult`, never thrown.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import semver from "semver";
import { RegistryReadInvalidError } from "./errors.ts";
import type { RegistryEntry } from "./generate.ts";
import { type JsonSchema, validateAgainstSchema } from "./json-schema.ts";
import { agentsSchema, skillsSchema } from "./schema-loader.ts";

export interface ReadRegistryResult {
  readonly agents: readonly RegistryEntry[];
  readonly skills: readonly RegistryEntry[];
}

export interface ResolveOptions {
  /** The consumer's own currently-installed producer-plugin release version. */
  readonly expectedVersion: string;
}

export interface ResolveResult {
  readonly found: boolean;
  readonly entry?: RegistryEntry;
  readonly warnings: readonly string[];
}

function readManifestFile(path: string, schema: JsonSchema): RegistryEntry[] {
  if (!existsSync(path)) {
    throw new RegistryReadInvalidError(`registry: missing manifest file ${path}`);
  }
  let raw: string;
  try {
    raw = readFileSync(path, "utf8");
  } catch (cause) {
    throw new RegistryReadInvalidError(`registry: failed to read manifest file ${path}`, { cause });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    throw new RegistryReadInvalidError(`registry: ${path} is not valid JSON`, { cause });
  }
  const errors = validateAgainstSchema(schema, parsed);
  if (errors.length > 0) {
    throw new RegistryReadInvalidError(
      `registry: ${path} failed schema validation: ${errors.join("; ")}`,
    );
  }
  return parsed as RegistryEntry[];
}

/**
 * Load one producer plugin's registry directory (e.g. the SLICE-1
 * generator's own `<outputDir>/<plugin>` output — `registry/<plugin>/` once
 * published). Throws `RegistryReadInvalidError` if either `agents.json` or
 * `skills.json` is missing, unparseable, or fails the committed JSON Schema
 * — malformed/missing manifests are an infra fault per DEC-002, never a
 * domain Result a caller could silently ignore.
 */
export function readRegistry(dir: string): ReadRegistryResult {
  const agents = readManifestFile(join(dir, "agents.json"), agentsSchema);
  const skills = readManifestFile(join(dir, "skills.json"), skillsSchema);
  return { agents, skills };
}

function findEntry(registry: ReadRegistryResult, name: string): RegistryEntry | undefined {
  return (
    registry.agents.find((entry) => entry.name === name) ??
    registry.skills.find((entry) => entry.name === name)
  );
}

/**
 * Resolve `name` against a loaded registry, applying the AC-3 staleness
 * rule. A name absent from the registry is `found: false` — that is the
 * CALLER's gate to fail (e.g. a CI check), not this reader's. The reader
 * only ever warns, never throws: a stale entry still resolves (`found: true`
 * with the entry attached) alongside the warning — never a false-negative
 * silent pass, and never a hard failure either.
 */
export function resolveName(
  registry: ReadRegistryResult,
  name: string,
  opts: ResolveOptions,
): ResolveResult {
  const entry = findEntry(registry, name);
  if (!entry) {
    return { found: false, warnings: [] };
  }

  const warnings: string[] = [];
  try {
    if (semver.lt(entry.version, opts.expectedVersion)) {
      warnings.push(
        `stale_registry: ${entry.sourcePlugin}/${entry.name} registry entry is stamped version ${entry.version}, older than the consumer's expected ${opts.expectedVersion} — the registry may not yet reflect a rename or removal in the newer release (FEAT-240 shape)`,
      );
    }
  } catch (cause) {
    // A version string that isn't valid semver can't be ordered by
    // semver.lt (it throws TypeError). Staleness never hard-fails, so this
    // is surfaced as its own warning rather than thrown — and rather than
    // silently treated as fresh, which would hide the same class of gap
    // AC-3 exists to close.
    warnings.push(
      `version_uncomparable: cannot compare ${entry.sourcePlugin}/${entry.name} registry version "${entry.version}" against expected "${opts.expectedVersion}": ${(cause as Error).message}`,
    );
  }

  return { found: true, entry, warnings };
}
