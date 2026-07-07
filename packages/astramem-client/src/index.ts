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
