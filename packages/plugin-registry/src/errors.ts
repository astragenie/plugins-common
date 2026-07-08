/**
 * Typed errors for the registry generator (FEAT-009 SLICE-1).
 *
 * Per DEC-002 (.claude/artifacts/loop/decisions/DEC-002.md) and the binding
 * ADR (.claude/artifacts/crew/designs/2026-07-08-feat-009-slice-2-registry-publish-model-adr.md,
 * "Failure semantics"): a malformed source file or an unsafe entry name is a
 * contract violation of the producer plugin's OWN source, not an infra fault
 * and not a domain/expected outcome — the generator throws a
 * `DeterministicError` subclass, and the CLI boundary converts it to a
 * non-zero process exit. No `Result` return type belongs on this path: that
 * would let a caller silently ignore `ok: false` and write a partial
 * registry file, which is exactly what AC-2 forbids.
 */
import { DeterministicError, type ErrorContext } from "@astragenie/plugin-std";

/**
 * Thrown when a producer plugin's `agents/*.md` or `skills/**\/SKILL.md`
 * source file fails to parse (e.g. `parseFrontmatter` threw
 * `E_FRONTMATTER_UNTERMINATED` / `E_FRONTMATTER_YAML`) or is missing a
 * required `name` field. Aborts the ENTIRE publish for that plugin — no
 * partial `agents.json` / `skills.json` is ever written (AC-2).
 */
export class RegistrySourceInvalidError extends DeterministicError {
  constructor(message: string, ctx?: ErrorContext) {
    super(message, { ...ctx, code: "E_REGISTRY_SOURCE_INVALID" });
    this.name = "RegistrySourceInvalidError";
  }
}

/**
 * Thrown when a frontmatter `name` field contains path-traversal (`../`,
 * `..\`) or shell metacharacters. The offending entry is rejected — never
 * written to the committed manifest (AC-5).
 */
export class RegistryUnsafeNameError extends DeterministicError {
  constructor(message: string, ctx?: ErrorContext) {
    super(message, { ...ctx, code: "E_REGISTRY_UNSAFE_NAME" });
    this.name = "RegistryUnsafeNameError";
  }
}

/**
 * Thrown by the reader (FEAT-009 SLICE-3, `read.ts`) when a producer's
 * committed `registry/<plugin>/agents.json` or `skills.json` is missing,
 * unparseable JSON, or fails the committed JSON Schema. Per DEC-002 this is
 * an INFRA failure — the producer's own generator (`generate.ts`) guarantees
 * both files exist and validate via its atomic write-to-temp + rename, so a
 * reader encountering a broken manifest is a contract violation of that
 * guarantee, not a domain/expected outcome — it throws rather than returning
 * a Result. This is distinct from `stale_registry`, which IS a domain
 * outcome (AC-3) and is always surfaced as a warning, never thrown.
 */
export class RegistryReadInvalidError extends DeterministicError {
  constructor(message: string, ctx?: ErrorContext) {
    super(message, { ...ctx, code: "E_REGISTRY_READ_INVALID" });
    this.name = "RegistryReadInvalidError";
  }
}
