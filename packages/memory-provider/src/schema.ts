// @astragenie/memory-provider — schema.ts
//
// Zod schemas for the MemoryProvider interface's two boundaries:
//   1. MemoryEntry — the persisted, on-disk shape (kind | severity | tags |
//      summary<=280 | source provenance | supersedes).
//   2. MemoryConfigSchema — the unified `memory` config block. Original
//      keys (enabled, recall.k, recall.timeoutMs, project) plus provider,
//      dualWrite, recall.maxTokens, capture.events.
//
// Extracted verbatim from dev-team's scripts/lib/memory/schema.ts
// (FEAT-188 S2) — astragenie/plugins-common W3a.
import { z } from "zod";

const MAX_SUMMARY_LENGTH = 280;

const IsoTimestamp = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), { message: "expected an ISO 8601 timestamp" });

export const MemorySeveritySchema = z.enum(["critical", "high", "medium", "low"]);
export type MemorySeverity = z.infer<typeof MemorySeveritySchema>;

export const MemoryKindSchema = z.enum(["failure", "lesson", "decision", "standard_violation"]);
export type MemoryKind = z.infer<typeof MemoryKindSchema>;

/** The persisted shape of one memory entry (a single JSONL row). */
export const MemoryEntrySchema = z.object({
  id: z.string().min(1),
  ts: IsoTimestamp,
  kind: MemoryKindSchema,
  severity: MemorySeveritySchema,
  /** Agent the entry is scoped to; absent/null = applies to all agents. */
  agent: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  /** One-line summary, injected verbatim at recall time. */
  summary: z.string().min(1).max(MAX_SUMMARY_LENGTH),
  /** Full text, fetched only on demand — never injected by default. */
  detail: z.string().optional(),
  /** Provenance: artifact path, decision id, or capture-site name. Mandatory. */
  source: z.string().min(1),
  /** Id of the entry this one replaces, when part of a supersede chain. */
  supersedes: z.string().optional(),
});
export type MemoryEntry = z.infer<typeof MemoryEntrySchema>;

/**
 * Caller-supplied shape for capture()/supersede() — id and ts are optional
 * because the provider assigns them when the caller omits them.
 */
export const MemoryEntryInputSchema = MemoryEntrySchema.extend({
  id: z.string().min(1).optional(),
  ts: IsoTimestamp.optional(),
});
// z.input (not z.infer/output) so tags/id/ts stay optional pre-defaulting —
// this is the shape callers pass to capture()/supersede(), before the
// provider assigns id/ts and Zod fills in default tags.
export type MemoryEntryInput = z.input<typeof MemoryEntryInputSchema>;

export const MemoryProviderKindSchema = z.enum(["none", "file", "astramem"]);
export type MemoryProviderKind = z.infer<typeof MemoryProviderKindSchema>;

const MemoryEnabledModeSchema = z.enum(["auto", "never"]);

const RecallConfigSchema = z
  .object({
    /** Shared recall kill-switch. */
    enabled: z.boolean().default(true),
    k: z.number().int().positive().default(5),
    timeoutMs: z.number().int().positive().default(5000),
    /** Token budget for the injected recall block. */
    maxTokens: z.number().int().positive().default(800),
  })
  .strict();

const DEFAULT_CAPTURE_EVENTS = [
  "slice_close",
  "review_fail",
  "validation_fail",
  "inline_return_warn",
  "subagent_incomplete",
  "incident_close",
];

const CaptureConfigSchema = z
  .object({
    events: z.array(z.string()).default(DEFAULT_CAPTURE_EVENTS),
  })
  .strict();

/** The unified `memory` config block. */
export const MemoryConfigSchema = z
  .object({
    /** Gates emit/recall active independent of provider. */
    enabled: MemoryEnabledModeSchema.default("auto"),
    /** Backend selector, orthogonal to `enabled`. Absent = "none". */
    provider: MemoryProviderKindSchema.default("none"),
    /**
     * When provider:"astramem", also append to the local JSONL duplicate
     * (the "2 parallel providers" mode). Ignored for provider:"file"|"none".
     */
    dualWrite: z.boolean().default(false),
    /** Scoping key for the memory backend (never a slice/feature id). */
    project: z.string().optional(),
    recall: RecallConfigSchema.default({}),
    capture: CaptureConfigSchema.default({}),
    /**
     * Consumer-side agent-profile injection + usefulness-feedback config
     * (dev-team #235 / runner). This package's provider does not read these
     * beyond `profile()`/`feedback()` transport — the consumer's own tolerant
     * parser owns the field semantics — but a `.strict()` schema MUST still
     * accept them, or `resolveProvider()` throws on any config that enables
     * the feature (which then silently disables recall too, since both share
     * this parse). Passthrough objects: validate presence, not shape.
     */
    profile: z.object({}).passthrough().optional(),
    feedback: z.object({}).passthrough().optional(),
  })
  .strict();
export type MemoryConfig = z.infer<typeof MemoryConfigSchema>;
