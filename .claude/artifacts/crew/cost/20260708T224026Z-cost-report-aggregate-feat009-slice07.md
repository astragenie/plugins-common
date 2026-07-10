---
kind: cost-report
feature: FEAT-009
run_title: "FEAT009 SLICE07"
usd: 242.1164
duration_ms: 1956404
total_tokens: 124182545
cache_hit_pct: 99.5
source_project: aggregate
aggregate_all: true
source_count: 4
created_at: 2026-07-08T22:40:26.898Z
---

# Cost Report: FEAT009 SLICE07

- Created: 2026-07-08T22:40:26.898Z
- Run Title: FEAT009 SLICE07
- Window Start: 2026-07-08T22:07:33.999Z
- Window End: 2026-07-08T22:40:10.403Z
- Duration: 32.6 min (1956404 ms)
- Sessions Scanned: 4
- Assistant Messages Counted: 353
- Total Tokens: 124,182,545
- Cache Hit %: 99.5%
- Total USD: $242.1164
- Source Project: aggregate
- Auto-detected: no
- Aggregate All: yes

## Sources (aggregated)

- C--work-mega-memory: 125 msgs, $126.2467
- C--work-mega-runner: 120 msgs, $73.1950
- C--work-mega-astramemory-local: 64 msgs, $23.1655
- C--work-mega-plugins-common: 44 msgs, $19.5092

## Tokens (totals)

- input: 24,764
- cache_create_5m: 0
- cache_create_1h: 649,704
- cache_read: 123,004,789
- output: 503,288

## Model Mix

- claude-opus-4-8 (priced as claude-opus-4): 353 msgs (100%), $242.1164 (100%)

## Conversation Shape

- user_msg_count: 13
- user_msg_avg_len: 1408
- turns_before_first_tool: 2
- compaction_count: 1
- skill_invocations: 0
- subagent_dispatches: 10

## Tool Usage

- Bash: 81 (3 failed)
- Edit: 21
- Agent: 10
- Read: 9
- Write: 7
- mcp__plugin_astramem_astramem__remember: 1
- Grep: 1
- AskUserQuestion: 1

## Tool Result Sizes (bytes)

- count: 132
- sum: 98,376
- p50: 336
- p90: 1,902
- max: 5,909

## File Re-reads

- redundant_read_count: 2
- top paths:
  - 2× C:\work\mega\mem-702\src\AstraMemory.Api\Program.cs
  - 2× C:\work\mega\runner\src\cli\astrarunner-cli\src\lib\api.ts

## Cache Priming (per tool, approximate)

Attribution: each tool's tool_result size weighted against the NEXT assistant turn's cache_create tokens. Numbers are directional, not precise — system-prompt drift and prior-turn re-injection inflate ratios.

- Bash: 80 calls, 59,474B results, ~420,338 cache_create tok (7.07×)
- Agent: 10 calls, 16,138B results, ~101,644 cache_create tok (6.3×)
- Edit: 21 calls, 3,758B results, ~50,858 cache_create tok (13.53×)
- Read: 9 calls, 13,103B results, ~48,439 cache_create tok (3.7×)
- Write: 7 calls, 1,352B results, ~20,216 cache_create tok (14.95×)
- Grep: 1 calls, 790B results, ~5,254 cache_create tok (6.65×)
- AskUserQuestion: 1 calls, 261B results, ~2,384 cache_create tok (9.13×)
- mcp__plugin_astramem_astramem__remember: 1 calls, 88B results, ~550 cache_create tok (6.25×)


## By Model (token detail)

### claude-opus-4-8 (priced as claude-opus-4)
- messages: 353
- usd: $242.1164
- input: 24,764
- cache_create_5m: 0
- cache_create_1h: 649,704
- cache_read: 123,004,789
- output: 503,288

