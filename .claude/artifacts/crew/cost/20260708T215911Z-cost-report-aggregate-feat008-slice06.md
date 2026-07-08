---
kind: cost-report
feature: FEAT-008
run_title: "FEAT008 SLICE06"
usd: 171.448
duration_ms: 1084741
total_tokens: 67098747
cache_hit_pct: 97.9
source_project: aggregate
aggregate_all: true
source_count: 4
created_at: 2026-07-08T21:59:11.201Z
---

# Cost Report: FEAT008 SLICE06

- Created: 2026-07-08T21:59:11.201Z
- Run Title: FEAT008 SLICE06
- Window Start: 2026-07-08T21:40:55.312Z
- Window End: 2026-07-08T21:59:00.053Z
- Duration: 18.1 min (1084741 ms)
- Sessions Scanned: 4
- Assistant Messages Counted: 327
- Total Tokens: 67,098,747
- Cache Hit %: 97.9%
- Total USD: $171.4480
- Source Project: aggregate
- Auto-detected: no
- Aggregate All: yes

## Sources (aggregated)

- C--work-mega-runner: 98 msgs, $63.6367
- C--work-mega-memory: 68 msgs, $60.6828
- C--work-mega-plugins-common: 88 msgs, $29.5154
- C--work-mega-astramemory-local: 73 msgs, $17.6131

## Tokens (totals)

- input: 20,432
- cache_create_5m: 0
- cache_create_1h: 1,382,203
- cache_read: 65,272,557
- output: 423,555

## Model Mix

- claude-opus-4-8 (priced as claude-opus-4): 327 msgs (100%), $171.4480 (100%)

## Conversation Shape

- user_msg_count: 12
- user_msg_avg_len: 830
- turns_before_first_tool: 2
- compaction_count: 1
- skill_invocations: 0
- subagent_dispatches: 6

## Tool Usage

- Bash: 72 (1 failed)
- Read: 23
- Edit: 12
- Grep: 8
- Agent: 6
- Write: 3 (1 failed)
- TaskUpdate: 2
- AskUserQuestion: 1
- ToolSearch: 1
- mcp__plugin_azure_azure__group_list: 1

## Tool Result Sizes (bytes)

- count: 129
- sum: 199,566
- p50: 568
- p90: 4,059
- max: 16,858

## File Re-reads

- redundant_read_count: 1
- top paths:
  - 2× C:\work\mega\memory\src\AstraMemory.Infrastructure\Jobs\ImprovementBackgroundService.cs

## Cache Priming (per tool, approximate)

Attribution: each tool's tool_result size weighted against the NEXT assistant turn's cache_create tokens. Numbers are directional, not precise — system-prompt drift and prior-turn re-injection inflate ratios.

- ToolSearch: 1 calls, 229B results, ~542,058 cache_create tok (2367.07×)
- Bash: 71 calls, 73,946B results, ~341,573 cache_create tok (4.62×)
- Grep: 8 calls, 11,849B results, ~226,245 cache_create tok (19.09×)
- Read: 23 calls, 92,405B results, ~169,544 cache_create tok (1.83×)
- Agent: 6 calls, 8,688B results, ~43,454 cache_create tok (5×)
- mcp__plugin_azure_azure__group_list: 1 calls, 1,486B results, ~16,353 cache_create tok (11×)
- Edit: 12 calls, 1,979B results, ~16,136 cache_create tok (8.15×)
- Write: 3 calls, 450B results, ~14,068 cache_create tok (31.26×)
- AskUserQuestion: 1 calls, 180B results, ~10,179 cache_create tok (56.55×)
- TaskUpdate: 2 calls, 44B results, ~2,527 cache_create tok (57.43×)


## By Model (token detail)

### claude-opus-4-8 (priced as claude-opus-4)
- messages: 327
- usd: $171.4480
- input: 20,432
- cache_create_5m: 0
- cache_create_1h: 1,382,203
- cache_read: 65,272,557
- output: 423,555

