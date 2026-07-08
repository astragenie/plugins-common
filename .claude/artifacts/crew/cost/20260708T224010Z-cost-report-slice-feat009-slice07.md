---
kind: cost-report
feature: FEAT-009
run_title: "FEAT009 SLICE07"
usd: 18.1047
duration_ms: 1956295
total_tokens: 7505566
cache_hit_pct: 98.6
source_project: C--work-mega-plugins-common
aggregate_all: false
source_count: 1
created_at: 2026-07-08T22:40:10.392Z
---

# Cost Report: FEAT009 SLICE07

- Created: 2026-07-08T22:40:10.392Z
- Run Title: FEAT009 SLICE07
- Window Start: 2026-07-08T22:07:33.999Z
- Window End: 2026-07-08T22:40:10.294Z
- Duration: 32.6 min (1956295 ms)
- Sessions Scanned: 1
- Assistant Messages Counted: 41
- Total Tokens: 7,505,566
- Cache Hit %: 98.6%
- Total USD: $18.1047
- Source Project: C--work-mega-plugins-common
- Auto-detected: no
- Aggregate All: no

## Tokens (totals)

- input: 10,639
- cache_create_5m: 0
- cache_create_1h: 92,860
- cache_read: 7,346,880
- output: 55,187

## Model Mix

- claude-opus-4-8 (priced as claude-opus-4): 41 msgs (100%), $18.1047 (100%)

## Conversation Shape

- user_msg_count: 3
- user_msg_avg_len: 2223
- turns_before_first_tool: 2
- compaction_count: 0
- skill_invocations: 0
- subagent_dispatches: 6

## Tool Usage

- Agent: 6
- Bash: 6
- Read: 1

## Tool Result Sizes (bytes)

- count: 14
- sum: 15,783
- p50: 579
- p90: 3,548
- max: 3,943

## File Re-reads

- redundant_read_count: 0

## Cache Priming (per tool, approximate)

Attribution: each tool's tool_result size weighted against the NEXT assistant turn's cache_create tokens. Numbers are directional, not precise — system-prompt drift and prior-turn re-injection inflate ratios.

- Agent: 6 calls, 12,370B results, ~56,316 cache_create tok (4.55×)
- Bash: 6 calls, 2,610B results, ~22,999 cache_create tok (8.81×)
- Read: 1 calls, 569B results, ~3,099 cache_create tok (5.45×)


## By Model (token detail)

### claude-opus-4-8 (priced as claude-opus-4)
- messages: 41
- usd: $18.1047
- input: 10,639
- cache_create_5m: 0
- cache_create_1h: 92,860
- cache_read: 7,346,880
- output: 55,187

