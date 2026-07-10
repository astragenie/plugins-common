import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DeterministicError } from "../src/errors.ts";
import { parseFrontmatter, serializeFrontmatter } from "../src/frontmatter.ts";

const BOM = "﻿";

describe("parseFrontmatter — AC-1: LF/CRLF/BOM matrix normalizes to the same result", () => {
  const lf = "---\ntitle: Hello\ncount: 2\n---\nBody line one.\nBody line two.\n";
  const crlf = lf.replace(/\n/g, "\r\n");
  const bomLf = BOM + lf;
  const bomCrlf = BOM + crlf;

  test("LF-only input parses to the normalized result", () => {
    const result = parseFrontmatter(lf);
    expect(result.data).toEqual({ title: "Hello", count: 2 });
    expect(result.body).toBe("Body line one.\nBody line two.\n");
  });

  test("CRLF input parses to the SAME normalized result as LF", () => {
    const result = parseFrontmatter(crlf);
    expect(result).toEqual(parseFrontmatter(lf));
  });

  test("BOM-prefixed LF input parses to the SAME normalized result as LF", () => {
    const result = parseFrontmatter(bomLf);
    expect(result).toEqual(parseFrontmatter(lf));
  });

  test("BOM-prefixed CRLF input parses to the SAME normalized result as LF", () => {
    const result = parseFrontmatter(bomCrlf);
    expect(result).toEqual(parseFrontmatter(lf));
  });
});

describe("parseFrontmatter / serializeFrontmatter — round trip", () => {
  test("parse -> serialize -> parse is stable for a populated frontmatter block", () => {
    const original = "---\ntitle: Hello\ntags:\n  - a\n  - b\n---\nBody text.\n";
    const first = parseFrontmatter(original);
    const serialized = serializeFrontmatter(first.data, first.body);
    const second = parseFrontmatter(serialized);
    expect(second).toEqual(first);
  });

  test("parse -> serialize -> parse is stable for an empty frontmatter block", () => {
    const original = "---\n---\nJust body content.\n";
    const first = parseFrontmatter(original);
    expect(first.data).toEqual({});
    const serialized = serializeFrontmatter(first.data, first.body);
    const second = parseFrontmatter(serialized);
    expect(second).toEqual(first);
  });

  test("parse -> serialize -> parse is stable for a file with no frontmatter", () => {
    const original = "Just a plain markdown file.\nNo fence here.\n";
    const first = parseFrontmatter(original);
    expect(first.data).toEqual({});
    expect(first.body).toBe(original);
    const serialized = serializeFrontmatter(first.data, first.body);
    const second = parseFrontmatter(serialized);
    expect(second).toEqual(first);
  });

  test("round trip is stable for values with special characters (colons, quotes, unicode)", () => {
    const original = {
      title: 'A "quoted" title: with a colon',
      note: "line one\nline two",
      emoji: "café ☃",
      nested: { key: "value: with colon" },
    };
    const serialized = serializeFrontmatter(original, "Body.\n");
    const parsed = parseFrontmatter(serialized);
    expect(parsed.data).toEqual(original);
    const reserialized = serializeFrontmatter(parsed.data, parsed.body);
    expect(parseFrontmatter(reserialized)).toEqual(parsed);
  });
});

describe("parseFrontmatter — branch coverage", () => {
  test("no frontmatter fence: returns empty data and the input as body, unchanged", () => {
    const input = "# Just a heading\n\nSome text.\n";
    const result = parseFrontmatter(input);
    expect(result.data).toEqual({});
    expect(result.body).toBe(input);
  });

  test("empty frontmatter block: returns empty data object, not null/undefined", () => {
    const result = parseFrontmatter("---\n---\nbody\n");
    expect(result.data).toEqual({});
    expect(result.body).toBe("body\n");
  });

  test("frontmatter with no trailing body: body is an empty string", () => {
    const result = parseFrontmatter("---\ntitle: x\n---\n");
    expect(result.data).toEqual({ title: "x" });
    expect(result.body).toBe("");
  });
});

describe("parseFrontmatter — AC-2: malformed frontmatter throws DeterministicError", () => {
  test("unterminated `---` fence throws DeterministicError, not a partial/empty result", () => {
    const input = "---\ntitle: Hello\nbody continues with no closing fence\n";

    let thrown: unknown;
    try {
      parseFrontmatter(input);
    } catch (caught) {
      thrown = caught;
    }

    expect(thrown).toBeInstanceOf(DeterministicError);
    expect((thrown as DeterministicError).code).toBe("E_FRONTMATTER_UNTERMINATED");
    expect((thrown as DeterministicError).transient).toBe(false);
  });

  test("malformed YAML inside a well-formed fence throws DeterministicError", () => {
    const input = "---\ntitle: [unclosed\n---\nbody\n";

    let thrown: unknown;
    try {
      parseFrontmatter(input);
    } catch (caught) {
      thrown = caught;
    }

    expect(thrown).toBeInstanceOf(DeterministicError);
    expect((thrown as DeterministicError).code).toBe("E_FRONTMATTER_YAML");
  });
});

describe("frontmatter.ts — AC-3: import-boundary check (core only, no runner-specific conventions)", () => {
  const sourcePath = fileURLToPath(new URL("../src/frontmatter.ts", import.meta.url));
  const source = readFileSync(sourcePath, "utf8");

  test("only imports the YAML parser and the package's own errors module", () => {
    const importSpecifiers = [...source.matchAll(/from\s+["']([^"']+)["']/g)].map(
      (m) => m[1] ?? "",
    );
    expect(importSpecifiers.length).toBeGreaterThan(0);
    for (const specifier of importSpecifiers) {
      expect(["yaml", "./errors.ts"]).toContain(specifier);
    }
  });

  test("exports only the pinned parse/serialize core, no domain-specific helpers", () => {
    const exportedNames = [...source.matchAll(/export (?:function|interface|const) (\w+)/g)].map(
      (m) => m[1] ?? "",
    );
    expect(exportedNames.sort()).toEqual(
      ["Frontmatter", "parseFrontmatter", "serializeFrontmatter"].sort(),
    );
  });

  test("contains no runner-specific backlog-frontmatter domain vocabulary", () => {
    const bannedIdentifiers = [
      "SliceId",
      "FeatId",
      "backlogKey",
      "BACKLOG_",
      "slug",
      "priority:",
      "autonomous_safe",
    ];
    for (const identifier of bannedIdentifiers) {
      expect(source).not.toContain(identifier);
    }
  });
});
