# Brain — Mistakes To Avoid

- Do NOT edit files outside your declared exclusive ownership. STOP and report to Master.
- Do NOT hardcode or commit secrets. `opencode.json` currently stores MCP keys in plaintext —
  this must be moved to env / a secret store.
- Do NOT run lint/build spam during generation; verify with typecheck once.
- Do NOT duplicate `docs/` logic elsewhere.
- Do NOT start with a marketplace before athlete supply exists.
- Do NOT push broken builds (lint + build must pass first).
- Do NOT assume another agent's transport works — AntiGravity IDE/App have no verified
  programmatic API yet; treat as serial / human-gated.
