// UNVERIFIED — see README.md "Verified vs assumed".
//
// OpenClaw's public docs (docs.openclaw.ai/plugins/hooks, fetched 2026-07-08)
// describe the `agent_end` hook only as "Observe final messages and run
// outcome", plus the common context fields shared by all turn hooks
// (agentId, sessionKey, sessionId, runId, channel, channelId, senderId,
// chatId). The exact field name(s) carrying the completed turn's message
// content are NOT specified in the public docs at time of writing. Reading
// that content at all additionally requires the operator to opt in via
// `plugins.entries.<id>.hooks.allowConversationAccess: true` in their own
// openclaw.json (see README).
//
// Rather than guess one field name and throw (or silently miscapture) when
// it's wrong, this adapter sniffs several plausible shapes and returns []
// when none match. Callers MUST treat [] as "skip capture for this turn",
// never as an error. If/when OpenClaw ships a typed AgentEndEvent, replace
// this file's body with a direct field read and delete the sniffing.

export interface ExtractedTurn {
  role: "user" | "assistant";
  text: string;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function asRole(value: unknown): "user" | "assistant" | undefined {
  return value === "user" || value === "assistant" ? value : undefined;
}

/** Shape A: an array of `{ role, text | content }` message objects — the
 * most common shape across chat-turn hook payloads industry-wide. */
function extractFromMessageArray(messages: unknown): ExtractedTurn[] {
  if (!Array.isArray(messages)) return [];
  const turns: ExtractedTurn[] = [];
  for (const entry of messages) {
    if (typeof entry !== "object" || entry === null) continue;
    const rec = entry as Record<string, unknown>;
    const role = asRole(rec.role);
    const text = asString(rec.text) ?? asString(rec.content);
    if (role && text) turns.push({ role, text });
  }
  return turns;
}

/** Shape B: flat `userMessage`/`prompt`/`input` + `assistantReply`/`reply`/
 * `output`/`finalReply` fields directly on the event. */
function extractFromFlatFields(rec: Record<string, unknown>): ExtractedTurn[] {
  const turns: ExtractedTurn[] = [];
  const userText = asString(rec.userMessage) ?? asString(rec.prompt) ?? asString(rec.input);
  if (userText) turns.push({ role: "user", text: userText });
  const assistantText =
    asString(rec.assistantReply) ??
    asString(rec.reply) ??
    asString(rec.output) ??
    asString(rec.finalReply);
  if (assistantText) turns.push({ role: "assistant", text: assistantText });
  return turns;
}

/**
 * Best-effort extraction of a completed turn's user+assistant text from an
 * `agent_end` (or similarly-shaped) hook event. Returns `[]` when nothing
 * recognizable is found.
 */
export function extractTurnText(event: unknown): ExtractedTurn[] {
  if (typeof event !== "object" || event === null) return [];
  const rec = event as Record<string, unknown>;

  const fromMessages = extractFromMessageArray(rec.messages);
  if (fromMessages.length > 0) return fromMessages;

  const fromFinalMessages = extractFromMessageArray(rec.finalMessages);
  if (fromFinalMessages.length > 0) return fromFinalMessages;

  return extractFromFlatFields(rec);
}
