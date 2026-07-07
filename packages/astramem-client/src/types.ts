// Structural mirrors of astramem-plugin's wire contracts
// (astramem-plugin src/contracts/wire.ts). Kept structural — no compile-time
// dependency on the plugin — so consumers that discover the plugin at runtime
// (no package dep) still typecheck. The plugin's Zod schemas remain the
// authoritative wire contract; drift here surfaces as a provider rejection,
// which every call path in this package swallows fail-silent.

/** Payload accepted by `provider.remember()` (IngestPayloadSchema). */
export interface IngestPayload {
  /** Unique identifier for the item being ingested. */
  id: string;
  /** Content type: 'lesson' | 'decision' | 'note' | 'failure' | free string. */
  type: string;
  /** The text content to ingest. */
  text: string;
  /** Optional originating source (e.g. repo name). */
  source?: string | undefined;
  /** Optional importance score 0..1. */
  importance?: number | undefined;
  /** Optional provider confidence 0..1. */
  confidence?: number | undefined;
  /** Optional key/value metadata. */
  metadata?: Record<string, unknown> | undefined;
}

/** Request accepted by `provider.recall()` (RecallRequestSchema). */
export interface RecallRequest {
  query: string;
  k?: number | undefined;
  repo?: string | undefined;
  /** Single value or OR-list (FEAT-423). */
  project?: string | string[] | undefined;
  /** Single value or OR-list (FEAT-423). */
  agent?: string | string[] | undefined;
}

/** One memory hit (RecallHitSchema). */
export interface RecallHit {
  id: string;
  type: string;
  text: string;
  score: number;
  source?: string | undefined;
  importance?: number | undefined;
  confidence?: number | undefined;
}

/** Response from `provider.recall()` (RecallResponseSchema). */
export interface RecallResponse {
  hits: RecallHit[];
  total_searched?: number | undefined;
  provider?: string | undefined;
}

/** Health probe result (HealthResponse — only the field this package reads). */
export interface HealthResponse {
  ok: boolean;
}

/** Structural view of astramem-plugin's MemoryProvider — only the surface
 * this client calls (the plugin's full interface also carries ingest /
 * ingestTranscript, which stay plugin-internal concerns). */
export interface WireProvider {
  remember(req: IngestPayload): Promise<unknown>;
  recall(req: RecallRequest): Promise<RecallResponse>;
  health(): Promise<HealthResponse>;
}
