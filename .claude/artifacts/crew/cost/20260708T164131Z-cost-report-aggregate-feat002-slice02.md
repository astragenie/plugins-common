---
kind: cost-report
feature: FEAT-002
run_title: "FEAT002 SLICE02"
usd: 150.843
duration_ms: 1073575
total_tokens: 60601764
cache_hit_pct: 98
source_project: aggregate
aggregate_all: true
source_count: 5
created_at: 2026-07-08T16:41:31.614Z
---

# Cost Report: FEAT002 SLICE02

- Created: 2026-07-08T16:41:31.614Z
- Run Title: FEAT002 SLICE02
- Window Start: 2026-07-08T16:23:26.823Z
- Window End: 2026-07-08T16:41:20.398Z
- Duration: 17.9 min (1073575 ms)
- Sessions Scanned: 6
- Assistant Messages Counted: 308
- Total Tokens: 60,601,764
- Cache Hit %: 98%
- Total USD: $150.8430
- Source Project: aggregate
- Auto-detected: no
- Aggregate All: yes

## Sources (aggregated)

- C--work-mega-runner-plugin: 129 msgs, $56.0234
- C--work-mega-runner: 66 msgs, $43.2498
- C--work-mega-plugins-common: 51 msgs, $22.1078
- C--work-mega-astramemory-local: 34 msgs, $16.6165
- C--work-mega-memory: 28 msgs, $12.8455

## Tokens (totals)

- input: 244,579
- cache_create_5m: 0
- cache_create_1h: 960,796
- cache_read: 58,998,350
- output: 398,039

## Model Mix

- claude-opus-4-8 (priced as claude-opus-4): 308 msgs (100%), $150.8430 (100%)

## Conversation Shape

- user_msg_count: 16
- user_msg_avg_len: 1036
- turns_before_first_tool: 2
- compaction_count: 1
- skill_invocations: 0
- subagent_dispatches: 7

## Tool Usage

- Bash: 55 (4 failed)
- Read: 24
- Grep: 13
- Edit: 10
- Agent: 7
- Write: 7
- Glob: 2
- AskUserQuestion: 1
- ToolSearch: 1
- TaskList: 1

## Tool Result Sizes (bytes)

- count: 118
- sum: 248,872
- p50: 426
- p90: 7,456
- max: 27,495

## File Re-reads

- redundant_read_count: 1
- top paths:
  - 2× C:\work\mega\runner-plugin\src\scripts\lib\slice-linker\close-slice.mts

## Cache Priming (per tool, approximate)

Attribution: each tool's tool_result size weighted against the NEXT assistant turn's cache_create tokens. Numbers are directional, not precise — system-prompt drift and prior-turn re-injection inflate ratios.

- Read: 24 calls, 150,492B results, ~307,062 cache_create tok (2.04×)
- Bash: 53 calls, 47,337B results, ~279,387 cache_create tok (5.9×)
- Grep: 13 calls, 42,566B results, ~117,539 cache_create tok (2.76×)
- Glob: 2 calls, 65B results, ~73,220 cache_create tok (1126.46×)
- Agent: 5 calls, 4,750B results, ~70,843 cache_create tok (14.91×)
- Edit: 10 calls, 1,792B results, ~52,891 cache_create tok (29.52×)
- Write: 7 calls, 1,347B results, ~44,477 cache_create tok (33.02×)
- AskUserQuestion: 1 calls, 180B results, ~7,905 cache_create tok (43.92×)
- TaskList: 1 calls, 14B results, ~4,442 cache_create tok (317.29×)
- ToolSearch: 1 calls, 50B results, ~2,847 cache_create tok (56.94×)


## By Model (token detail)

### claude-opus-4-8 (priced as claude-opus-4)
- messages: 308
- usd: $150.8430
- input: 244,579
- cache_create_5m: 0
- cache_create_1h: 960,796
- cache_read: 58,998,350
- output: 398,039

