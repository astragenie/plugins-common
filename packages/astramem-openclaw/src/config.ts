// Config resolution: plugin config (validated by OpenClaw against
// openclaw.plugin.json's configSchema, surfaced to us as `api.pluginConfig`)
// takes precedence over env vars, which take precedence over defaults.
// Resolved once per `register(api)` call — mirrors astramemory-local's own
// "config read exactly once per process at boot, no live reload" contract
// (see that repo's CLAUDE.md "Config reload (FEAT-433, resolved)") so the
// two halves of this integration behave the same way operationally.

export interface RawPluginConfig {
  baseUrl?: string | undefined;
  bearer?: string | undefined;
  projectId?: string | undefined;
  profileEveryNTurns?: number | undefined;
  captureEnabled?: boolean | undefined;
  recallEnabled?: boolean | undefined;
  recallK?: number | undefined;
}

export interface AstramemOpenClawConfig {
  baseUrl: string;
  bearer: string | undefined;
  projectId: string | undefined;
  profileEveryNTurns: number;
  captureEnabled: boolean;
  recallEnabled: boolean;
  recallK: number;
}

const DEFAULT_BASE_URL = "http://127.0.0.1:7777";
const DEFAULT_PROFILE_EVERY_N_TURNS = 50;
const DEFAULT_RECALL_K = 5;

function asRawConfig(pluginConfig: Record<string, unknown> | undefined): RawPluginConfig {
  if (!pluginConfig) return {};
  const raw = pluginConfig as RawPluginConfig;
  return raw;
}

export function resolveConfig(
  pluginConfig: Record<string, unknown> | undefined,
  env: NodeJS.ProcessEnv = process.env,
): AstramemOpenClawConfig {
  const raw = asRawConfig(pluginConfig);
  return {
    baseUrl: raw.baseUrl ?? env.ASTRAMEM_BASE_URL ?? DEFAULT_BASE_URL,
    bearer: raw.bearer ?? env.ASTRAMEM_BEARER,
    projectId: raw.projectId ?? env.ASTRAMEM_PROJECT_ID,
    profileEveryNTurns: raw.profileEveryNTurns ?? DEFAULT_PROFILE_EVERY_N_TURNS,
    captureEnabled: raw.captureEnabled ?? true,
    recallEnabled: raw.recallEnabled ?? true,
    recallK: raw.recallK ?? DEFAULT_RECALL_K,
  };
}
