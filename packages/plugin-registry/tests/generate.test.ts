import { afterEach, describe, expect, test } from "bun:test";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { RegistrySourceInvalidError, RegistryUnsafeNameError } from "../src/errors.ts";
import { generateRegistry } from "../src/generate.ts";
import { validateAgainstSchema } from "../src/json-schema.ts";
import { agentsSchema, skillsSchema } from "../src/schema-loader.ts";

const FIXTURES_DIR = fileURLToPath(new URL("./fixtures", import.meta.url));
const FIXED_NOW = () => new Date("2026-07-08T12:00:00.000Z");

const outputDirs: string[] = [];
function makeOutputDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "plugin-registry-test-"));
  outputDirs.push(dir);
  return dir;
}

const pluginDirs: string[] = [];
/**
 * Build a throwaway producer-plugin directory with one `agents/evil.md`
 * whose frontmatter `name:` value is exactly `frontmatterNameLiteral`
 * (already YAML-quoted by the caller, e.g. `'"-rf"'`) — used to drive
 * `generateRegistry` end-to-end for a specific unsafe-name category without
 * committing a fixture file containing raw control bytes / non-ASCII to
 * disk under source control.
 */
function makeUnsafeNamePluginDir(frontmatterNameLiteral: string): string {
  const dir = mkdtempSync(join(tmpdir(), "plugin-registry-fixture-"));
  pluginDirs.push(dir);
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ name: "fixture-plugin", version: "0.1.0" }),
  );
  mkdirSync(join(dir, "agents"), { recursive: true });
  writeFileSync(
    join(dir, "agents", "evil.md"),
    `---\nname: ${frontmatterNameLiteral}\ndescription: regression fixture\n---\n# Evil\n`,
  );
  return dir;
}

