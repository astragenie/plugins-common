---
kind: cost-report
feature: FEAT-004
run_title: "FEAT004 SLICE04"
usd: 11.2181
duration_ms: 839306
total_tokens: 5868853
cache_hit_pct: 99.5
source_project: C--work-mega-plugins-common
aggregate_all: false
source_count: 1
created_at: 2026-07-08T17:24:28.541Z
---

# Cost Report: FEAT004 SLICE04

- Created: 2026-07-08T17:24:28.541Z
- Run Title: FEAT004 SLICE04
- Window Start: 2026-07-08T17:10:29.180Z
- Window End: 2026-07-08T17:24:28.486Z
- Duration: 14.0 min (839306 ms)
- Sessions Scanned: 1
- Assistant Messages Counted: 20
- Total Tokens: 5,868,853
- Cache Hit %: 99.5%
- Total USD: $11.2181
- Source Project: C--work-mega-plugins-common
- Auto-detected: no
- Aggregate All: no

## Tokens (totals)

- input: 2,617
- cache_create_5m: 0
- cache_create_1h: 27,815
- cache_read: 5,816,833
- output: 21,588

## Model Mix

- claude-opus-4-8 (priced as claude-opus-4): 20 msgs (100%), $11.2181 (100%)

## Conversation Shape

- user_msg_count: 4
- user_msg_avg_len: 2417
- turns_before_first_tool: 2
- compaction_count: 0
- skill_invocations: 0
- subagent_dispatches: 4

## Tool Usage

- Agent: 4
- Bash: 2

## Tool Result Sizes (bytes)

- count: 7
- sum: 4,999
- p50: 950
- p90: 950
- max: 950

## File Re-reads

- redundant_read_count: 0

## Cache Priming (per tool, approximate)

Attribution: each tool's tool_result size weighted against the NEXT assistant turn's cache_create tokens. Numbers are directional, not precise — system-prompt drift and prior-turn re-injection inflate ratios.

- Agent: 4 calls, 3,800B results, ~13,064 cache_create tok (3.44×)
- Bash: 2 calls, 1,037B results, ~7,812 cache_create tok (7.53×)


## By Model (token detail)

### claude-opus-4-8 (priced as claude-opus-4)
- messages: 20
- usd: $11.2181
- input: 2,617
- cache_create_5m: 0
- cache_create_1h: 27,815
- cache_read: 5,816,833
- output: 21,588

