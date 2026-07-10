---
kind: cost-report
feature: FEAT-009
run_title: "FEAT009 SLICE09"
usd: 8.3383
duration_ms: 875143
total_tokens: 3303066
cache_hit_pct: 98.8
source_project: C--work-mega-plugins-common
aggregate_all: false
source_count: 1
created_at: 2026-07-08T22:58:01.713Z
---

# Cost Report: FEAT009 SLICE09

- Created: 2026-07-08T22:58:01.713Z
- Run Title: FEAT009 SLICE09
- Window Start: 2026-07-08T22:43:26.431Z
- Window End: 2026-07-08T22:58:01.574Z
- Duration: 14.6 min (875143 ms)
- Sessions Scanned: 1
- Assistant Messages Counted: 15
- Total Tokens: 3,303,066
- Cache Hit %: 98.8%
- Total USD: $8.3383
- Source Project: C--work-mega-plugins-common
- Auto-detected: no
- Aggregate All: no

## Tokens (totals)

- input: 240
- cache_create_5m: 0
- cache_create_1h: 37,761
- cache_read: 3,233,715
- output: 31,350

## Model Mix

- claude-opus-4-8 (priced as claude-opus-4): 15 msgs (100%), $8.3383 (100%)

## Conversation Shape

- user_msg_count: 0
- user_msg_avg_len: 0
- turns_before_first_tool: 2
- compaction_count: 0
- skill_invocations: 0
- subagent_dispatches: 3

## Tool Usage

- Agent: 3
- Bash: 2

## Tool Result Sizes (bytes)

- count: 5
- sum: 6,941
- p50: 1,304
- p90: 2,547
- max: 2,547

## File Re-reads

- redundant_read_count: 0

## Cache Priming (per tool, approximate)

Attribution: each tool's tool_result size weighted against the NEXT assistant turn's cache_create tokens. Numbers are directional, not precise — system-prompt drift and prior-turn re-injection inflate ratios.

- Agent: 3 calls, 6,273B results, ~28,458 cache_create tok (4.54×)
- Bash: 1 calls, 334B results, ~7,650 cache_create tok (22.9×)


## By Model (token detail)

### claude-opus-4-8 (priced as claude-opus-4)
- messages: 15
- usd: $8.3383
- input: 240
- cache_create_5m: 0
- cache_create_1h: 37,761
- cache_read: 3,233,715
- output: 31,350

