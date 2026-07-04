/**
 * @astragenie/plugin-kernel
 *
 * Shared kernel for the crew and runner plugin ecosystem. Strangler-extracted
 * from dev-team (crew) and runner-plugin per Phase 2 of the architecture
 * hardening plan (`docs/ai-loop/.../20260704T131500Z-plan-phase2-kernel-event-spine.md`,
 * item P2.1). This package will own:
 *
 * - Workflow-state machine: load/save, lifecycle transitions, badge table,
 *   artifact handlers (moved wholesale from dev-team's workflow-state.ts).
 * - Locks: one lock implementation shared by both plugins (replacing the two
 *   independent lock managers currently touching workflow-state.json).
 * - ID registry: transactional minting for SLICE/FEAT/DEC/INC identifiers,
 *   closing the race window that the current regex-only detection (FF-5)
 *   cannot prevent.
 * - Artifact IO: `writeTypedArtifact(kind, schema, fields)` generic primitive;
 *   per-kind policy (VALID_DECISIONS, --test-summary rules, etc.) stays in
 *   each consuming plugin.
 * - Typed events: canonical event envelope and schemas feeding the event
 *   spine (P2.2), replacing the dual `slice-events` / `trajectory-writer`
 *   formats.
 *
 * Empty on scaffold (P2.0.4) — implementation lands in P2.1.
 */

export {};
