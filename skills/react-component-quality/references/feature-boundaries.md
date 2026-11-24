# Feature Boundaries

## Decision Contract

Create a feature boundary when at least three strong signals align and one is user capability or independent change reason.

Keep a unit inside its feature when it only implements one owner's lifecycle.

Promote code to cross-feature shared only after multiple real consumers require a stable domain-neutral contract.

For every proposed split, name:

- public entry point;
- owned state and effects;
- allowed dependencies and import direction;
- focused verification command.

## Eight Decision Axes

| Axis | Strong signal | Weak signal |
| --- | --- | --- |
| User capability | named user goal or workflow step | visual fragment only |
| Domain vocabulary | cohesive types/actions distinct from siblings | generic helpers |
| State ownership | draft, cache, selection, mutation/state machine | props relayed unchanged |
| Side-effect lifecycle | loading, cancellation, subscription, persistence, recovery | one event callback |
| Independent change reason | changes for its own product reason | parent is merely long |
| Presentation surface | route, panel, tab, dialog phase, recoverable surface | styling wrapper |
| Performance boundary | isolated subscription, lazy chunk, virtualization | speculative memoization |
| Verification boundary | stable contract test without unrelated areas | must mount the entire app |

Lifecycle phase is the intersection of state/effect ownership and a meaningful workflow transition. A component variant sharing the same state and lifecycle stays a component. A pure helper with one consumer stays inside its owner.

## Four Orca Cases

### App shell: application-lifetime boundary

The public entry remains `App.tsx`; it owns provider/render order and cleanup tied to the root node. Startup hydration, session persistence, global keybindings, background services, workspace chrome, and root surfaces have different lifecycle/effect and change reasons, so they live under `app-shell`. Verification should combine focused hook/surface tests with app-shell smoke or E2E coverage. This is not a claim that every root hook is a separate feature: each is an implementation unit owned by the app shell.

### Pull-request page: capability with workflow domains

The page is one user capability, while conversation, checks, files, reviewers, edit, actions, mentions, cache, presentation, and page composition use different domain vocabulary, state/effects, and verification seams. Their imports should point toward stable page/domain contracts rather than laterally through every sibling. Tests such as cache/model tests and the host-boundary test verify individual contracts without mounting every workflow domain.

### GitHub item dialog: lifecycle folders

The dialog is grouped by lifecycle: `load-item-details`, `open-dialog`, `discuss-item`, `edit-item-fields`, `inspect-pull-request`, and `land-pull-request`. Loading owns cache/request settlement; opening owns shell/header/tabs; discussion owns comment composition/timeline; editing owns field mutations; inspection owns checks/files; landing owns reviewers/merge actions. The source-boundary test protects the public host and behavioral routing. Keep the graph acyclic and avoid importing an internal module through the feature's public barrel, which reverses dependency direction.

### Worktree list: interaction domains

The useful split is not “enough files to satisfy max-lines.” `drag`, `grouping`, `listing`, `navigation`, `rows`, and `viewport` each own coherent interaction rules: drag sessions/autoscroll, row construction/order, filters/render selection, keyboard/reveal state, row presentation, and virtualization/measurement. Pure grouping/viewport models have focused tests; hooks stay in the interaction domain whose lifecycle they implement.

Links to the evidence files for all four cases (in the Orca repository at a pinned commit) are listed in [Orca source inventory](orca-source-inventory.md#architecture-and-boundary-evidence).

## Review Signals, Not Failures

- import cycle;
- a feature's own file importing inward through its public barrel;
- one file coordinating four or more sibling domains;
- a flat extraction directory containing multiple recognizable lifecycle/domain clusters.

Report these as boundary candidates with evidence. Do not fail code solely on the heuristic: framework adapters, composition roots, and deliberately thin orchestrators may be valid. Validate the proposed public contract, dependency direction, and focused test before moving files.
