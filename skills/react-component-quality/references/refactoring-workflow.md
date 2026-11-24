# Refactoring Workflow

## Characterization-first Sequence

1. Inspect the project and run a read-only audit. Preserve unrelated dirty changes.
2. Select one bounded behavior and record current focused test/typecheck/gate outcomes.
3. Name the candidate's user capability, domain vocabulary, state/effects, independent change reason, public entry, allowed dependencies, and focused verification command.
4. Add characterization tests for existing behavior. For intended behavior change, add and observe the focused failing test first.
5. Extract pure decisions to a model; keep tests green.
6. Extract one subscription/async/effect lifecycle to a focused hook; prove cleanup and stale-response behavior.
7. Shrink Zustand/global subscriptions to stable focused selectors.
8. Extract presentation only where props form a cohesive contract; preserve accessibility, focus, IME, latency feedback, and cross-platform behavior.
9. Keep imports acyclic and directed toward stable contracts. Review inward barrel imports and coordinators spanning four or more sibling domains; do not mechanically fail them.
10. Run the verification ladder, rerun audit, and record evidence that the original finding closed without a new bypass.

Do not combine file moves, state redesign, UI restyling, and behavioral changes into one unreviewable step. Do not add a max-lines disable or baseline entry to make extraction pass.

## Completion Evidence

- before/after responsibility map and public contract;
- characterization/behavior test names and exact results;
- focused selector and effect cleanup/stale-response evidence;
- changed-code Oxlint, React Doctor, max-lines, and typecheck results;
- relevant full test/build result;
- visual/browser/Electron evidence for changed interaction;
- final audit with resolved and remaining findings separated.

Use the four source-backed boundary models in [feature-boundaries.md](feature-boundaries.md); links to the Orca files are in [Orca source inventory](orca-source-inventory.md).
