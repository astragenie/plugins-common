import { describe, expect, test } from "bun:test";
import { isUnsafeName } from "../src/unsafe-name.ts";

describe("isUnsafeName — AC-5: path traversal and shell metacharacters", () => {
  test.each([
    ["../etc/passwd", "posix path traversal"],
    ["..\\windows\\system32", "windows path traversal"],
    ["foo/../bar", "embedded traversal"],
    ["foo; rm -rf /", "semicolon shell chaining"],
    ["foo | cat /etc/passwd", "pipe"],
    ["foo`whoami`", "backtick command substitution"],
    ["foo$(ls)", "dollar-paren command substitution"],
    ["foo && rm x", "ampersand chaining"],
    ['foo"bar', "embedded double quote"],
    ["foo'bar", "embedded single quote"],
    ["foo\nbar", "embedded newline"],
  ])("rejects %s (%s)", (name) => {
    expect(isUnsafeName(name)).toBe(true);
  });

  test.each([
    ["reviewer", "plain name"],
    ["my-skill", "hyphenated name"],
    ["my_skill.v2", "dots and underscore"],
    ["Reviewer123", "mixed case with digits"],
  ])("accepts %s (%s)", (name) => {
    expect(isUnsafeName(name)).toBe(false);
  });

  test("rejects non-string values", () => {
    expect(isUnsafeName(undefined)).toBe(true);
    expect(isUnsafeName(null)).toBe(true);
    expect(isUnsafeName(42)).toBe(true);
  });

  test("rejects an empty string", () => {
    expect(isUnsafeName("")).toBe(true);
  });
});

describe("isUnsafeName — MEDIUM regression: categories the old blocklist regex missed", () => {
  test("rejects a name containing a null byte", () => {
    expect(isUnsafeName("foo\0bar")).toBe(true);
  });

  test("rejects a name containing other C0 control characters", () => {
    expect(isUnsafeName("foo\x01bar")).toBe(true);
    expect(isUnsafeName("foo\tbar")).toBe(true);
  });

  test("rejects a name with a leading dash (CLI-flag injection risk)", () => {
    expect(isUnsafeName("-rf")).toBe(true);
    expect(isUnsafeName("--plugin")).toBe(true);
  });

  test("rejects a bare absolute path with no '..' segment", () => {
    expect(isUnsafeName("/etc/passwd")).toBe(true);
    expect(isUnsafeName("C:\\Windows\\System32")).toBe(true);
    expect(isUnsafeName("\\\\unc\\share")).toBe(true);
  });

  test("rejects a non-ASCII / Unicode homoglyph name", () => {
    // U+0430 CYRILLIC SMALL LETTER A — visually indistinguishable from "a".
    expect(isUnsafeName("аdmin")).toBe(true);
  });
});
