---
kind: cost-report
feature: FEAT-004
run_title: "FEAT004 SLICE04"
usd: 107.3507
duration_ms: 839375
total_tokens: 50825165
cache_hit_pct: 99.1
source_project: aggregate
aggregate_all: true
source_count: 5
created_at: 2026-07-08T17:24:40.200Z
---

# Cost Report: FEAT004 SLICE04

- Created: 2026-07-08T17:24:40.200Z
- Run Title: FEAT004 SLICE04
- Window Start: 2026-07-08T17:10:29.180Z
- Window End: 2026-07-08T17:24:28.555Z
- Duration: 14.0 min (839375 ms)
- Sessions Scanned: 6
- Assistant Messages Counted: 178
- Total Tokens: 50,825,165
- Cache Hit %: 99.1%
- Total USD: $107.3507
- Source Project: aggregate
- Auto-detected: no
- Aggregate All: yes

## Sources (aggregated)

- C--work-mega-memory: 62 msgs, $47.5705
- C--work-mega-runner-plugin: 89 msgs, $43.3617
- C--work-mega-plugins-common: 23 msgs, $12.8471
- C--work-mega-runner: 3 msgs, $3.1013
- C--work-mega-astramemory-local: 1 msgs, $0.4700

## Tokens (totals)

- input: 20,699
- cache_create_5m: 0
- cache_create_1h: 424,026
- cache_read: 50,125,355
- output: 255,085

## Model Mix

- claude-opus-4-8 (priced as claude-opus-4): 178 msgs (100%), $107.3507 (100%)

## Conversation Shape

- user_msg_count: 6
- user_msg_avg_len: 1624
- turns_before_first_tool: 3
- compaction_count: 0
- skill_invocations: 0
- subagent_dispatches: 6

## Tool Usage

- Bash: 37 (1 failed)
- Read: 11
- Edit: 6
- Agent: 6
- Grep: 5
- Write: 2
- mcp__plugin_azure_azure__monitor: 1

## Tool Result Sizes (bytes)

- count: 71
- sum: 120,829
- p50: 382
- p90: 3,653
- max: 38,137

## File Re-reads

- redundant_read_count: 0

## Cache Priming (per tool, approximate)

Attribution: each tool's tool_result size weighted against the NEXT assistant turn's cache_create tokens. Numbers are directional, not precise — system-prompt drift and prior-turn re-injection inflate ratios.

- Bash: 36 calls, 28,107B results, ~186,940 cache_create tok (6.65×)
- Read: 11 calls, 30,357B results, ~62,184 cache_create tok (2.05×)
- mcp__plugin_azure_azure__monitor: 1 calls, 38,137B results, ~47,799 cache_create tok (1.25×)
- Edit: 6 calls, 1,159B results, ~42,786 cache_create tok (36.92×)
- Grep: 5 calls, 13,331B results, ~36,622 cache_create tok (2.75×)
- Agent: 5 calls, 6,485B results, ~25,142 cache_create tok (3.88×)
- Write: 2 calls, 481B results, ~15,810 cache_create tok (32.87×)


## By Model (token detail)

### claude-opus-4-8 (priced as claude-opus-4)
- messages: 178
- usd: $107.3507
- input: 20,699
- cache_create_5m: 0
- cache_create_1h: 424,026
- cache_read: 50,125,355
- output: 255,085

