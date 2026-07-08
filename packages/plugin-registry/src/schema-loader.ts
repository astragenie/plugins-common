/**
 * Loads this package's own committed JSON Schema files (AC-1) from disk
 * rather than a static JSON import, so resolution is identical whether this
 * module runs uncompiled from `src/` (bun test) or compiled to `dist/`
 * (published package) — both sit exactly one directory below the package
 * root, so `../schema/<file>` resolves the same way in either layout.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { JsonSchema } from "./json-schema.ts";

function loadSchema(fileName: string): JsonSchema {
  const path = fileURLToPath(new URL(`../schema/${fileName}`, import.meta.url));
  return JSON.parse(readFileSync(path, "utf8")) as JsonSchema;
}

export const agentsSchema: JsonSchema = loadSchema("agents.schema.json");
export const skillsSchema: JsonSchema = loadSchema("skills.schema.json");
