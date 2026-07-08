---
kind: cost-report
feature: FEAT-005
run_title: "FEAT005 SLICE03"
usd: 199.9761
duration_ms: 1450298
total_tokens: 96381060
cache_hit_pct: 99.2
source_project: aggregate
aggregate_all: true
source_count: 5
created_at: 2026-07-08T17:07:34.397Z
---

# Cost Report: FEAT005 SLICE03

- Created: 2026-07-08T17:07:34.397Z
- Run Title: FEAT005 SLICE03
- Window Start: 2026-07-08T16:43:13.332Z
- Window End: 2026-07-08T17:07:23.630Z
- Duration: 24.2 min (1450298 ms)
- Sessions Scanned: 6
- Assistant Messages Counted: 404
- Total Tokens: 96,381,060
- Cache Hit %: 99.2%
- Total USD: $199.9761
- Source Project: aggregate
- Auto-detected: no
- Aggregate All: yes

## Sources (aggregated)

- C--work-mega-runner-plugin: 221 msgs, $90.3315
- C--work-mega-runner: 66 msgs, $49.3543
- C--work-mega-astramemory-local: 59 msgs, $29.9837
- C--work-mega-plugins-common: 36 msgs, $19.5264
- C--work-mega-memory: 22 msgs, $10.7804

## Tokens (totals)

- input: 79,760
- cache_create_5m: 0
- cache_create_1h: 668,196
- cache_read: 95,153,047
- output: 480,057

## Model Mix

- claude-opus-4-8 (priced as claude-opus-4): 404 msgs (100%), $199.9761 (100%)

## Conversation Shape

- user_msg_count: 29
- user_msg_avg_len: 1918
- turns_before_first_tool: 2
- compaction_count: 1
- skill_invocations: 0
- subagent_dispatches: 13

## Tool Usage

- Bash: 80 (2 failed)
- Edit: 22 (1 failed)
- Agent: 13 (1 failed)
- Read: 12
- Write: 9 (1 failed)
- Grep: 7
- AskUserQuestion: 2 (2 failed)
- PowerShell: 1
- ToolSearch: 1
- TaskStop: 1

## Tool Result Sizes (bytes)

- count: 149
- sum: 137,325
- p50: 348
- p90: 2,287
- max: 6,870

## File Re-reads

- redundant_read_count: 1
- top paths:
  - 2× C:\Users\serge\.claude\projects\C--work-mega-runner-plugin\memory\MEMORY.md

## Cache Priming (per tool, approximate)

Attribution: each tool's tool_result size weighted against the NEXT assistant turn's cache_create tokens. Numbers are directional, not precise — system-prompt drift and prior-turn re-injection inflate ratios.

- Bash: 78 calls, 61,341B results, ~350,491 cache_create tok (5.71×)
- Agent: 12 calls, 13,391B results, ~113,147 cache_create tok (8.45×)
- Read: 12 calls, 31,246B results, ~54,537 cache_create tok (1.75×)
- Edit: 22 calls, 4,167B results, ~49,205 cache_create tok (11.81×)
- Grep: 7 calls, 15,375B results, ~43,282 cache_create tok (2.82×)
- Write: 9 calls, 1,728B results, ~23,455 cache_create tok (13.57×)
- AskUserQuestion: 2 calls, 1,369B results, ~14,650 cache_create tok (10.7×)
- PowerShell: 1 calls, 58B results, ~10,746 cache_create tok (185.28×)
- TaskStop: 1 calls, 2,053B results, ~3,480 cache_create tok (1.7×)
- ToolSearch: 1 calls, 50B results, ~1,117 cache_create tok (22.34×)


## By Model (token detail)

### claude-opus-4-8 (priced as claude-opus-4)
- messages: 404
- usd: $199.9761
- input: 79,760
- cache_create_5m: 0
- cache_create_1h: 668,196
- cache_read: 95,153,047
- output: 480,057

