---
kind: cost-report
feature: FEAT-009
run_title: "FEAT009 SLICE09"
usd: 131.5467
duration_ms: 875294
total_tokens: 63802895
cache_hit_pct: 99.3
source_project: aggregate
aggregate_all: true
source_count: 4
created_at: 2026-07-08T22:58:20.114Z
---

# Cost Report: FEAT009 SLICE09

- Created: 2026-07-08T22:58:20.114Z
- Run Title: FEAT009 SLICE09
- Window Start: 2026-07-08T22:43:26.431Z
- Window End: 2026-07-08T22:58:01.725Z
- Duration: 14.6 min (875294 ms)
- Sessions Scanned: 4
- Assistant Messages Counted: 148
- Total Tokens: 63,802,895
- Cache Hit %: 99.3%
- Total USD: $131.5467
- Source Project: aggregate
- Auto-detected: no
- Aggregate All: yes

## Sources (aggregated)

- C--work-mega-memory: 65 msgs, $72.3528
- C--work-mega-astramemory-local: 39 msgs, $28.5210
- C--work-mega-runner: 29 msgs, $22.3347
- C--work-mega-plugins-common: 15 msgs, $8.3383

## Tokens (totals)

- input: 17,665
- cache_create_5m: 0
- cache_create_1h: 401,712
- cache_read: 63,054,877
- output: 328,641

## Model Mix

- claude-opus-4-8 (priced as claude-opus-4): 148 msgs (100%), $131.5467 (100%)

## Conversation Shape

- user_msg_count: 9
- user_msg_avg_len: 979
- turns_before_first_tool: 2
- compaction_count: 0
- skill_invocations: 0
- subagent_dispatches: 13

## Tool Usage

- Bash: 29
- Agent: 13 (3 failed)
- Read: 4
- Write: 2
- Edit: 2
- AskUserQuestion: 1

## Tool Result Sizes (bytes)

- count: 51
- sum: 51,606
- p50: 762
- p90: 2,422
- max: 4,884

## File Re-reads

- redundant_read_count: 0

## Cache Priming (per tool, approximate)

Attribution: each tool's tool_result size weighted against the NEXT assistant turn's cache_create tokens. Numbers are directional, not precise — system-prompt drift and prior-turn re-injection inflate ratios.

- Bash: 28 calls, 22,507B results, ~169,271 cache_create tok (7.52×)
- Agent: 13 calls, 17,545B results, ~145,104 cache_create tok (8.27×)
- Read: 4 calls, 10,073B results, ~39,073 cache_create tok (3.88×)
- Edit: 2 calls, 356B results, ~15,063 cache_create tok (42.31×)
- Write: 2 calls, 382B results, ~13,569 cache_create tok (35.52×)
- AskUserQuestion: 1 calls, 409B results, ~12,894 cache_create tok (31.53×)


## By Model (token detail)

### claude-opus-4-8 (priced as claude-opus-4)
- messages: 148
- usd: $131.5467
- input: 17,665
- cache_create_5m: 0
- cache_create_1h: 401,712
- cache_read: 63,054,877
- output: 328,641

