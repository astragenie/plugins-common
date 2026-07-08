---
kind: cost-report
feature: FEAT-009
run_title: "FEAT009 SLICE09"
usd: 137.2836
duration_ms: 919271
total_tokens: 66507244
cache_hit_pct: 99.3
source_project: aggregate
aggregate_all: true
source_count: 4
created_at: 2026-07-08T22:58:57.980Z
---

# Cost Report: FEAT009 SLICE09

- Created: 2026-07-08T22:58:57.980Z
- Run Title: FEAT009 SLICE09
- Window Start: 2026-07-08T22:43:26.431Z
- Window End: 2026-07-08T22:58:45.702Z
- Duration: 15.3 min (919271 ms)
- Sessions Scanned: 4
- Assistant Messages Counted: 157
- Total Tokens: 66,507,244
- Cache Hit %: 99.3%
- Total USD: $137.2836
- Source Project: aggregate
- Auto-detected: no
- Aggregate All: yes

## Sources (aggregated)

- C--work-mega-memory: 65 msgs, $72.3528
- C--work-mega-astramemory-local: 39 msgs, $28.5210
- C--work-mega-runner: 34 msgs, $26.3102
- C--work-mega-plugins-common: 19 msgs, $10.0995

## Tokens (totals)

- input: 19,135
- cache_create_5m: 0
- cache_create_1h: 438,883
- cache_read: 65,712,407
- output: 336,819

## Model Mix

- claude-opus-4-8 (priced as claude-opus-4): 157 msgs (100%), $137.2836 (100%)

## Conversation Shape

- user_msg_count: 9
- user_msg_avg_len: 979
- turns_before_first_tool: 2
- compaction_count: 0
- skill_invocations: 0
- subagent_dispatches: 13

## Tool Usage

- Bash: 32
- Agent: 13 (3 failed)
- Read: 5
- Write: 2
- Edit: 2
- AskUserQuestion: 1

## Tool Result Sizes (bytes)

- count: 55
- sum: 105,857
- p50: 762
- p90: 2,547
- max: 52,741

## File Re-reads

- redundant_read_count: 0

## Cache Priming (per tool, approximate)

Attribution: each tool's tool_result size weighted against the NEXT assistant turn's cache_create tokens. Numbers are directional, not precise — system-prompt drift and prior-turn re-injection inflate ratios.

- Bash: 31 calls, 24,017B results, ~182,276 cache_create tok (7.59×)
- Agent: 13 calls, 17,545B results, ~145,104 cache_create tok (8.27×)
- Read: 5 calls, 62,814B results, ~63,239 cache_create tok (1.01×)
- Edit: 2 calls, 356B results, ~15,063 cache_create tok (42.31×)
- Write: 2 calls, 382B results, ~13,569 cache_create tok (35.52×)
- AskUserQuestion: 1 calls, 409B results, ~12,894 cache_create tok (31.53×)


## By Model (token detail)

### claude-opus-4-8 (priced as claude-opus-4)
- messages: 157
- usd: $137.2836
- input: 19,135
- cache_create_5m: 0
- cache_create_1h: 438,883
- cache_read: 65,712,407
- output: 336,819

