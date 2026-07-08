---
kind: cost-report
feature: FEAT-007
run_title: "FEAT007 SLICE05"
usd: 17.4795
duration_ms: 1159784
total_tokens: 8884675
cache_hit_pct: 99.3
source_project: C--work-mega-plugins-common
aggregate_all: false
source_count: 1
created_at: 2026-07-08T17:45:01.734Z
---

# Cost Report: FEAT007 SLICE05

- Created: 2026-07-08T17:45:01.734Z
- Run Title: FEAT007 SLICE05
- Window Start: 2026-07-08T17:25:41.860Z
- Window End: 2026-07-08T17:45:01.644Z
- Duration: 19.3 min (1159784 ms)
- Sessions Scanned: 1
- Assistant Messages Counted: 28
- Total Tokens: 8,884,675
- Cache Hit %: 99.3%
- Total USD: $17.4795
- Source Project: C--work-mega-plugins-common
- Auto-detected: no
- Aggregate All: no

## Tokens (totals)

- input: 7,124
- cache_create_5m: 0
- cache_create_1h: 53,267
- cache_read: 8,789,750
- output: 34,534

## Model Mix

- claude-opus-4-8 (priced as claude-opus-4): 28 msgs (100%), $17.4795 (100%)

## Conversation Shape

- user_msg_count: 5
- user_msg_avg_len: 2871
- turns_before_first_tool: 2
- compaction_count: 0
- skill_invocations: 0
- subagent_dispatches: 5

## Tool Usage

- Agent: 5
- Bash: 3

## Tool Result Sizes (bytes)

- count: 9
- sum: 7,475
- p50: 950
- p90: 1,304
- max: 1,304

## File Re-reads

- redundant_read_count: 0

## Cache Priming (per tool, approximate)

Attribution: each tool's tool_result size weighted against the NEXT assistant turn's cache_create tokens. Numbers are directional, not precise — system-prompt drift and prior-turn re-injection inflate ratios.

- Agent: 5 calls, 4,750B results, ~36,375 cache_create tok (7.66×)
- Bash: 3 calls, 2,540B results, ~15,008 cache_create tok (5.91×)


## By Model (token detail)

### claude-opus-4-8 (priced as claude-opus-4)
- messages: 28
- usd: $17.4795
- input: 7,124
- cache_create_5m: 0
- cache_create_1h: 53,267
- cache_read: 8,789,750
- output: 34,534

