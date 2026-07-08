---
feature: FEAT-009
status: active
---
# Run Brief: FEAT009 SLICE09: Consumer reader helper + self-registry dogfood inside plugins-common

- Created: 2026-07-08T22:43:26.428Z
- Tier: full
- Goal: Shared cross-plugin agent/skill name registry in plugins-common. Today each plugin (crew, runner, ...) hand-maintains its own idea of which agent/skill names exist — runner's validate-agent-refs.mts carries a frozen local allowlist Set. When crew renames an agent (inspector->reviewer per runner FEAT-240; builder->*-dev per #371), nothing propagates to consumers: runner keeps emitting the phantom name and its CI gate stays SILENT because the stale name is still allowlisted. Root-cause fix: a gene
- Mode: autonomous
- Pace: unattended
- Owner: loop
- Status: active
- Summary: -
- Scope:
  - - bullet 1
- bullet 2
- Out Of Scope:
  - - bullet 1
- Planned Files: -
- Next Step: Begin implementation

