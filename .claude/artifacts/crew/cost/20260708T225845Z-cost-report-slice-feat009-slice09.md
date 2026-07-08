---
kind: cost-report
feature: FEAT-009
run_title: "FEAT009 SLICE09"
usd: 10.0995
duration_ms: 919172
total_tokens: 4209456
cache_hit_pct: 98.9
source_project: C--work-mega-plugins-common
aggregate_all: false
source_count: 1
created_at: 2026-07-08T22:58:45.698Z
---

# Cost Report: FEAT009 SLICE09

- Created: 2026-07-08T22:58:45.698Z
- Run Title: FEAT009 SLICE09
- Window Start: 2026-07-08T22:43:26.431Z
- Window End: 2026-07-08T22:58:45.603Z
- Duration: 15.3 min (919172 ms)
- Sessions Scanned: 1
- Assistant Messages Counted: 19
- Total Tokens: 4,209,456
- Cache Hit %: 98.9%
- Total USD: $10.0995
- Source Project: C--work-mega-plugins-common
- Auto-detected: no
- Aggregate All: no

## Tokens (totals)

- input: 1,313
- cache_create_5m: 0
- cache_create_1h: 43,157
- cache_read: 4,130,460
- output: 34,526

## Model Mix

- claude-opus-4-8 (priced as claude-opus-4): 19 msgs (100%), $10.0995 (100%)

## Conversation Shape

- user_msg_count: 0
- user_msg_avg_len: 0
- turns_before_first_tool: 2
- compaction_count: 0
- skill_invocations: 0
- subagent_dispatches: 3

## Tool Usage

- Bash: 4
- Agent: 3

## Tool Result Sizes (bytes)

- count: 7
- sum: 7,628
- p50: 600
- p90: 2,547
- max: 2,547

## File Re-reads

- redundant_read_count: 0

## Cache Priming (per tool, approximate)

Attribution: each tool's tool_result size weighted against the NEXT assistant turn's cache_create tokens. Numbers are directional, not precise — system-prompt drift and prior-turn re-injection inflate ratios.

- Agent: 3 calls, 6,273B results, ~28,458 cache_create tok (4.54×)
- Bash: 3 calls, 1,021B results, ~13,046 cache_create tok (12.78×)


## By Model (token detail)

### claude-opus-4-8 (priced as claude-opus-4)
- messages: 19
- usd: $10.0995
- input: 1,313
- cache_create_5m: 0
- cache_create_1h: 43,157
- cache_read: 4,130,460
- output: 34,526

