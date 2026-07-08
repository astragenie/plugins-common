---
kind: cost-report
feature: FEAT-008
run_title: "FEAT008 SLICE06"
usd: 28.2933
duration_ms: 1084641
total_tokens: 10775796
cache_hit_pct: 98.5
source_project: C--work-mega-plugins-common
aggregate_all: false
source_count: 1
created_at: 2026-07-08T21:59:00.048Z
---

# Cost Report: FEAT008 SLICE06

- Created: 2026-07-08T21:59:00.048Z
- Run Title: FEAT008 SLICE06
- Window Start: 2026-07-08T21:40:55.312Z
- Window End: 2026-07-08T21:58:59.953Z
- Duration: 18.1 min (1084641 ms)
- Sessions Scanned: 1
- Assistant Messages Counted: 85
- Total Tokens: 10,775,796
- Cache Hit %: 98.5%
- Total USD: $28.2933
- Source Project: C--work-mega-plugins-common
- Auto-detected: no
- Aggregate All: no

## Tokens (totals)

- input: 8,281
- cache_create_5m: 0
- cache_create_1h: 151,706
- cache_read: 10,511,126
- output: 104,683

## Model Mix

- claude-opus-4-8 (priced as claude-opus-4): 85 msgs (100%), $28.2933 (100%)

## Conversation Shape

- user_msg_count: 1
- user_msg_avg_len: 3190
- turns_before_first_tool: 2
- compaction_count: 0
- skill_invocations: 0
- subagent_dispatches: 4

## Tool Usage

- Bash: 24 (1 failed)
- Agent: 4
- Edit: 3
- Read: 2
- Write: 2 (1 failed)
- TaskUpdate: 2

## Tool Result Sizes (bytes)

- count: 38
- sum: 42,834
- p50: 545
- p90: 3,425
- max: 8,310

## File Re-reads

- redundant_read_count: 0

## Cache Priming (per tool, approximate)

Attribution: each tool's tool_result size weighted against the NEXT assistant turn's cache_create tokens. Numbers are directional, not precise — system-prompt drift and prior-turn re-injection inflate ratios.

- Bash: 24 calls, 26,545B results, ~96,508 cache_create tok (3.64×)
- Agent: 4 calls, 6,804B results, ~25,695 cache_create tok (3.78×)
- Write: 2 calls, 301B results, ~7,645 cache_create tok (25.4×)
- Edit: 3 calls, 420B results, ~4,893 cache_create tok (11.65×)
- Read: 2 calls, 410B results, ~2,879 cache_create tok (7.02×)
- TaskUpdate: 2 calls, 44B results, ~2,527 cache_create tok (57.43×)


## By Model (token detail)

### claude-opus-4-8 (priced as claude-opus-4)
- messages: 85
- usd: $28.2933
- input: 8,281
- cache_create_5m: 0
- cache_create_1h: 151,706
- cache_read: 10,511,126
- output: 104,683

