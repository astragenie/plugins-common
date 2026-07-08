import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { RegistryReadInvalidError } from "../src/errors.ts";
import { generateRegistry } from "../src/generate.ts";
import { readRegistry, resolveName } from "../src/read.ts";

const FIXTURES_DIR = fileURLToPath(new URL("./fixtures", import.meta.url));
const FIXED_NOW = () => new Date("2026-07-08T12:00:00.000Z");

const outputDirs: string[] = [];
function makeOutputDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "plugin-registry-read-test-"));
  outputDirs.push(dir);
  return dir;
}

afterEach(() => {
  while (outputDirs.length > 0) {
    const dir = outputDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("resolveName — unit (in-memory registry, no disk I/O)", () => {
  const registry = {
    agents: [
      {
        name: "reviewer",
        sourcePlugin: "crew",
        version: "1.0.0",
        generatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    skills: [
      {
        name: "my-skill",
        sourcePlugin: "crew",
        version: "1.0.0",
        generatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
  };

  test("found: name absent from the registry -> found:false, no warnings (caller's gate to fail, not the reader's)", () => {
    const result = resolveName(registry, "does-not-exist", { expectedVersion: "1.0.0" });
    expect(result).toEqual({ found: false, warnings: [] });
  });

  test("fresh: entry.version >= expectedVersion -> found:true, no stale warning", () => {
    const result = resolveName(registry, "reviewer", { expectedVersion: "0.9.0" });
    expect(result.found).toBe(true);
    expect(result.entry).toEqual(registry.agents[0]);
    expect(result.warnings).toEqual([]);
  });

  test("equal-version boundary: entry.version === expectedVersion -> NOT stale (semver.lt is strict <)", () => {
    const result = resolveName(registry, "reviewer", { expectedVersion: "1.0.0" });
    expect(result.found).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  test("stale: entry.version < expectedVersion -> stale_registry warning fires, entry STILL resolves (not a false negative)", () => {
    const result = resolveName(registry, "reviewer", { expectedVersion: "2.0.0" });
    expect(result.found).toBe(true);
    expect(result.entry).toEqual(registry.agents[0]);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("stale_registry");
    expect(result.warnings[0]).toContain("crew/reviewer");
    expect(result.warnings[0]).toContain("1.0.0");
    expect(result.warnings[0]).toContain("2.0.0");
  });

  test("resolves a skill-only name (searches both agents and skills)", () => {
    const result = resolveName(registry, "my-skill", { expectedVersion: "1.0.0" });
    expect(result.found).toBe(true);
    expect(result.entry).toEqual(registry.skills[0]);
  });

  test("version_uncomparable: a non-semver version string never throws, warns instead", () => {
    const nonSemverRegistry = {
      agents: [
        {
          name: "reviewer",
          sourcePlugin: "crew",
          version: "not-a-semver",
          generatedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      skills: [],
    };
    const result = resolveName(nonSemverRegistry, "reviewer", { expectedVersion: "1.0.0" });
    expect(result.found).toBe(true);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("version_uncomparable");
  });
});

describe("readRegistry — DEC-002: missing/malformed manifest is an infra failure, throws", () => {
  test("throws RegistryReadInvalidError when agents.json is missing", () => {
    const outputDir = makeOutputDir();
    expect(() => readRegistry(outputDir)).toThrow(RegistryReadInvalidError);
  });

  test("thrown error carries code E_REGISTRY_READ_INVALID and names the missing path", () => {
    const outputDir = makeOutputDir();
    let thrown: unknown;
    try {
      readRegistry(outputDir);
    } catch (caught) {
      thrown = caught;
    }
    expect(thrown).toBeInstanceOf(RegistryReadInvalidError);
    expect((thrown as RegistryReadInvalidError).code).toBe("E_REGISTRY_READ_INVALID");
    expect((thrown as Error).message).toContain("agents.json");
  });
});

describe("generateRegistry -> readRegistry -> resolveName — SLICE-3 self-dogfood (generator/reader round trip)", () => {
  test("a fresh manifest (entry.version >= expectedVersion) produces NO staleness warning", async () => {
    const outputDir = makeOutputDir();
    const genResult = await generateRegistry({
      plugin: "valid-plugin",
      pluginDir: join(FIXTURES_DIR, "valid-plugin"),
      outputDir,
      version: "3.0.0",
      now: FIXED_NOW,
      logWrite: () => {},
    });

    const registry = readRegistry(join(outputDir, genResult.plugin));
    const result = resolveName(registry, "reviewer", { expectedVersion: "1.0.0" });

    expect(result.found).toBe(true);
    expect(result.entry?.version).toBe("3.0.0");
    expect(result.warnings).toEqual([]);
  });

  test("FEAT-240 reproduction: a registry entry stamped OLDER than the consumer's installed version fires stale_registry, and the entry STILL resolves (not a false negative)", async () => {
    const outputDir = makeOutputDir();
    // Reproduces the FEAT-240 shape: crew's registry was published at 1.0.0
    // (entry name still "reviewer" — same shape as the stale "inspector"
    // allowlist entry), but the consumer has since installed crew 2.0.0,
    // which may have renamed/removed the agent. A stale registry read must
    // never silently resolve as if it were current.
    const genResult = await generateRegistry({
      plugin: "valid-plugin",
      pluginDir: join(FIXTURES_DIR, "valid-plugin"),
      outputDir,
      version: "1.0.0",
      now: FIXED_NOW,
      logWrite: () => {},
    });

    const registry = readRegistry(join(outputDir, genResult.plugin));
    const result = resolveName(registry, "reviewer", { expectedVersion: "2.0.0" });

    // NOT a false negative: the entry still resolves...
    expect(result.found).toBe(true);
    expect(result.entry?.name).toBe("reviewer");
    // ...but the stale_registry warning fires instead of a silent pass.
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("stale_registry");
    expect(result.warnings[0]).toContain("valid-plugin/reviewer");
    expect(result.warnings[0]).toContain("1.0.0");
    expect(result.warnings[0]).toContain("2.0.0");
  });

  test("a name absent from the dogfooded registry is found:false (caller's own gate, not this reader's)", async () => {
    const outputDir = makeOutputDir();
    const genResult = await generateRegistry({
      plugin: "valid-plugin",
      pluginDir: join(FIXTURES_DIR, "valid-plugin"),
      outputDir,
      now: FIXED_NOW,
      logWrite: () => {},
    });

    const registry = readRegistry(join(outputDir, genResult.plugin));
    const result = resolveName(registry, "renamed-away", { expectedVersion: "1.2.3" });

    expect(result).toEqual({ found: false, warnings: [] });
  });
});
