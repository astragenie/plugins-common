import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "../src/cli.ts";

const FIXTURES_DIR = fileURLToPath(new URL("./fixtures", import.meta.url));
const CLI_PATH = fileURLToPath(new URL("../src/cli.ts", import.meta.url));

describe("parseArgs", () => {
  test("parses required flags", () => {
    const opts = parseArgs(["--plugin", "crew", "--plugin-dir", "/x", "--output-dir", "/y"]);
    expect(opts).toEqual({ plugin: "crew", pluginDir: "/x", outputDir: "/y" });
  });

  test("parses optional flags only when given", () => {
    const opts = parseArgs([
      "--plugin",
      "crew",
      "--plugin-dir",
      "/x",
      "--output-dir",
      "/y",
      "--version",
      "1.0.0",
    ]);
    expect(opts).toEqual({
      plugin: "crew",
      pluginDir: "/x",
      outputDir: "/y",
      version: "1.0.0",
    });
  });

  test("throws when a required flag is missing", () => {
    expect(() => parseArgs(["--plugin", "crew"])).toThrow();
  });
});

describe("CLI boundary — AC-2: non-zero exit on registry-source-invalid abort", () => {
  test("happy path exits 0", () => {
    const outputDir = mkdtempSync(join(tmpdir(), "plugin-registry-cli-"));
    try {
      const result = Bun.spawnSync([
        "bun",
        "run",
        CLI_PATH,
        "--plugin",
        "valid-plugin",
        "--plugin-dir",
        join(FIXTURES_DIR, "valid-plugin"),
        "--output-dir",
        outputDir,
      ]);
      expect(result.exitCode).toBe(0);
      // Assert main() actually ran and produced output — a guard-misfire (e.g.
      // `import.meta.main` undefined on older Node) would exit 0 yet write
      // nothing, and an exit-code-only check would pass that no-op silently.
      expect(existsSync(join(outputDir, "valid-plugin", "agents.json"))).toBe(true);
    } finally {
      rmSync(outputDir, { recursive: true, force: true });
    }
  });

  test("unterminated-fence plugin exits non-zero with E_REGISTRY_SOURCE_INVALID on stderr", () => {
    const outputDir = mkdtempSync(join(tmpdir(), "plugin-registry-cli-"));
    try {
      const result = Bun.spawnSync([
        "bun",
        "run",
        CLI_PATH,
        "--plugin",
        "unterminated-plugin",
        "--plugin-dir",
        join(FIXTURES_DIR, "unterminated-plugin"),
        "--output-dir",
        outputDir,
      ]);
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr.toString()).toContain("E_REGISTRY_SOURCE_INVALID");
    } finally {
      rmSync(outputDir, { recursive: true, force: true });
    }
  });
});
