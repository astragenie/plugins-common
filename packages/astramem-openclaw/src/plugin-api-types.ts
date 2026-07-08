// Minimal structural types for the slice of OpenClaw's plugin SDK this
// package uses. Deliberately NOT imported from an `openclaw` package: this
// monorepo has no installed copy of the real `openclaw/plugin-sdk/*` types
// to compile against, and per docs.openclaw.ai/plugins/sdk-overview the real
// SDK is "typed contracts accessed through scoped subpaths" rather than one
// importable package. OpenClaw's loader duck-types whatever object this
// entry file's default export resolves to, so a structurally-compatible
// local type is sufficient to run correctly against the real host even
// though it can't type-check against the real one.
//
// See README.md "Verified vs assumed" — if/when the real SDK's shapes are
// confirmed to differ, this file is the only place that needs to change.

export interface HookContext {
  agentId?: string | undefined;
  sessionKey?: string | undefined;
  sessionId?: string | undefined;
  runId?: string | undefined;
  channel?: string | undefined;
  channelId?: string | undefined;
  senderId?: string | undefined;
  chatId?: string | undefined;
}

export interface CommandContext extends HookContext {
  args?: string | undefined;
  commandBody?: string | undefined;
  isAuthorizedSender?: boolean | undefined;
  config?: Record<string, unknown> | undefined;
}

export interface CommandResult {
  text?: string | undefined;
  continueAgent?: boolean | undefined;
  suppressReply?: boolean | undefined;
}

export interface CommandDefinition {
  name: string;
  description?: string | undefined;
  acceptsArgs?: boolean | undefined;
  requireAuth?: boolean | undefined;
  handler(ctx: CommandContext): CommandResult | Promise<CommandResult>;
}

export interface HookRegistrationOptions {
  priority?: number | undefined;
  timeoutMs?: number | undefined;
}

export interface PluginLogger {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

export interface OpenClawPluginApi {
  on(
    name: string,
    handler: (event: unknown) => unknown | Promise<unknown>,
    opts?: HookRegistrationOptions,
  ): void;
  registerCommand(def: CommandDefinition): void;
  pluginConfig?: Record<string, unknown> | undefined;
  logger?: PluginLogger | undefined;
}

export interface OpenClawPluginDefinition {
  id: string;
  name: string;
  description?: string | undefined;
  register(api: OpenClawPluginApi): void;
}
