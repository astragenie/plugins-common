// @astragenie/memory-provider — resolve-provider.ts
//
// The top-level wiring point: parse config -> resolve enabled x provider
// precedence -> pick a provider instance. provider:"astramem" routes to
// astramemProvider, which itself falls back to fileProvider when astramem
// is unpaired/unreachable — see ./astramem-provider.ts.
//
// Adapted from dev-team's scripts/lib/memory/resolve-provider.ts
// (FEAT-188 S2 + S4) — astragenie/plugins-common W3a. Adds an optional
// third `options.file` param so a caller can plumb a custom `storePath` /
// `normalizeRow` through to whichever provider gets constructed (both
// fileProvider and astramemProvider's own fallback fileProvider) — see
// ./file-provider.ts's header for why those two became configurable.
import { astramemProvider } from "./astramem-provider.ts";
import { parseMemoryConfig, resolveEffectiveConfig } from "./config.ts";
import { type FileProviderOptions, fileProvider } from "./file-provider.ts";
import { noopProvider } from "./noop-provider.ts";
import type { MemoryProvider } from "./types.ts";

export interface ResolveProviderOptions {
  file?: Pick<FileProviderOptions, "storePath" | "normalizeRow">;
}

export function resolveProvider(
  rawConfig: unknown,
  repoPath: string,
  options: ResolveProviderOptions = {},
): MemoryProvider {
  const config = parseMemoryConfig(rawConfig);
  const effective = resolveEffectiveConfig(config);

  if (!effective.captureEnabled) return noopProvider();

  const fileOverrides: Pick<FileProviderOptions, "storePath" | "normalizeRow"> = {
    ...(options.file?.storePath ? { storePath: options.file.storePath } : {}),
    ...(options.file?.normalizeRow ? { normalizeRow: options.file.normalizeRow } : {}),
  };

  if (effective.provider === "astramem") {
    return astramemProvider(repoPath, {
      dualWrite: effective.dualWrite,
      recall: { k: effective.recall.k, maxTokens: effective.recall.maxTokens },
      ...fileOverrides,
    });
  }

  return fileProvider(repoPath, {
    recall: { k: effective.recall.k, maxTokens: effective.recall.maxTokens },
    ...fileOverrides,
  });
}
