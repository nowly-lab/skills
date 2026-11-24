# Testing

## Select the Smallest Honest Level

| Behavior | Preferred evidence |
| --- | --- |
| transformation, predicate, ordering, cache key | pure model unit test |
| subscription, effect cleanup, stale response, hook state machine | hook test with controlled lifecycle |
| rendering, keyboard, form, accessible state | Testing Library component test through roles/names |
| server/static markup contract | `renderToStaticMarkup` or equivalent focused assertion |
| multi-surface workflow, routing, native/portal/window behavior | browser or Electron E2E |
| layout, theme, animation, visual regression | manual/automated visual comparison plus interaction check |

Test public behavior, not extraction details. Prefer real state transitions over mocks; mock only unavoidable system boundaries. A refactor begins with passing characterization tests. If behavior changes, write the new failing behavior test first, confirm the expected failure, then implement.

Orca examples include accessible component interaction tests, static spinner markup tests, pure cache/grouping/viewport tests, and source-boundary tests; links to the evidence files are in [Orca source inventory](orca-source-inventory.md#testing-evidence).

## Verification Ladder

1. focused changed model/hook/component test;
2. target's focused TypeScript check where available;
3. installed changed-code and React Doctor gates;
4. max-lines ratchet;
5. broader unit suite and full typecheck;
6. relevant build;
7. visual/browser/Electron E2E for affected user flows.

Move upward proportional to blast radius. Record exact commands and outcomes. “CI will catch it” is not local evidence when a safe relevant command exists.
