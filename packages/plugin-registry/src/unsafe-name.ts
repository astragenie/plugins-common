/**
 * Name-safety gate (AC-5): rejects a frontmatter `name` (or a `--plugin`
 * value — the same gate runs on both, since both get stamped/used as a path
 * segment) before it can ever reach a written registry entry or a path
 * `join()`. Runs BEFORE schema validation so the generator can throw the
 * dedicated `E_REGISTRY_UNSAFE_NAME` error the AC requires, rather than a
 * generic schema-validation failure.
 *
 * Deny-by-default, not a blocklist: an anchored ASCII allow-list (first char
 * alphanumeric, rest alphanumeric/dot/underscore/hyphen) — the same pattern
 * as the committed JSON Schema's `name`/`sourcePlugin` `pattern`, so a value
 * that clears this check also clears schema validation, and a value that
 * fails schema validation was already rejected here first. One allow-list
 * rejects, in a single pass: path separators (`/`, `\`) and drive letters
 * (`C:`) — closing the path-traversal / arbitrary-write gap; leading `-`
 * (CLI-flag injection if the name is later passed as an argv token); bare
 * absolute paths (`/etc`, `\\unc`) with no `..` segment; null bytes and
 * other control characters; shell metacharacters; and non-ASCII characters,
 * including Unicode homoglyphs (an ASCII-only allow-list has nothing to
 * normalize against — anything outside it is rejected outright).
 */
const SAFE_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

/** True when `name` is not a safe registry entry name. */
export function isUnsafeName(name: unknown): boolean {
  if (typeof name !== "string" || name.length === 0) {
    return true;
  }
  return !SAFE_NAME_PATTERN.test(name);
}
