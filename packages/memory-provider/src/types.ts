// @astragenie/memory-provider — types.ts
//
// The provider-swap interface every backend (noop | file | astramem) must
// implement. Mirrors the gepa-core TrialStore pattern: capture() is
// fire-and-forget, recall() is ranked + budget-truncated, supersede()/
// invalidate() manage the append-only entry lifecycle.
//
// Extracted verbatim from dev-team's scripts/lib/memory/types.ts
// (FEAT-188 S2) — astragenie/plugins-common W3a.
import type {
  AgentProfileCorrection,
  AgentProfileDecision,
  AgentProfileLesson,
  AgentProfileResponse,
} from "@astragenie/astramem-client";
import type { MemoryEntry, MemoryEntryInput } from "./schema.ts";

/** Re-exported agent-profile shapes (source of truth:
 * `@astragenie/astramem-client`'s daemon-types → astramemory-local's
 * agent-profile query). `AgentProfile` is the receipt returned by
 * `MemoryProvider.profile()`. */
export type AgentProfile = AgentProfileResponse;
export type { AgentProfileLesson, AgentProfileDecision, AgentProfileCorrection };

export interface RecallQuery {
  /** Scope results to one agent (entries with no agent apply to everyone). */
  agent?: string;
  /** Scope results to entries carrying at least one of these tags. */
  tags?: string[];
  /** Max number of entries to return before token-budget truncation. Default 5. */
  k?: number;
  /** Token budget for the returned entry set. Default 800. */
  maxTokens?: number;
}

export interface MemoryProvider {
  describe(): { provider: "noop" | "file" | "astramem" };
  /** Fire-and-forget: implementations must never throw into the caller. */
  capture(entry: MemoryEntryInput): Promise<void>;
  /** Ranked recency x severity, token-budget truncated, supersede/invalidate resolved. */
  recall(query: RecallQuery): Promise<MemoryEntry[]>;
  /** Records `replacement` as the entry that supersedes `id`. */
  supersede(id: string, replacement: MemoryEntryInput): Promise<void>;
  /** Marks `id` as invalidated — never returned by recall() again. */
  invalidate(id: string): Promise<void>;
  /**
   * Read-time synthesized "what has this agent learned" receipt
   * (top_lessons / recent_decisions / corrections). Optional: only the
   * astramem provider (paired to a daemon) implements it; noop/file resolve
   * `null`. Fail-silent — resolves `null` on any failure or when unpaired.
   */
  profile?(agent: string): Promise<AgentProfile | null>;
  /**
   * Record positive usefulness for one atom (the atom was actually used).
   * Optional + positive-only (the daemon has no "not used" verb). Resolves
   * `true` when accepted, `false` on any failure. Fail-silent.
   */
  feedback?(atomId: string, opts: { used: boolean }): Promise<boolean>;
}
