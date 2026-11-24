---
name: react-component-quality
description: Use when setting up React component quality checks, auditing component architecture, scaffolding components, or refactoring large React components in a local project using patterns derived from the open-source Orca app (stablyai/orca).
---

# React Component Quality

## Overview

Use source-traceable patterns derived from [Orca](https://github.com/stablyai/orca) (MIT; see [NOTICE](NOTICE)) without replacing target-owned configuration or changing behavior accidentally. Inspect, dry-run, review, apply explicitly, then verify explicitly.

Set `SKILL_ROOT` to this skill's folder (the folder holding this `SKILL.md`, wherever the skill is installed) and `TARGET` to the target project:

```bash
SKILL_ROOT=/absolute/path/to/skills/react-component-quality
TARGET=/absolute/path/to/project
```

## Route the Work

| Request | Load | Required flow |
| --- | --- | --- |
| Inspect or setup | `quality-gates.md`, then `orca-source-inventory.md` | inspect -> setup dry-run -> review conflicts/diff -> `--apply` -> separate `--verify` |
| Audit | `quality-gates.md`, plus the reference matching each finding | read-only audit; add `--run-tools` only for already-installed target-local tools |
| Scaffold | `architecture.md`, `feature-boundaries.md`, `testing.md` | choose owner/boundary -> dry-run -> inspect file list -> `--apply` -> focused test |
| Refactor | `refactoring-workflow.md`, architecture/state/testing; add UI for interaction changes | characterize -> extract one responsibility -> changed-code gates -> risk-based visual/E2E |

Read [feature-boundaries.md](references/feature-boundaries.md) before creating or moving a feature folder. Read [ui-accessibility.md](references/ui-accessibility.md) for any visible or interactive change.

## Quick Commands

| Purpose | Command |
| --- | --- |
| Inspect | `node "$SKILL_ROOT/scripts/inspect-project.mjs" --project "$TARGET" --format markdown` |
| Setup dry-run | `node "$SKILL_ROOT/scripts/setup-react-quality.mjs" --project "$TARGET" --format markdown` |
| Apply reviewed setup | `node "$SKILL_ROOT/scripts/setup-react-quality.mjs" --project "$TARGET" --apply --format markdown` |
| Verify installation | `node "$SKILL_ROOT/scripts/setup-react-quality.mjs" --project "$TARGET" --verify --format markdown` |
| Audit, no tools | `node "$SKILL_ROOT/scripts/audit-react-quality.mjs" --project "$TARGET" --format markdown` |
| Audit installed tools | `node "$SKILL_ROOT/scripts/audit-react-quality.mjs" --project "$TARGET" --base HEAD~1 --run-tools --format markdown` |
| Scaffold dry-run | `node "$SKILL_ROOT/scripts/scaffold-component.mjs" --project "$TARGET" --target src/features/example/ExampleCard` |

Scaffold uses the same dry-run/`--apply` split; add `--with-hook`/`--with-model` only for distinct behavior. Setup `--apply` is unverified until separate `--verify` succeeds. **Setup `--verify` may contact a registry or populate a cache** because its pinned React Doctor gate uses `npx --yes`, `pnpm dlx`, `yarn dlx`, or `bunx`. Audit `--run-tools` never installs: it executes verified target-local tools and reports React Doctor as a manual command.

## Refactor Contract

Characterize behavior before production edits. Every proposed boundary names its public entry, owned state/effects, allowed dependencies, and focused verification. Extract model, lifecycle hook, then presentation; keep each step green and verify proportional to risk.

## Common Mistakes

| Mistake or rationale | Correction |
| --- | --- |
| “Copy Orca's root config.” | Inspect first; setup adapts portable assets and refuses conflicts. |
| “Policy means CI enforces it.” | Separate `AGENTS.md` from package/config/CI evidence. |
| “A long file means a new feature.” | Use the three-signal contract; length is only a review trigger. |
| “Apply succeeded, so setup is done.” | Run `--verify`; a failed gate now exits nonzero. |
| “Add a max-lines exception.” | Split responsibility; `--prune` only removes grandfathered entries. |
