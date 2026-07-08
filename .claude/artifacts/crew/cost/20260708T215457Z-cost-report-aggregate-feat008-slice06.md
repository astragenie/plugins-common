---
kind: cost-report
feature: FEAT-008
run_title: "FEAT008 SLICE06"
usd: 139.3701
duration_ms: 825528
total_tokens: 52219655
cache_hit_pct: 97.5
source_project: aggregate
aggregate_all: true
source_count: 4
created_at: 2026-07-08T21:54:57.448Z
---

# Cost Report: FEAT008 SLICE06

- Created: 2026-07-08T21:54:57.448Z
- Run Title: FEAT008 SLICE06
- Window Start: 2026-07-08T21:40:55.312Z
- Window End: 2026-07-08T21:54:40.840Z
- Duration: 13.8 min (825528 ms)
- Sessions Scanned: 4
- Assistant Messages Counted: 252
- Total Tokens: 52,219,655
- Cache Hit %: 97.5%
- Total USD: $139.3701
- Source Project: aggregate
- Auto-detected: no
- Aggregate All: yes

## Sources (aggregated)

- C--work-mega-runner: 87 msgs, $57.6103
- C--work-mega-memory: 56 msgs, $49.7671
- C--work-mega-plugins-common: 64 msgs, $20.9789
- C--work-mega-astramemory-local: 45 msgs, $11.0138

## Tokens (totals)

- input: 14,911
- cache_create_5m: 0
- cache_create_1h: 1,270,008
- cache_read: 50,599,442
- output: 335,294

## Model Mix

- claude-opus-4-8 (priced as claude-opus-4): 252 msgs (100%), $139.3701 (100%)

## Conversation Shape

- user_msg_count: 8
- user_msg_avg_len: 884
- turns_before_first_tool: 2
- compaction_count: 0
- skill_invocations: 0
- subagent_dispatches: 2

## Tool Usage

- Bash: 55 (1 failed)
- Read: 22
- Edit: 12
- Grep: 4
- Agent: 2
- AskUserQuestion: 1
- Write: 1
- ToolSearch: 1
- mcp__plugin_azure_azure__group_list: 1

## Tool Result Sizes (bytes)

- count: 99
- sum: 181,381
- p50: 700
- p90: 6,403
- max: 16,858

## File Re-reads

- redundant_read_count: 1
- top paths:
  - 2× C:\work\mega\memory\src\AstraMemory.Infrastructure\Jobs\ImprovementBackgroundService.cs

## Cache Priming (per tool, approximate)

Attribution: each tool's tool_result size weighted against the NEXT assistant turn's cache_create tokens. Numbers are directional, not precise — system-prompt drift and prior-turn re-injection inflate ratios.

- ToolSearch: 1 calls, 229B results, ~542,058 cache_create tok (2367.07×)
- Bash: 54 calls, 61,233B results, ~277,078 cache_create tok (4.52×)
- Grep: 4 calls, 10,478B results, ~211,043 cache_create tok (20.14×)
- Read: 22 calls, 92,328B results, ~171,899 cache_create tok (1.86×)
- Agent: 2 calls, 5,009B results, ~18,773 cache_create tok (3.75×)
- mcp__plugin_azure_azure__group_list: 1 calls, 1,486B results, ~16,353 cache_create tok (11×)
- Edit: 12 calls, 1,979B results, ~16,136 cache_create tok (8.15×)
- AskUserQuestion: 1 calls, 180B results, ~10,179 cache_create tok (56.55×)
- Write: 1 calls, 149B results, ~6,423 cache_create tok (43.11×)


## By Model (token detail)

### claude-opus-4-8 (priced as claude-opus-4)
- messages: 252
- usd: $139.3701
- input: 14,911
- cache_create_5m: 0
- cache_create_1h: 1,270,008
- cache_read: 50,599,442
- output: 335,294

