---
kind: cost-report
feature: FEAT-007
run_title: "FEAT007 SLICE05"
usd: 88.6993
duration_ms: 1159910
total_tokens: 40747024
cache_hit_pct: 98.5
source_project: aggregate
aggregate_all: true
source_count: 4
created_at: 2026-07-08T17:45:15.652Z
---

# Cost Report: FEAT007 SLICE05

- Created: 2026-07-08T17:45:15.652Z
- Run Title: FEAT007 SLICE05
- Window Start: 2026-07-08T17:25:41.860Z
- Window End: 2026-07-08T17:45:01.770Z
- Duration: 19.3 min (1159910 ms)
- Sessions Scanned: 4
- Assistant Messages Counted: 118
- Total Tokens: 40,747,024
- Cache Hit %: 98.5%
- Total USD: $88.6993
- Source Project: aggregate
- Auto-detected: no
- Aggregate All: yes

## Sources (aggregated)

- C--work-mega-runner: 48 msgs, $49.4417
- C--work-mega-plugins-common: 30 msgs, $18.5993
- C--work-mega-memory: 17 msgs, $11.1141
- C--work-mega-runner-plugin: 23 msgs, $9.5442

## Tokens (totals)

- input: 18,755
- cache_create_5m: 0
- cache_create_1h: 589,039
- cache_read: 39,995,857
- output: 143,373

## Model Mix

- claude-opus-4-8 (priced as claude-opus-4): 118 msgs (100%), $88.6993 (100%)

## Conversation Shape

- user_msg_count: 9
- user_msg_avg_len: 2184
- turns_before_first_tool: 2
- compaction_count: 0
- skill_invocations: 0
- subagent_dispatches: 8

## Tool Usage

- Bash: 29
- Agent: 8
- Write: 2
- ToolSearch: 1
- SendMessage: 1
- Edit: 1

## Tool Result Sizes (bytes)

- count: 45
- sum: 27,691
- p50: 347
- p90: 1,304
- max: 2,199

## File Re-reads

- redundant_read_count: 0

## Cache Priming (per tool, approximate)

Attribution: each tool's tool_result size weighted against the NEXT assistant turn's cache_create tokens. Numbers are directional, not precise — system-prompt drift and prior-turn re-injection inflate ratios.

- ToolSearch: 1 calls, 53B results, ~384,720 cache_create tok (7258.87×)
- Bash: 28 calls, 15,656B results, ~112,919 cache_create tok (7.21×)
- Agent: 8 calls, 7,576B results, ~63,447 cache_create tok (8.37×)
- Write: 2 calls, 407B results, ~22,458 cache_create tok (55.18×)
- SendMessage: 1 calls, 411B results, ~1,575 cache_create tok (3.83×)
- Edit: 1 calls, 234B results, ~542 cache_create tok (2.32×)


## By Model (token detail)

### claude-opus-4-8 (priced as claude-opus-4)
- messages: 118
- usd: $88.6993
- input: 18,755
- cache_create_5m: 0
- cache_create_1h: 589,039
- cache_read: 39,995,857
- output: 143,373

