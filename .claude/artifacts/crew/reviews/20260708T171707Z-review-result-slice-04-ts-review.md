---
findings: "🔴:0,🟡:1,❓:1"
status: completed
decision: approved_with_notes
---
# Review Result: Review Result

- Created: 2026-07-08T17:18:37.981Z
- Reviewer: typescript-reviewer
- Decision: approved_with_notes
- Status: completed
- Summary: frontmatter.ts is type-sound at compile time (strict/noUncheckedIndexedAccess/exactOptionalPropertyTypes all satisfied, typecheck/lint/test all green) but parseFrontmatter's public generic <T> is backed by an unvalidated cast from parsed YAML, which is a real but low-blast-radius gap given the module's documented no-domain-validation scope.
- Evidence Checked:
  - HIGH: packages/plugin-std/src/frontmatter.ts:83-94 — parseYaml() result is correctly stopped at unknown (parsed: unknown)
  - but then (parsed ?? {}) as T casts straight to the caller-supplied generic with zero runtime validation; a caller doing parseFrontmatter<MySchema>(input) gets false confidence that data matches MySchema when it is only ever known to be an object (or not). No Zod/narrowing at this boundary. Isolated
  - non-blocking given the module's documented core-only scope (callers are expected to validate downstream per the file's own header comment) — approved_with_notes rather than rejected. Suggested fix: drop the generic and return Record<string
  - unknown>
  - forcing callers to run their own Zod parse before narrowing
  - or add a JSDoc @remarks making the caller-must-validate contract explicit next to the signature. QUESTION (not a defect): yaml as a direct dependency (not peer) is correct for this leaf parsing capability — flagging only for confirmation it matches the monorepo's dependency-placement convention for other frozen modules (jsonl.ts/http.ts have no external deps
  - so this is the first precedent-setter for plugin-std). LOW/PASS items: verbatimModuleSyntax respected (no missing import type; parseYaml/stringifyYaml are runtime value imports
  - correctly not type-only); no any/no ts-ignore/no non-null assertions/no enums/no barrel re-export additions beyond the existing index.ts pattern; noUncheckedIndexedAccess/exactOptionalPropertyTypes both still active in tsconfig.base.json and respected (lines[0]/lines[i] compared without assertions); DeterministicError usage matches taxonomy (E_FRONTMATTER_UNTERMINATED
  - E_FRONTMATTER_YAML
  - transient:false via base class default); exports map in package.json places types before default for root + jsonl/http/frontmatter subpaths consistently; root src/index.ts re-exports frontmatter.ts matching existing pattern; CRLF/CR/BOM normalization is correct and applied before fence detection; async/React/Node-specific checklist items not applicable (frontmatter.ts is synchronous
  - non-Node-specific
  - no .tsx).
- Files Reviewed:
  - packages/plugin-std/src/frontmatter.ts
  - packages/plugin-std/tests/frontmatter.test.ts
  - packages/plugin-std/src/errors.ts
  - packages/plugin-std/src/index.ts
  - packages/plugin-std/package.json
  - packages/plugin-std/tsconfig.json
- Test Adequacy: bun run --filter '@astragenie/plugin-std' typecheck: exit 0; lint: exit 0 (Checked 10 files, no fixes); test: exit 0 (43 pass, 0 fail, 77 expect() calls across 4 files)
- Risks: -
- Required Follow-up: -

