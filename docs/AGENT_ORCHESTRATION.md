# Athlete OS — Centralized Orchestration Contract

## Pattern: Centralized Orchestration
```
Task → Master (Hermes / @agent) → Workers (4 agents / @agent) → Tools (@Tool)
```

- **Master (Hermes):** coordinates the task, writes the frozen BRIEFING, interprets worker
  responses, reassigns or reconfigures on failure. The single decision-maker.
- **Worker (one of 4 agents):** executes its subtask, selects and uses tools as needed.
  Reports results via `## OUTPUT`. Does not orchestrate other workers.
- **Tool (@Tool):** atomic unit of work — file read/write, shell, web, MCP, typecheck.

## Dispatch format
Master writes a frozen `## BRIEFING` section in a **per-agent file**. The worker appends a
`## OUTPUT` section to that same file.

A BRIEFING contains:
- **exclusive files** owned by this task (no other task may touch them)
- **declared non-overlap** with other in-flight tasks
- the **task** description / acceptance criteria
- a **verify-once** instruction (typecheck only)

## Worker rules
- Exclusive file ownership per task; declare non-overlap; never cross files.
- If a fix needs an out-of-scope file → **STOP, report to Master.** Do not edit.
- Verify with typecheck only; no lint/build spam during generation.
- Monitor mode after completion: watch-only, no idle loops.

## Monitor mode
After a task is done, the worker enters watch-only monitoring — it observes but does not
start idle loops or new work unless Master dispatches a new BRIEFING.

## Brain
docs/ is the single source of truth. Full agent contract: `docs/AGENTS.md`.
Project intelligence: `docs/brain/*`.
