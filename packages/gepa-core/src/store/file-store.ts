import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DeterministicError, type Result, append, err, ok, readSafe } from "@astragenie/plugin-std";
import type { TrialStore } from "../interfaces.ts";
import { type Trial, TrialSchema } from "../types/trial.ts";

function jsonlPathFor(root: string, agent: string): string {
  if (!existsSync(root)) mkdirSync(root, { recursive: true });
  return join(root, `${agent}.jsonl`);
}

async function readJsonlSafe(path: string): Promise<readonly Trial[]> {
  const { records } = await readSafe(path, (raw) => TrialSchema.parse(JSON.parse(raw)));
  return records;
}

function matches(trial: Trial, filter: Parameters<TrialStore["recall"]>[0]): boolean {
  if (filter.agent && trial.agent !== filter.agent) return false;
  if (filter.phase && trial.phase !== filter.phase) return false;
  if (filter.source && trial.source !== filter.source) return false;
  if (filter.minScore !== undefined && trial.score.score < filter.minScore) return false;
  if (filter.failuresOnly && trial.score.pass) return false;
  if (filter.since && trial.created_at < filter.since) return false;
  return true;
}

export function fileStore(root: string): TrialStore {
  return {
    async put(trial): Promise<Result<Trial, DeterministicError>> {
      // Gate Zero (FEAT-001 SLICE-01): validate via safeParse — never throw on
      // malformed input. Callers get a typed, non-retryable error instead.
      const parsed = TrialSchema.safeParse(trial);
      if (!parsed.success) {
        return err(
          new DeterministicError("Invalid trial: failed schema validation", {
            code: "E_TRIAL_SCHEMA",
            cause: parsed.error,
          }),
        );
      }
      const validated = parsed.data;
      await append(jsonlPathFor(root, validated.agent), validated);
      return ok(validated);
    },

    async recall(filter) {
      if (!existsSync(root)) return [];
      const files = new Set<string>();
      if (filter.agent) {
        files.add(jsonlPathFor(root, filter.agent));
      } else {
        for (const entry of readdirSync(root)) {
          if (entry.endsWith(".jsonl")) files.add(join(root, entry));
        }
      }
      const trials: Trial[] = [];
      for (const p of files) trials.push(...(await readJsonlSafe(p)));
      const filtered = trials.filter((t) => matches(t, filter));
      filtered.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
      return filter.limit ? filtered.slice(0, filter.limit) : filtered;
    },

    async invalidate(filter) {
      if (!existsSync(root)) return 0;
      const files = readdirSync(root)
        .filter((f) => f.endsWith(".jsonl"))
        .map((f) => join(root, f));
      let purgeCount = 0;
      for (const p of files) {
        const trials = await readJsonlSafe(p);
        const kept = trials.filter((t) => {
          if (filter.trial_ids?.includes(t.id)) {
            purgeCount++;
            return false;
          }
          if (filter.agent && t.agent === filter.agent) {
            purgeCount++;
            return false;
          }
          if (filter.since && t.created_at >= filter.since) {
            purgeCount++;
            return false;
          }
          return true;
        });
        const out = kept.map((t) => `${JSON.stringify(t)}\n`).join("");
        writeFileSync(p, out);
      }
      return purgeCount;
    },
  };
}
