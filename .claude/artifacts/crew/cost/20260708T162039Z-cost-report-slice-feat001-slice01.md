---
kind: cost-report
feature: FEAT-001
run_title: "FEAT001 SLICE01"
usd: 13.2906
duration_ms: 969595
total_tokens: 5804944
cache_hit_pct: 98.9
source_project: C--work-mega-plugins-common
aggregate_all: false
source_count: 1
created_at: 2026-07-08T16:20:39.396Z
---

# Cost Report: FEAT001 SLICE01

- Created: 2026-07-08T16:20:39.396Z
- Run Title: FEAT001 SLICE01
- Window Start: 2026-07-08T16:04:29.738Z
- Window End: 2026-07-08T16:20:39.333Z
- Duration: 16.2 min (969595 ms)
- Sessions Scanned: 1
- Assistant Messages Counted: 33
- Total Tokens: 5,804,944
- Cache Hit %: 98.9%
- Total USD: $13.2906
- Source Project: C--work-mega-plugins-common
- Auto-detected: no
- Aggregate All: no

## Tokens (totals)

- input: 4,506
- cache_create_5m: 0
- cache_create_1h: 60,824
- cache_read: 5,701,670
- output: 37,944

## Model Mix

- claude-opus-4-8 (priced as claude-opus-4): 33 msgs (100%), $13.2906 (100%)

## Conversation Shape

- user_msg_count: 4
- user_msg_avg_len: 3050
- turns_before_first_tool: 2
- compaction_count: 1
- skill_invocations: 1
- subagent_dispatches: 4

## Tool Usage

- Bash: 5
- Agent: 4
- Skill: 1
- Write: 1

## Tool Result Sizes (bytes)

- count: 12
- sum: 14,910
- p50: 950
- p90: 1,649
- max: 6,699

## File Re-reads

- redundant_read_count: 0

## Cache Priming (per tool, approximate)

Attribution: each tool's tool_result size weighted against the NEXT assistant turn's cache_create tokens. Numbers are directional, not precise — system-prompt drift and prior-turn re-injection inflate ratios.

- Agent: 4 calls, 3,800B results, ~28,690 cache_create tok (7.55×)
- Bash: 5 calls, 4,150B results, ~14,062 cache_create tok (3.39×)
- Skill: 1 calls, 29B results, ~8,871 cache_create tok (305.9×)
- Write: 1 calls, 232B results, ~0 cache_create tok (0×)


## By Model (token detail)

### claude-opus-4-8 (priced as claude-opus-4)
- messages: 33
- usd: $13.2906
- input: 4,506
- cache_create_5m: 0
- cache_create_1h: 60,824
- cache_read: 5,701,670
- output: 37,944

