---
kind: cost-report
feature: FEAT-002
run_title: "FEAT002 SLICE02"
usd: 20.917
duration_ms: 1073529
total_tokens: 10327882
cache_hit_pct: 99.4
source_project: C--work-mega-plugins-common
aggregate_all: false
source_count: 1
created_at: 2026-07-08T16:41:20.394Z
---

# Cost Report: FEAT002 SLICE02

- Created: 2026-07-08T16:41:20.394Z
- Run Title: FEAT002 SLICE02
- Window Start: 2026-07-08T16:23:26.823Z
- Window End: 2026-07-08T16:41:20.352Z
- Duration: 17.9 min (1073529 ms)
- Sessions Scanned: 1
- Assistant Messages Counted: 48
- Total Tokens: 10,327,882
- Cache Hit %: 99.4%
- Total USD: $20.9170
- Source Project: C--work-mega-plugins-common
- Auto-detected: no
- Aggregate All: no

## Tokens (totals)

- input: 6,465
- cache_create_5m: 0
- cache_create_1h: 58,836
- cache_read: 10,212,771
- output: 49,810

## Model Mix

- claude-opus-4-8 (priced as claude-opus-4): 48 msgs (100%), $20.9170 (100%)

## Conversation Shape

- user_msg_count: 6
- user_msg_avg_len: 2455
- turns_before_first_tool: 2
- compaction_count: 0
- skill_invocations: 0
- subagent_dispatches: 5

## Tool Usage

- Bash: 7 (1 failed)
- Agent: 5
- Write: 2
- AskUserQuestion: 1
- ToolSearch: 1
- TaskList: 1

## Tool Result Sizes (bytes)

- count: 18
- sum: 8,523
- p50: 238
- p90: 950
- max: 1,335

## File Re-reads

- redundant_read_count: 0

## Cache Priming (per tool, approximate)

Attribution: each tool's tool_result size weighted against the NEXT assistant turn's cache_create tokens. Numbers are directional, not precise — system-prompt drift and prior-turn re-injection inflate ratios.

- Agent: 5 calls, 4,750B results, ~23,056 cache_create tok (4.85×)
- Bash: 7 calls, 2,904B results, ~12,871 cache_create tok (4.43×)
- AskUserQuestion: 1 calls, 180B results, ~7,905 cache_create tok (43.92×)
- Write: 2 calls, 346B results, ~6,299 cache_create tok (18.21×)
- TaskList: 1 calls, 14B results, ~4,442 cache_create tok (317.29×)
- ToolSearch: 1 calls, 50B results, ~2,847 cache_create tok (56.94×)


## By Model (token detail)

### claude-opus-4-8 (priced as claude-opus-4)
- messages: 48
- usd: $20.9170
- input: 6,465
- cache_create_5m: 0
- cache_create_1h: 58,836
- cache_read: 10,212,771
- output: 49,810

