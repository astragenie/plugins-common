/**
 * Frontmatter parse/serialize core: a `---\n<yaml>\n---\n<body>` fence parser
 * backed by a real YAML parser (the `yaml` package) instead of a
 * line-oriented regex, so quoted strings, arrays, and nested maps in the
 * frontmatter block parse correctly.
 *
 * Seed: runner `src/scripts/lib/frontmatter.mts` (36 importers, documented
 * CRLF bug — an LF-only fence regex silently mis-parsed files with Windows
 * line endings). Per the cross-repo consolidation plan §1.4/§8.2, only the
 * parse/serialize CORE is pinned here: no runner-specific backlog-frontmatter
 * key conventions, no domain vocabulary. Callers that need those stay on
 * their own key helpers layered on top of this module.
 *
 * Normalization: input is BOM-stripped and CRLF/CR normalized to LF *before*
 * the fence is located, so LF-only, CRLF, and BOM-prefixed copies of the same
 * file all produce an identical `Frontmatter` result — closing the bug class
 * at the root instead of patching each call site's regex.
 *
 * Error policy (matches `jsonl.ts` / `http.ts`'s throw/Result split): a
 * malformed fence (opened but never closed) or unparsable YAML block is a
 * contract violation, not an expected outcome, so it throws a typed
 * `DeterministicError` instead of returning empty/partial data.
 */
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { DeterministicError } from "./errors.ts";

/** Parsed result: the frontmatter block as a plain object, plus the body that follows it. */
export interface Frontmatter<T extends Record<string, unknown> = Record<string, unknown>> {
  readonly data: T;
  readonly body: string;
}

const FENCE = "---";

/** Strip a leading UTF-8 BOM, if present. */
function stripBom(input: string): string {
  return input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
}

/** Normalize CRLF and lone CR to LF so fence/line detection is line-ending-agnostic. */
function normalizeNewlines(input: string): string {
  return input.replace(/\r\n?/g, "\n");
}

/**
 * Parse a `---\n<yaml>\n---\n<body>` fenced frontmatter block.
 *
 * - No opening fence (first line isn't exactly `---`): returns
 *   `{ data: {}, body: <BOM-stripped, newline-normalized input> }` unchanged.
 * - Empty frontmatter block (`---\n---\n`): returns `{ data: {}, body }`.
 * - Opening fence with no matching closing fence: throws `DeterministicError`
 *   (`E_FRONTMATTER_UNTERMINATED`).
 * - Well-fenced but unparsable YAML: throws `DeterministicError`
 *   (`E_FRONTMATTER_YAML`).
 */
export function parseFrontmatter<T extends Record<string, unknown> = Record<string, unknown>>(
  input: string,
): Frontmatter<T> {
  const normalized = normalizeNewlines(stripBom(input));
  const lines = normalized.split("\n");

  if (lines[0] !== FENCE) {
    return { data: {} as T, body: normalized };
  }

  let closeIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === FENCE) {
      closeIndex = i;
      break;
    }
  }

  if (closeIndex === -1) {
    throw new DeterministicError("frontmatter: unterminated `---` fence", {
      code: "E_FRONTMATTER_UNTERMINATED",
    });
  }

  const yamlBlock = lines.slice(1, closeIndex).join("\n");
  const body = lines.slice(closeIndex + 1).join("\n");

  let parsed: unknown;
  try {
    parsed = parseYaml(yamlBlock);
  } catch (cause) {
    throw new DeterministicError("frontmatter: malformed YAML in frontmatter block", {
      code: "E_FRONTMATTER_YAML",
      cause,
    });
  }

  const data = (parsed ?? {}) as T;
  return { data, body };
}

/**
 * Serialize `data` + `body` as a `---\n<yaml>\n---\n<body>` fenced block —
 * the inverse of `parseFrontmatter`: `parseFrontmatter(serializeFrontmatter(data, body))`
 * round-trips to an equivalent `{ data, body }` pair. An empty `data` object
 * serializes to an empty frontmatter block (`---\n---\n<body>`) rather than
 * omitting the fence, so the round trip is total (every `Frontmatter` value
 * has a fenced string form).
 */
export function serializeFrontmatter(data: Record<string, unknown>, body: string): string {
  const hasKeys = Object.keys(data).length > 0;
  const yamlBlock = hasKeys ? stringifyYaml(data).replace(/\n$/, "") : "";
  const normalizedBody = normalizeNewlines(stripBom(body));
  const yamlSection = yamlBlock.length > 0 ? `${yamlBlock}\n` : "";
  return `${FENCE}\n${yamlSection}${FENCE}\n${normalizedBody}`;
}
