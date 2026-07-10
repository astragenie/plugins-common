#!/usr/bin/env node
/**
 * Local generator CLI (FEAT-009 SLICE-1): a thin argv-parsing wrapper around
 * `generateRegistry`. All validation/abort logic lives in `generate.ts`; this
 * boundary's only job, per DEC-002, is to catch a thrown `PluginError` and
 * convert it into a non-zero process exit instead of an uncaught-exception
 * stack trace.
 */
import { isPluginError } from "@astragenie/plugin-std";
import { type GenerateOptions, generateRegistry } from "./generate.ts";

const USAGE =
  "usage: plugin-registry-gen --plugin <name> --plugin-dir <path> --output-dir <path> " +
  "[--agents-dir <path>] [--skills-dir <path>] [--version <semver>]";

export function parseArgs(argv: readonly string[]): GenerateOptions {
  const raw: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === undefined || !arg.startsWith("--")) {
      continue;
    }
    const key = arg.slice(2);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`registry: missing value for --${key}\n${USAGE}`);
    }
    raw[key] = value;
    i++;
  }

  const plugin = raw.plugin;
  const pluginDir = raw["plugin-dir"];
  const outputDir = raw["output-dir"];
  if (!plugin || !pluginDir || !outputDir) {
    throw new Error(USAGE);
  }

  const opts: {
    plugin: string;
    pluginDir: string;
    outputDir: string;
    agentsDir?: string;
    skillsDir?: string;
    version?: string;
  } = { plugin, pluginDir, outputDir };
  if (raw["agents-dir"] !== undefined) {
    opts.agentsDir = raw["agents-dir"];
  }
  if (raw["skills-dir"] !== undefined) {
    opts.skillsDir = raw["skills-dir"];
  }
  if (raw.version !== undefined) {
    opts.version = raw.version;
  }
  return opts;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  await generateRegistry(args);
}

// Only run when invoked as the entry point — importing this module (e.g. tests
// pulling in `parseArgs`) must NOT execute main(), or its argv parse would throw
// and set process.exitCode = 1, failing the importing test runner despite all
// assertions passing.
if (import.meta.main) {
  main().catch((err: unknown) => {
    const message = isPluginError(err)
      ? `[${err.code}] ${err.message}`
      : err instanceof Error
        ? err.message
        : String(err);
    console.error(message);
    process.exitCode = 1;
  });
}
