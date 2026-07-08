// Hand-written request/response types for the astramem-local daemon's HTTP
// wire contract. Mirrors astramemory-local src/server/routes/*.ts and
// src/contracts/*.ts field-for-field, but is NOT generated from or imported
// from the daemon repo — this package has no build-time dependency on it.
//
// Follow-up: adopt @astragenie/astramem-contracts once it ships a published
// package for these shapes (see astramemory-local's
// src/contracts/recall-filters.ts header for why the daemon itself can't
// import its own contracts/ dir today). Until then, drift between this file
// and the daemon surfaces as an AstramemDaemonClient call rejecting with a
// DaemonError, not a silent type mismatch.

// ---------------------------------------------------------------------------
// Shared vocabulary
// ---------------------------------------------------------------------------

/** Mirrors astramemory-local src/contracts/memory.ts MEMORY_TYPES. */
export const MEMORY_TYPES = [
  "decision",
  "fact",
  "lesson",
  "command",
  "todo",
  "note",
  "event",
  "preference",
  "task_result",
  "summary",
] as const;
export type MemoryType = (typeof MEMORY_TYPES)[number];

/** Canonical memory scope (ADR-009). 'personal' is a one-release inbound
 * alias the daemon still accepts and normalizes to 'private' server-side —
 * new callers should send 'private' directly. */
export type MemoryScope = "private" | "team" | "org";
export type MemoryScopeInput = MemoryScope | "personal";

/** memory_events lifecycle log entry type. */
export type MemoryEventType =
  | "create"
  | "invalidate"
  | "supersede"
  | "promote_scope"
  | "erase_request"
  | "usefulness"
  | "archive"
  | "restore";

export interface MemoryEvent {
  seq: number;
  event_id: string;
  event_type: MemoryEventType;
  atom_id: string;
  payload_json: string | null;
  content_hash: string | null;
  created_at: number;
  synced_at: number | null;
}

// ---------------------------------------------------------------------------
// GET /health, GET /version
// ---------------------------------------------------------------------------

export interface HealthResponse {
  ok: boolean;
  version: string;
  wire_versions_supported: string[];
  contract_schema_version: string;
  schema_version: number;
  security: { redaction: boolean; encryption: boolean };
  usefulness: { served_7d: number; used_7d: number; rate_7d: number | null };
  /** Degraded-start block — present once the daemon wires a HealthState (current builds always do). */
  status?: "starting" | "ok" | "degraded";
  uptime_s?: number;
  embed?: { ok: boolean; last_ok_at: number | null; last_error: string | null; attempts: number };
  worker?: { alive: boolean; last_tick_at: number | null; last_tick_ago_ms: number | null };
  queue?: Record<string, number>;
  pending_proposals?: number;
  disk_free_bytes?: number | null;
}

export interface VersionResponse {
  name: string;
  version: string;
  wire_versions_supported: string[];
  contract_schema_version: string;
  schema_version: number;
  ts: number;
}

// ---------------------------------------------------------------------------
// POST /ingest/transcript — canonical v1.0 envelope only (FEAT-4a Phase 2).
// The daemon also accepts a legacy v0.0 {session_id, source, content} shape —
// out of scope here; new callers should always speak canonical.
// ---------------------------------------------------------------------------

export interface TranscriptTurn {
  role: "user" | "assistant";
  text: string;
  /** ISO-8601 if present. */
  ts?: string;
}

/** ADR-008 capture@1 pre-typed atom candidate — skips distill stages 1-5. */
export interface CanonicalEventItem {
  type: "decision" | "fact" | "lesson" | "command" | "todo" | "note" | "event";
  text: string;
  importance?: number;
  confidence?: number;
  evidence?: string;
  occurred_at?: number;
}

/**
 * Canonical ingest envelope (wire_version "v1.0"). Discriminated by `kind`:
 * 'transcript' (default) requires `turns`; 'events' requires `events`.
 */
export interface CanonicalIngestEnvelope {
  event: "pre_compact" | "session_end" | "subagent_stop";
  session_id: string;
  project_id: string;
  agent_type?: string;
  cwd?: string;
  /** ISO-8601 with UTC offset (e.g. trailing "Z"). */
  captured_at: string;
  /** Defaults server-side to 'transcript' when omitted. */
  kind?: "transcript" | "events";
  turns?: TranscriptTurn[];
  /** Required (1-500 items) when kind === 'events'. */
  events?: CanonicalEventItem[];
  tool?: string;
  client_scrub_applied: boolean;
  client_scrub_hits: number;
  client_version: string;
  client_scrub_version: string;
  client_scrub_hits_by_label?: Record<string, number>;
  /** Must match ^v(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)$ — e.g. "v1.0". */
  wire_version: string;
}

