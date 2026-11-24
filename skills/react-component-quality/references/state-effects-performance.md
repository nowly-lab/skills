# State, Effects, and Performance

## State Ownership

Use local state for transient UI owned by one mounted surface. Use a feature hook for one lifecycle shared by that feature. Use Zustand/global state only when multiple distant consumers or a process-level coordinator need the same state.

Subscribe to the smallest stable value: `useStore((s) => s.field)` or a memoized selector. For several fields, use shallow equality with an object whose members are stable. Avoid whole-store subscriptions, identity selectors, allocating arrays/objects on every selector call, and reading global state in a presentational leaf merely to avoid a prop.

Orca's focused selectors and shallow action grouping are evidenced in [Orca source inventory](orca-source-inventory.md#state-effects-performance-and-ui-evidence).

## Effects and Async Work

An effect must name the external lifecycle it synchronizes. Return cleanup for listeners, timers, observers, subscriptions, and abortable requests. Guard stale responses with an `AbortController`, request/generation identity, or a scoped cancelled flag; cleanup must prevent both stale state writes and leaked external work. Keep pure derivation out of effects.

Expose pending, success, empty, error, retry, and cancellation states deliberately. Disable or reconcile duplicate mutations. Keep previous content only when the product contract calls for stale-while-revalidate behavior, and make that state visible.

## Performance

Measure ownership and fan-out before adding memoization. Prefer narrower store subscriptions and moving high-churn listeners to a leaf over wrapping the entire tree in `memo`. Use `useMemo`/`useCallback` for demonstrated expensive work or identity contracts, not by default. Defer nonurgent computation/input-derived rendering when it improves interaction latency. Lazy-load conditional heavy surfaces with recovery boundaries. Virtualize long lists only when row count/render cost warrants the complexity; keep stable row keys, measurement, keyboard navigation, reveal, and scroll-restoration behavior under tests.
