---
kind: cost-report
feature: FEAT-001
run_title: "FEAT001 SLICE01"
usd: 31.1444
duration_ms: 969672
total_tokens: 13327788
cache_hit_pct: 99
source_project: aggregate
aggregate_all: true
source_count: 4
created_at: 2026-07-08T16:20:55.586Z
---

# Cost Report: FEAT001 SLICE01

- Created: 2026-07-08T16:20:55.586Z
- Run Title: FEAT001 SLICE01
- Window Start: 2026-07-08T16:04:29.738Z
- Window End: 2026-07-08T16:20:39.410Z
- Duration: 16.2 min (969672 ms)
- Sessions Scanned: 4
- Assistant Messages Counted: 69
- Total Tokens: 13,327,788
- Cache Hit %: 99%
- Total USD: $31.1444
- Source Project: aggregate
- Auto-detected: no
- Aggregate All: yes

## Sources (aggregated)

- C--work-mega-plugins-common: 34 msgs, $13.6399
- C--work-mega-astramemory-local: 19 msgs, $7.2872
- C--work-mega-runner: 10 msgs, $7.2797
- C--work-mega-memory: 6 msgs, $2.9376

## Tokens (totals)

- input: 6,582
- cache_create_5m: 0
- cache_create_1h: 120,128
- cache_read: 13,097,129
- output: 103,949

## Model Mix

- claude-opus-4-8 (priced as claude-opus-4): 69 msgs (100%), $31.1444 (100%)

## Conversation Shape

- user_msg_count: 7
- user_msg_avg_len: 1784
- turns_before_first_tool: 2
- compaction_count: 1
- skill_invocations: 1
- subagent_dispatches: 7

## Tool Usage

- Bash: 17
- Agent: 7
- Skill: 1
- Write: 1

## Tool Result Sizes (bytes)

- count: 26
- sum: 26,688
- p50: 942
- p90: 1,649
- max: 6,699

## File Re-reads

- redundant_read_count: 0

## Cache Priming (per tool, approximate)

Attribution: each tool's tool_result size weighted against the NEXT assistant turn's cache_create tokens. Numbers are directional, not precise — system-prompt drift and prior-turn re-injection inflate ratios.

- Agent: 7 calls, 6,626B results, ~59,766 cache_create tok (9.02×)
- Bash: 16 calls, 13,102B results, ~49,738 cache_create tok (3.8×)
- Skill: 1 calls, 29B results, ~8,871 cache_create tok (305.9×)
- Write: 1 calls, 232B results, ~1,696 cache_create tok (7.31×)


## By Model (token detail)

### claude-opus-4-8 (priced as claude-opus-4)
- messages: 69
- usd: $31.1444
- input: 6,582
- cache_create_5m: 0
- cache_create_1h: 120,128
- cache_read: 13,097,129
- output: 103,949

