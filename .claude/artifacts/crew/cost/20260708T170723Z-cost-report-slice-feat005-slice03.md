---
kind: cost-report
feature: FEAT-005
run_title: "FEAT005 SLICE03"
usd: 18.5799
duration_ms: 1450252
total_tokens: 8730245
cache_hit_pct: 99.2
source_project: C--work-mega-plugins-common
aggregate_all: false
source_count: 1
created_at: 2026-07-08T17:07:23.626Z
---

# Cost Report: FEAT005 SLICE03

- Created: 2026-07-08T17:07:23.626Z
- Run Title: FEAT005 SLICE03
- Window Start: 2026-07-08T16:43:13.332Z
- Window End: 2026-07-08T17:07:23.584Z
- Duration: 24.2 min (1450252 ms)
- Sessions Scanned: 1
- Assistant Messages Counted: 34
- Total Tokens: 8,730,245
- Cache Hit %: 99.2%
- Total USD: $18.5799
- Source Project: C--work-mega-plugins-common
- Auto-detected: no
- Aggregate All: no

## Tokens (totals)

- input: 13,122
- cache_create_5m: 0
- cache_create_1h: 60,306
- cache_read: 8,607,992
- output: 48,825

## Model Mix

- claude-opus-4-8 (priced as claude-opus-4): 34 msgs (100%), $18.5799 (100%)

## Conversation Shape

- user_msg_count: 6
- user_msg_avg_len: 1557
- turns_before_first_tool: 2
- compaction_count: 0
- skill_invocations: 0
- subagent_dispatches: 5

## Tool Usage

- Agent: 5
- Bash: 4
- Edit: 1

## Tool Result Sizes (bytes)

- count: 11
- sum: 6,589
- p50: 728
- p90: 950
- max: 950

## File Re-reads

- redundant_read_count: 0

## Cache Priming (per tool, approximate)

Attribution: each tool's tool_result size weighted against the NEXT assistant turn's cache_create tokens. Numbers are directional, not precise — system-prompt drift and prior-turn re-injection inflate ratios.

- Agent: 5 calls, 4,750B results, ~29,128 cache_create tok (6.13×)
- Bash: 4 calls, 1,543B results, ~25,355 cache_create tok (16.43×)
- Edit: 1 calls, 184B results, ~4,428 cache_create tok (24.07×)


## By Model (token detail)

### claude-opus-4-8 (priced as claude-opus-4)
- messages: 34
- usd: $18.5799
- input: 13,122
- cache_create_5m: 0
- cache_create_1h: 60,306
- cache_read: 8,607,992
- output: 48,825

