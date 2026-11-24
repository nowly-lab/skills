# Implementation Documentation Contract

Shared by the implementation skills (`planning-nowly`, `implementation-nowly`, `dmmf-implementation`). The product's domain model ([data-format.md](data-format.md)) is the only current documentation of the product's overall picture. This contract says who owns it and how it stays true; it does not authorize product implementation or replace product-specific approval, worktree or verification rules.

## Ownership

- The model belongs to the product repository, in its model directory (named by the project's own tips skill or AGENTS.md/CLAUDE.md when it has one; see SKILL.md: Where the model lives). The location of the skill does not decide ownership.
- Before changing it, name the product checkout or worktree, branch, inspected revision (`checked.revision` in each data file) and whether relevant uncommitted changes exist.
- Never keep two current models. A migration replaces the old documents in the same change. Copied template documents and old worktree paths are historical evidence, not another product's requirements.

## Evidence

- Evidence is `{ path, symbol?, role?, note? }` on the item it supports, with `path` relative to the product root. There is no path state field.
- Planning may name planned files. `check <model-dir> --repo <product-root>` must pass before the PR; it proves each path exists and each symbol appears in its file.
- When a file moves or a symbol is renamed, update the evidence in the same change. On later runs, start from the evidence of the items the request touches instead of a repository-wide search.
- Keep observed facts and inference apart. A rule the code does not show is a hotspot, not a sticky that claims behavior.

## When the model changes

- **Planning** updates the model to the planned shape, marks added or changed stickies and other items with `"changed": true` (after clearing the previous plan's marks in every data file), renders it and shows it with the plan.
- **Implementation** changes the model only when the implementation differs from the plan, after agreeing the difference with the person through the Plannotator Inbox. It then updates the data, renders, and runs `check --repo` before the PR.
- Decisions, rulings, verification results and Git delivery are recorded in the HTML plan and the owner record, not in the model.

## Refactoring belongs in the scoped plan

When a requested change exposes duplicate rules, mixed responsibilities or scattered ownership, put the smallest relevant refactor in the existing implementation plan before implementation. Record:

- current files and symbols with concrete evidence;
- intended responsibility and current-to-target path mapping, including create, edit, move and remove;
- affected callers and contracts, order and dependencies, preserved behavior and explicit non-goals;
- regression tests and unresolved decisions.

Multiple files alone do not justify consolidation. Record intentional boundaries or a justified `none`. Updating the model identifies candidates; it does not execute product refactors.

## Verify the model change

Run `render` and `check` (with `--repo` once the implementation exists). Check that changed stickies match the plan and that state diagrams and tables were regenerated from the same data. For documentation-only work, do not run live providers, migrations or deployments, and do not claim application tests passed.
