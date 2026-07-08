# Task Handoff: jsonl rotate() primary-branch coverage (SLICE-02 gap)

- Created: 2026-07-08T16:39:37.201Z
- From: test-automator
- To: dispatcher
- Objective: Added 2 tests to packages/plugin-std/tests/jsonl.test.ts covering rotate()'s untested primary branch (size > maxBytes triggers rotation) and the >, <= boundary (size == maxBytes does not rotate). Test count went 13 -> 15 pass across 2 files (21 -> 26 expect() calls), 0 fail, typecheck clean before and after. No product source touched.
- Allowed Scope:
  - SLICE-02 review gap: rotate() PRIMARY branch (size exceeds maxBytes -> rotation triggered) previously untested; existing tests only covered unconditional-rotate and below-threshold no-op.
- Forbidden Scope: -
- Deliverable: gap: rotate() above-maxBytes primary branch -> packages/plugin-std/tests/jsonl.test.ts:130 ('above maxBytes threshold: rotates the file out of the way and returns true'). gap: >, <= boundary at size==maxBytes -> packages/plugin-std/tests/jsonl.test.ts:146 ('size exactly at maxBytes threshold: boundary is inclusive, not rotated'). No CI config changes needed (existing bun test runner reused).
- Changed Files:
  - packages/plugin-std/tests/jsonl.test.ts
- Confidence: high
- Risks: None outstanding for rotate(); archivePath-omitted default-naming path (Date.now()-based) and rotate() throw-on-rename-failure path remain untested but were out of scope for this dispatch (only the PRIMARY size>maxBytes branch was requested).
- Suggested Next Handoff: none

