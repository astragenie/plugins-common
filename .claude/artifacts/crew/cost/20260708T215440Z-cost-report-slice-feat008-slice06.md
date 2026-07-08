---
kind: cost-report
feature: FEAT-008
run_title: "FEAT008 SLICE06"
usd: 20.7489
duration_ms: 825386
total_tokens: 7574511
cache_hit_pct: 98.2
source_project: C--work-mega-plugins-common
aggregate_all: false
source_count: 1
created_at: 2026-07-08T21:54:40.830Z
---

# Cost Report: FEAT008 SLICE06

- Created: 2026-07-08T21:54:40.830Z
- Run Title: FEAT008 SLICE06
- Window Start: 2026-07-08T21:40:55.312Z
- Window End: 2026-07-08T21:54:40.698Z
- Duration: 13.8 min (825386 ms)
- Sessions Scanned: 1
- Assistant Messages Counted: 63
- Total Tokens: 7,574,511
- Cache Hit %: 98.2%
- Total USD: $20.7489
- Source Project: C--work-mega-plugins-common
- Auto-detected: no
- Aggregate All: no

## Tokens (totals)

- input: 6,061
- cache_create_5m: 0
- cache_create_1h: 125,315
- cache_read: 7,365,123
- output: 78,012

## Model Mix

- claude-opus-4-8 (priced as claude-opus-4): 63 msgs (100%), $20.7489 (100%)

## Conversation Shape

- user_msg_count: 1
- user_msg_avg_len: 3190
- turns_before_first_tool: 2
- compaction_count: 0
- skill_invocations: 0
- subagent_dispatches: 2

## Tool Usage

- Bash: 19 (1 failed)
- Edit: 3
- Agent: 2
- Read: 1

## Tool Result Sizes (bytes)

- count: 26
- sum: 34,899
- p50: 579
- p90: 4,059
- max: 8,310

## File Re-reads

- redundant_read_count: 0

## Cache Priming (per tool, approximate)

Attribution: each tool's tool_result size weighted against the NEXT assistant turn's cache_create tokens. Numbers are directional, not precise — system-prompt drift and prior-turn re-injection inflate ratios.

- Bash: 19 calls, 20,827B results, ~87,779 cache_create tok (4.21×)
- Agent: 2 calls, 5,009B results, ~18,773 cache_create tok (3.75×)
- Edit: 3 calls, 420B results, ~4,893 cache_create tok (11.65×)
- Read: 1 calls, 333B results, ~2,311 cache_create tok (6.94×)


## By Model (token detail)

### claude-opus-4-8 (priced as claude-opus-4)
- messages: 63
- usd: $20.7489
- input: 6,061
- cache_create_5m: 0
- cache_create_1h: 125,315
- cache_read: 7,365,123
- output: 78,012

