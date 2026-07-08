/**
 * AC-4 (observability): exactly one structured JSON log line per generator
 * run — success OR failure — so a registry-publish failure is observable in
 * CI logs instead of a silent no-op.
 */
export interface RegistryLogLine {
  readonly plugin: string;
  readonly agentCount: number;
  readonly skillCount: number;
  readonly durationMs: number;
  readonly outcome: "success" | "failure";
}

/** Emit one JSON log line. `write` is injectable so tests can assert on the exact shape without capturing stdout. */
export function emitRegistryLog(
  line: RegistryLogLine,
  write: (serialized: string) => void = (s) => console.log(s),
): void {
  write(JSON.stringify(line));
}
