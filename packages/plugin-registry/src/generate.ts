/**
 * Registry generator core (FEAT-009 SLICE-1).
 *
 * Reads a producer plugin's `agents/*.md` and `skills/**\/SKILL.md` files,
 * parses each one's frontmatter via `@astragenie/plugin-std`'s
 * `parseFrontmatter`, stamps `{ name, sourcePlugin, version, generatedAt }`,
 * validates the full batch against the committed JSON Schema, and — only if
 * every entry in BOTH files validates — writes `registry/<plugin>/agents.json`
 * and `registry/<plugin>/skills.json` as a write-to-temp + rename-into-place
 * pair (never a raw in-place write). Any failure anywhere in the batch —
 * including an unsafe `--plugin` value, a schema violation, or an OS error
 * during the temp-write/rename — aborts the whole plugin's publish before
 * any final file exists (AC-2), and exactly one structured log line is
 * emitted whether the run succeeds or fails (AC-4).
 *
 * `opts.plugin` is untrusted input (CLI `--plugin`, or any caller-supplied
 * value) and is used BOTH as a `join()` path segment for the output
 * directory AND stamped verbatim as `sourcePlugin` on every entry, so it is
 * validated with the same `isUnsafeName` gate as a frontmatter `name` before
 * either use — closing the path-traversal / arbitrary-file-write class.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { DeterministicError, parseFrontmatter } from "@astragenie/plugin-std";
import { RegistrySourceInvalidError, RegistryUnsafeNameError } from "./errors.ts";
import { validateAgainstSchema } from "./json-schema.ts";
import { emitRegistryLog } from "./log.ts";
import { agentsSchema, skillsSchema } from "./schema-loader.ts";
import { isUnsafeName } from "./unsafe-name.ts";

export interface RegistryEntry {
  readonly name: string;
  readonly sourcePlugin: string;
  readonly version: string;
  readonly generatedAt: string;
}

export interface GenerateOptions {
  /** Producer plugin name — becomes `sourcePlugin` on every entry. */
  readonly plugin: string;
  /** Root directory of the plugin being scanned (holds agents/, skills/, package.json). */
  readonly pluginDir: string;
  /** Directory containing `*.md` agent files. Defaults to `<pluginDir>/agents`. */
  readonly agentsDir?: string;
  /** Directory containing `**\/SKILL.md` files. Defaults to `<pluginDir>/skills`. */
  readonly skillsDir?: string;
  /** Directory `<plugin>/{agents,skills}.json` get written under. */
  readonly outputDir: string;
  /** Producer semver override. Defaults to reading `<pluginDir>/package.json`'s `version`. */
  readonly version?: string;
  /** Injectable clock for deterministic tests. */
  readonly now?: () => Date;
  /** Injectable log sink for deterministic tests. */
  readonly logWrite?: (serialized: string) => void;
}

export interface GenerateResult {
  readonly plugin: string;
  readonly agentCount: number;
  readonly skillCount: number;
  readonly durationMs: number;
  readonly outcome: "success";
  readonly agentsPath: string;
  readonly skillsPath: string;
}

// Defense-in-depth for the `version` field reaching the manifest (it is
// never used in a path/shell context like `plugin`/`name` are, so the full
// identifier allow-list would be too strict — real semver allows `+build`
// metadata — but control characters/null bytes have no legitimate reason to
// appear and are rejected here rather than trusted through to the JSON body).
// biome-ignore lint/suspicious/noControlCharactersInRegex: intentional — this pattern's whole job is detecting control characters.
const UNSAFE_VERSION_PATTERN = /[\x00-\x1f]/;

function assertSafeVersion(version: string, source: string): string {
  if (UNSAFE_VERSION_PATTERN.test(version)) {
    throw new RegistrySourceInvalidError(
      `registry: ${source} has an unsafe "version" value (contains control characters): ${JSON.stringify(version)}`,
    );
  }
  return version;
}

function resolveVersion(opts: GenerateOptions): string {
  if (opts.version) {
    return assertSafeVersion(opts.version, "--version flag");
  }
  const pkgPath = join(opts.pluginDir, "package.json");
  if (!existsSync(pkgPath)) {
    throw new RegistrySourceInvalidError(
      `registry: cannot resolve producer version — no --version given and no package.json at ${pkgPath}`,
    );
  }
  let pkg: { version?: unknown };
  try {
    pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version?: unknown };
  } catch (cause) {
    throw new RegistrySourceInvalidError(`registry: ${pkgPath} is not valid JSON`, { cause });
  }
  if (typeof pkg.version !== "string" || pkg.version.length === 0) {
    throw new RegistrySourceInvalidError(
      `registry: ${pkgPath} has no string "version" field and no --version override was given`,
    );
  }
  return assertSafeVersion(pkg.version, pkgPath);
}

function listAgentFiles(agentsDir: string): string[] {
  if (!existsSync(agentsDir)) {
    return [];
  }
  return readdirSync(agentsDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => join(agentsDir, entry.name))
    .sort();
}

function listSkillFiles(skillsDir: string): string[] {
  if (!existsSync(skillsDir)) {
    return [];
  }
  return readdirSync(skillsDir, { withFileTypes: true, recursive: true })
    .filter((entry) => entry.isFile() && entry.name === "SKILL.md")
    .map((entry) => join(entry.parentPath, entry.name))
    .sort();
}