export interface IngestTranscriptResponse {
  ok: true;
  summary_memory_id: string;
  session_id: string;
  idempotent: boolean;
  /** Absent on an idempotent replay (the job already ran/is running). */
  extraction_job_id?: string;
  extracted_count?: number;
  failed_atom_count?: number;
  scrub_hits?: { client: number; server: number };
  queued_extraction_types?: string[];
}

// ---------------------------------------------------------------------------
// POST /recall, GET /search, POST /remember
// ---------------------------------------------------------------------------

/** Shared filter set (FEAT-429 registry): repo/project/agent/agentMode/since/as_of/entity. */
export interface RecallFilters {
  type?: MemoryType[];
  /** Scalar exact match — no OR-list semantics. */
  repo?: string;
  /** Single value or OR-list. */
  project?: string | string[];
  /** Single value or OR-list — exact match on provenance agent/agent_type. */
  agent?: string | string[];
  /** 'filter' (default) hard-excludes non-matching agent; 'boost' re-ranks only. */
  agentMode?: "filter" | "boost";
  /** Epoch-ms lower bound on created_at (inclusive). */
  since?: number;
  /** ISO-8601 date-time — bitemporal time-travel (ADR-001/ADR-005). */
  as_of?: string;
  /** Entity name filter (FEAT-402); unresolvable name yields zero results, not "no constraint". */
  entity?: string;
}

export interface RecallRequest {
  query: string;
  k?: number;
  filters?: RecallFilters;
}

export interface RecallHit {
  id: string;
  type: MemoryType;
  text: string;
  score: number;
  source: "fts" | "vec" | "both";
}

export interface RecallResponse {
  hits: RecallHit[];
}

/** GET /search query params — same filter vocabulary as RecallFilters, flattened. */
export interface SearchParams {
  q: string;
  limit?: number;
  type?: MemoryType[];
  repo?: string;
  project?: string | string[];
  agent?: string | string[];
  agentMode?: "filter" | "boost";
  since?: number;
  as_of?: string;
  entity?: string;
}

export interface SearchResponse {
  hits: RecallHit[];
}

export interface RememberRequest {
  text: string;
  type: MemoryType;
  repo?: string;
  project?: string;
  branch?: string;
  agent?: string;
  importance?: number;
  confidence?: number;
}

export interface RememberResponse {
  id: string;
  ok: true;
}

// ---------------------------------------------------------------------------
// Lifecycle — POST/GET/DELETE /memory/:id/*
// ---------------------------------------------------------------------------

export interface OkResponse {
  ok: true;
}

export interface HistoryResponse {
  id: string;
  history: MemoryEvent[];
}

// ---------------------------------------------------------------------------
// GET /sessions/:id/digest, GET /memory/:id/why
// ---------------------------------------------------------------------------

export interface SessionBlock {
  id: string;
  repo: string | null;
  branch: string | null;
  agent: string | null;
  started_at: number;
}

export interface WhyReceipt {
  id: string;
  type: string;
  text: string;
  importance: number;
  confidence: number;
  evidence: unknown;
  session: SessionBlock | null;
  transcript_ref: unknown;
  created_at: number;
  history: MemoryEvent[];
}

export interface DigestMemRow {
  id: string;
  type: string;
  text: string;
}

export interface SessionDigest {
  session_id: string;
  status: "pending" | "ready" | "partial";
  poison_jobs: number;
  counts: Record<string, number>;
  memories: DigestMemRow[];
}

// ---------------------------------------------------------------------------
// Consolidation — POST /consolidation/run, GET/POST /consolidation/proposals*
// ---------------------------------------------------------------------------

export interface ConsolidationProposal {
  id: string;
  kind: "merge" | "contradiction";
  winner_id: string;
  loser_id: string;
  similarity: number;
  status: "pending" | "accepted" | "rejected";
  created_at: number;
  resolved_at: number | null;
}

export interface ConsolidationRunOpts {
  merge_threshold?: number;
  propose_threshold?: number;
}

export interface ConsolidateSummary {
  groupsScanned: number;
  groupsSkipped: Array<{ repo: string | null; type: string; size: number }>;
  merged: Array<{
    winner: string;
    loser: string;
    similarity: number;
    reason?: "similarity" | "contained";
  }>;
  proposed: Array<{ winner: string; loser: string; similarity: number }>;
  autoAcceptedProposals: string[];
  staleRejectedProposals: string[];
}

export interface ListProposalsResponse {
  proposals: ConsolidationProposal[];
}