afterEach(() => {
  while (outputDirs.length > 0) {
    const dir = outputDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
  while (pluginDirs.length > 0) {
    const dir = pluginDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("generateRegistry — AC-1: happy-path emit + schema-valid, per-producer layout", () => {
  test("emits registry/<plugin>/agents.json and skills.json shaped { name, sourcePlugin, version, generatedAt }", async () => {
    const outputDir = makeOutputDir();
    const logLines: string[] = [];

    const result = await generateRegistry({
      plugin: "valid-plugin",
      pluginDir: join(FIXTURES_DIR, "valid-plugin"),
      outputDir,
      now: FIXED_NOW,
      logWrite: (s) => logLines.push(s),
    });

    expect(result.outcome).toBe("success");
    expect(result.agentCount).toBe(1);
    expect(result.skillCount).toBe(1);

    const agentsPath = join(outputDir, "valid-plugin", "agents.json");
    const skillsPath = join(outputDir, "valid-plugin", "skills.json");
    expect(existsSync(agentsPath)).toBe(true);
    expect(existsSync(skillsPath)).toBe(true);

    const agents = JSON.parse(readFileSync(agentsPath, "utf8"));
    expect(agents).toEqual([
      {
        name: "reviewer",
        sourcePlugin: "valid-plugin",
        version: "1.2.3",
        generatedAt: "2026-07-08T12:00:00.000Z",
      },
    ]);

    const skills = JSON.parse(readFileSync(skillsPath, "utf8"));
    expect(skills).toEqual([
      {
        name: "my-skill",
        sourcePlugin: "valid-plugin",
        version: "1.2.3",
        generatedAt: "2026-07-08T12:00:00.000Z",
      },
    ]);

    // AC-1: each output validates against the committed JSON Schema.
    expect(validateAgainstSchema(agentsSchema, agents)).toEqual([]);
    expect(validateAgainstSchema(skillsSchema, skills)).toEqual([]);

    // per-producer layout, NOT one flat merged file (ADR aggregation decision).
    expect(agentsPath).toContain(join("valid-plugin", "agents.json"));
    expect(skillsPath).toContain(join("valid-plugin", "skills.json"));
  });

  test("resolves version from the plugin's own package.json when --version is not given", async () => {
    const outputDir = makeOutputDir();
    const result = await generateRegistry({
      plugin: "valid-plugin",
      pluginDir: join(FIXTURES_DIR, "valid-plugin"),
      outputDir,
      now: FIXED_NOW,
      logWrite: () => {},
    });
    const agents = JSON.parse(readFileSync(result.agentsPath, "utf8"));
    expect(agents[0].version).toBe("1.2.3");
  });

  test("an explicit --version override wins over package.json", async () => {
    const outputDir = makeOutputDir();
    const result = await generateRegistry({
      plugin: "valid-plugin",
      pluginDir: join(FIXTURES_DIR, "valid-plugin"),
      outputDir,
      version: "9.9.9",
      now: FIXED_NOW,
      logWrite: () => {},
    });
    const agents = JSON.parse(readFileSync(result.agentsPath, "utf8"));
    expect(agents[0].version).toBe("9.9.9");
  });
});

describe("generateRegistry — AC-4: exactly one structured JSON log line, success or failure", () => {
  test("success path logs { plugin, agentCount, skillCount, durationMs, outcome: 'success' }", async () => {
    const outputDir = makeOutputDir();
    const logLines: string[] = [];
    await generateRegistry({
      plugin: "valid-plugin",
      pluginDir: join(FIXTURES_DIR, "valid-plugin"),
      outputDir,
      now: FIXED_NOW,
      logWrite: (s) => logLines.push(s),
    });

    expect(logLines).toHaveLength(1);
    const parsed = JSON.parse(logLines[0] as string);
    expect(parsed).toEqual({
      plugin: "valid-plugin",
      agentCount: 1,
      skillCount: 1,
      durationMs: expect.any(Number),
      outcome: "success",
    });
  });

  test("failure path still logs exactly one line, with outcome: 'failure'", async () => {
    const outputDir = makeOutputDir();
    const logLines: string[] = [];

    await expect(
      generateRegistry({
        plugin: "unterminated-plugin",
        pluginDir: join(FIXTURES_DIR, "unterminated-plugin"),
        outputDir,
        now: FIXED_NOW,
        logWrite: (s) => logLines.push(s),
      }),
    ).rejects.toThrow();

    expect(logLines).toHaveLength(1);
    const parsed = JSON.parse(logLines[0] as string);
    expect(parsed.plugin).toBe("unterminated-plugin");
    expect(parsed.outcome).toBe("failure");
  });
});

describe("generateRegistry — AC-2: unterminated frontmatter fence aborts with no partial write", () => {
  test("throws RegistrySourceInvalidError (E_REGISTRY_SOURCE_INVALID) naming the offending file", async () => {
    const outputDir = makeOutputDir();
    let thrown: unknown;
    try {
      await generateRegistry({
        plugin: "unterminated-plugin",
        pluginDir: join(FIXTURES_DIR, "unterminated-plugin"),
        outputDir,
        now: FIXED_NOW,
        logWrite: () => {},
      });
    } catch (caught) {
      thrown = caught;
    }

    expect(thrown).toBeInstanceOf(RegistrySourceInvalidError);
    expect((thrown as RegistrySourceInvalidError).code).toBe("E_REGISTRY_SOURCE_INVALID");
    expect((thrown as Error).message).toContain("broken.md");
  });

  test("writes NO partial/corrupt agents.json — the plugin's output directory does not exist", async () => {
    const outputDir = makeOutputDir();
    await expect(
      generateRegistry({
        plugin: "unterminated-plugin",
        pluginDir: join(FIXTURES_DIR, "unterminated-plugin"),
        outputDir,
        now: FIXED_NOW,
        logWrite: () => {},
      }),
    ).rejects.toThrow(RegistrySourceInvalidError);

    expect(existsSync(join(outputDir, "unterminated-plugin", "agents.json"))).toBe(false);
    expect(existsSync(join(outputDir, "unterminated-plugin"))).toBe(false);
  });
});

describe("generateRegistry — AC-5: unsafe name is rejected, never reaches the manifest", () => {
  test("throws RegistryUnsafeNameError (E_REGISTRY_UNSAFE_NAME) citing the source file", async () => {
    const outputDir = makeOutputDir();
    let thrown: unknown;
    try {
      await generateRegistry({
        plugin: "unsafe-name-plugin",
        pluginDir: join(FIXTURES_DIR, "unsafe-name-plugin"),
        outputDir,
        now: FIXED_NOW,
        logWrite: () => {},
      });
    } catch (caught) {
      thrown = caught;
    }

    expect(thrown).toBeInstanceOf(RegistryUnsafeNameError);
    expect((thrown as RegistryUnsafeNameError).code).toBe("E_REGISTRY_UNSAFE_NAME");
    expect((thrown as Error).message).toContain("evil.md");
  });

  test("no unsanitized value ever reaches a written manifest — no output file exists after the abort", async () => {
    const outputDir = makeOutputDir();
    await expect(
      generateRegistry({
        plugin: "unsafe-name-plugin",
        pluginDir: join(FIXTURES_DIR, "unsafe-name-plugin"),
        outputDir,
        now: FIXED_NOW,
        logWrite: () => {},
      }),
    ).rejects.toThrow(RegistryUnsafeNameError);

    expect(existsSync(join(outputDir, "unsafe-name-plugin"))).toBe(false);
  });
});

describe("generateRegistry — CRITICAL regression: path traversal via opts.plugin", () => {
  test("throws RegistryUnsafeNameError and never writes outside outputDir (PoC: plugin='../../evil-escaped')", async () => {
    const outputDir = makeOutputDir();
    // Same join() the generator itself uses for pluginOutDir — this is
    // exactly where an unvalidated opts.plugin would have escaped to.
    const escapedDir = join(outputDir, "../../evil-escaped");

    let thrown: unknown;
    try {
      await generateRegistry({
        plugin: "../../evil-escaped",
        pluginDir: join(FIXTURES_DIR, "valid-plugin"),
        outputDir,
        now: FIXED_NOW,
        logWrite: () => {},
      });
    } catch (caught) {
      thrown = caught;
    }

    try {
      expect(thrown).toBeInstanceOf(RegistryUnsafeNameError);
      expect((thrown as RegistryUnsafeNameError).code).toBe("E_REGISTRY_UNSAFE_NAME");
      expect((thrown as Error).message).toContain("../../evil-escaped");

      // The escaped path must never be created, and no sourcePlugin string
      // ever gets a chance to reach a written manifest.
      expect(existsSync(escapedDir)).toBe(false);
    } finally {
      // Defensive cleanup in case a regression reintroduces the escape.
      if (existsSync(escapedDir)) {
        rmSync(escapedDir, { recursive: true, force: true });
      }
    }
  });

  test("rejects an unsafe --plugin value before resolveVersion/buildEntries ever run", async () => {
    const outputDir = makeOutputDir();
    await expect(
      generateRegistry({
        plugin: "-rf",
        pluginDir: join(FIXTURES_DIR, "valid-plugin"),
        outputDir,
        now: FIXED_NOW,
        logWrite: () => {},
      }),
    ).rejects.toThrow(RegistryUnsafeNameError);

    expect(existsSync(join(outputDir, "-rf"))).toBe(false);
  });
});

describe("generateRegistry — MEDIUM regression: broadened isUnsafeName categories, end to end", () => {
  test.each([
    ["leading dash", '"-rf"'],
    ["bare absolute path", '"/etc/passwd"'],
  ])(
    "rejects a %s frontmatter name: throws E_REGISTRY_UNSAFE_NAME citing the source file, writes no manifest",
    async (_label, frontmatterNameLiteral) => {
      const outputDir = makeOutputDir();
      const pluginDir = makeUnsafeNamePluginDir(frontmatterNameLiteral);

      let thrown: unknown;
      try {
        await generateRegistry({
          plugin: "fixture-plugin",
          pluginDir,
          outputDir,
          now: FIXED_NOW,
          logWrite: () => {},
        });
      } catch (caught) {
        thrown = caught;
      }

      expect(thrown).toBeInstanceOf(RegistryUnsafeNameError);
      expect((thrown as RegistryUnsafeNameError).code).toBe("E_REGISTRY_UNSAFE_NAME");
      expect((thrown as Error).message).toContain("evil.md");
      expect(existsSync(join(outputDir, "fixture-plugin"))).toBe(false);
    },
  );
});

describe("generateRegistry — LOW regression: write-to-temp + rename leaves no partial state", () => {
  test("a successful run leaves only agents.json + skills.json — no leftover .tmp-* artifacts", async () => {
    const outputDir = makeOutputDir();
    await generateRegistry({
      plugin: "valid-plugin",
      pluginDir: join(FIXTURES_DIR, "valid-plugin"),
      outputDir,
      now: FIXED_NOW,
      logWrite: () => {},
    });

    const pluginOutDir = join(outputDir, "valid-plugin");
    expect(readdirSync(pluginOutDir).sort()).toEqual(["agents.json", "skills.json"]);
  });
});