function buildEntries(
  files: readonly string[],
  plugin: string,
  version: string,
  generatedAt: string,
): RegistryEntry[] {
  const entries: RegistryEntry[] = [];
  for (const file of files) {
    const raw = readFileSync(file, "utf8");
    let parsed: ReturnType<typeof parseFrontmatter>;
    try {
      parsed = parseFrontmatter(raw);
    } catch (cause) {
      if (cause instanceof DeterministicError) {
        throw new RegistrySourceInvalidError(
          `registry: ${file} failed frontmatter parse (${cause.code}): ${cause.message}`,
          { cause },
        );
      }
      throw cause;
    }

    const name = parsed.data.name;
    if (typeof name !== "string" || name.length === 0) {
      throw new RegistrySourceInvalidError(`registry: ${file} has no "name" field in frontmatter`);
    }
    if (isUnsafeName(name)) {
      throw new RegistryUnsafeNameError(
        `registry: ${file} has an unsafe "name" value: ${JSON.stringify(name)}`,
      );
    }

    entries.push({ name, sourcePlugin: plugin, version, generatedAt });
  }
  return entries;
}

/**
 * Run the generator against one plugin's `agents/` + `skills/` directories.
 * Throws `RegistrySourceInvalidError` / `RegistryUnsafeNameError` on any
 * validation failure — never returns a partial result and never writes a
 * partial file. Always emits exactly one structured JSON log line (AC-4),
 * on both the success and failure path, before the error (if any) propagates.
 */
export async function generateRegistry(opts: GenerateOptions): Promise<GenerateResult> {
  const start = performance.now();
  const now = opts.now ?? (() => new Date());
  let agentCount = 0;
  let skillCount = 0;
  let outcome: "success" | "failure" = "failure";

  try {
    // CRITICAL: `opts.plugin` is used both as a `join()` path segment below
    // and stamped verbatim as `sourcePlugin` on every entry — validate it
    // BEFORE either use, or a value like `../../evil` escapes `outputDir`
    // and an unsanitized string lands in the committed manifest (AC-5).
    if (isUnsafeName(opts.plugin)) {
      throw new RegistryUnsafeNameError(
        `registry: --plugin value is unsafe: ${JSON.stringify(opts.plugin)}`,
      );
    }

    const version = resolveVersion(opts);
    const agentsDir = opts.agentsDir ?? join(opts.pluginDir, "agents");
    const skillsDir = opts.skillsDir ?? join(opts.pluginDir, "skills");
    const generatedAt = now().toISOString();

    const agentEntries = buildEntries(listAgentFiles(agentsDir), opts.plugin, version, generatedAt);
    agentCount = agentEntries.length;
    const skillEntries = buildEntries(listSkillFiles(skillsDir), opts.plugin, version, generatedAt);
    skillCount = skillEntries.length;

    const agentErrors = validateAgainstSchema(agentsSchema, agentEntries);
    if (agentErrors.length > 0) {
      throw new RegistrySourceInvalidError(
        `registry: agents.json failed schema validation: ${agentErrors.join("; ")}`,
      );
    }
    const skillErrors = validateAgainstSchema(skillsSchema, skillEntries);
    if (skillErrors.length > 0) {
      throw new RegistrySourceInvalidError(
        `registry: skills.json failed schema validation: ${skillErrors.join("; ")}`,
      );
    }

    // Write is deferred until full-batch validation of BOTH files passes
    // above, so a validation failure never reaches this point (AC-2). The
    // pair is written to temp files first and renamed into place last —
    // rename is atomic on the same filesystem — which narrows the
    // inter-write failure window down to the two adjacent rename syscalls.
    // This does NOT make the two-file pair a single transaction: if the
    // first rename succeeds and the second then fails (e.g. disk-full,
    // process kill), agents.json is committed and skills.json is not: the
    // catch below cleans up leftover temp files but cannot roll back a
    // rename that already succeeded.
    const pluginOutDir = join(opts.outputDir, opts.plugin);
    mkdirSync(pluginOutDir, { recursive: true });
    const agentsPath = join(pluginOutDir, "agents.json");
    const skillsPath = join(pluginOutDir, "skills.json");
    const tmpSuffix = `.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const agentsTmpPath = `${agentsPath}${tmpSuffix}`;
    const skillsTmpPath = `${skillsPath}${tmpSuffix}`;
    try {
      writeFileSync(agentsTmpPath, `${JSON.stringify(agentEntries, null, 2)}\n`);
      writeFileSync(skillsTmpPath, `${JSON.stringify(skillEntries, null, 2)}\n`);
      renameSync(agentsTmpPath, agentsPath);
      renameSync(skillsTmpPath, skillsPath);
    } catch (cause) {
      for (const tmpPath of [agentsTmpPath, skillsTmpPath]) {
        if (existsSync(tmpPath)) {
          try {
            unlinkSync(tmpPath);
          } catch {
            // best-effort cleanup only — the original `cause` is what matters.
          }
        }
      }
      throw cause;
    }

    outcome = "success";
    return {
      plugin: opts.plugin,
      agentCount,
      skillCount,
      durationMs: Math.round(performance.now() - start),
      outcome,
      agentsPath,
      skillsPath,
    };
  } finally {
    const durationMs = Math.round(performance.now() - start);
    emitRegistryLog(
      { plugin: opts.plugin, agentCount, skillCount, durationMs, outcome },
      opts.logWrite,
    );
  }
}
