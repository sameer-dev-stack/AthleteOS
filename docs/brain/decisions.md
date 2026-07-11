# Brain — Engineering Decisions Log

Add a dated ADR-style entry for every non-trivial decision.

- **2026-07-09** — Created `docs/` as the agent brain (single source of truth). Root `AGENTS.md`
  demoted to a pointer; original project rules preserved in `docs/AGENTS.project.md`.
- **2026-07-09** — Adopted the **Centralized Orchestration** pattern: Hermes = Master, the 4
  coding agents = Workers, atomic actions = Tools. Briefing/Output file protocol.
- **2026-07-09** — Installed ponytail (lazy senior dev ladder) on Hermes + all 4 workers.
- **2026-07-09** — `opencode.json` stores MCP API keys in plaintext (security risk). Decision
  pending: move secrets to env / secret store before any production automation.
