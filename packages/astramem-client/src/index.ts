// @astragenie/astramem-client — shared fail-silent client seam for the
// astramem memory plugin. See resolve.ts for the resolution chain and
// calls.ts for the capped call wrappers.

export type {
  HealthResponse,
  IngestPayload,
  RecallHit,
  RecallRequest,
  RecallResponse,
  WireProvider,
} from "./types.ts";
export {
  _resetResolveCache,
  _setWireProvider,
  resolveWireProvider,
} from "./resolve.ts";
export { DEFAULT_CAP_MS, rememberSilent, recallSilent, type CallOptions } from "./calls.ts";

// ---------------------------------------------------------------------------
// Direct daemon HTTP client (AstramemDaemonClient) — a typed client that
// talks to the astramem-local daemon's REST surface directly (baseUrl +
// bearer), distinct from the fail-silent WireProvider seam above. See
// daemon-client.ts's header comment for how the two relate.
//
// Four exported type names collide with the structural WireProvider mirrors
// above (HealthResponse, RecallRequest, RecallHit, RecallResponse) — the
// daemon's actual wire shapes are richer than the client's own minimal
// mirror, so they're re-exported here under a `Daemon`-prefixed alias
// instead of shadowing the existing names.
// ---------------------------------------------------------------------------

export { AstramemDaemonClient, createAstramemDaemonClient } from "./daemon-client.ts";
export type {
  AstramemDaemonClientOptions,
  IngestOpts,
  RequestOpts,
} from "./daemon-client.ts";
export { DaemonError } from "./daemon-error.ts";
export type { DaemonErrorBand, DaemonErrorOptions } from "./daemon-error.ts";
export { MEMORY_TYPES as DAEMON_MEMORY_TYPES } from "./daemon-types.ts";
export type {
  MemoryType as DaemonMemoryType,
  MemoryScope as DaemonMemoryScope,
  MemoryScopeInput as DaemonMemoryScopeInput,
  MemoryEventType as DaemonMemoryEventType,
  MemoryEvent as DaemonMemoryEvent,
  HealthResponse as DaemonHealthResponse,
  VersionResponse as DaemonVersionResponse,
  TranscriptTurn as DaemonTranscriptTurn,
  CanonicalEventItem as DaemonCanonicalEventItem,
  CanonicalIngestEnvelope as DaemonCanonicalIngestEnvelope,
  IngestTranscriptResponse as DaemonIngestTranscriptResponse,
  RecallFilters as DaemonRecallFilters,
  RecallRequest as DaemonRecallRequest,
  RecallHit as DaemonRecallHit,
  RecallResponse as DaemonRecallResponse,
  SearchParams as DaemonSearchParams,
  SearchResponse as DaemonSearchResponse,
  RememberRequest as DaemonRememberRequest,
  RememberResponse as DaemonRememberResponse,
  OkResponse as DaemonOkResponse,
  HistoryResponse as DaemonHistoryResponse,
  SessionBlock as DaemonSessionBlock,
  WhyReceipt as DaemonWhyReceipt,
  DigestMemRow as DaemonDigestMemRow,
  SessionDigest as DaemonSessionDigest,
  ConsolidationProposal as DaemonConsolidationProposal,
  ConsolidationRunOpts as DaemonConsolidationRunOpts,
  ConsolidateSummary as DaemonConsolidateSummary,
  ListProposalsResponse as DaemonListProposalsResponse,
} from "./daemon-types.ts";
