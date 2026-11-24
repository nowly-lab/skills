# Architecture

## Ownership Shape

Prefer a feature folder around one user capability. Its public entry composes focused implementation units:

- component: rendering and interaction wiring;
- hook: one owned lifecycle, subscription, or async coordination concern;
- model: pure domain decisions and transformations;
- test: the narrowest stable public contract.

Keep a one-owner hook/model inside its feature. Promote code to shared only after multiple real consumers need a stable, domain-neutral contract. Named exports and explicit props make boundaries reviewable; avoid catch-all `utils`, implicit store access deep in presentation, and barrels that hide dependency direction.

## App Composition

Orca's root is composition-oriented: `App.tsx` preserves provider order and root lifetime, `AppBackgroundServices.tsx` isolates nonvisual high-churn subscriptions, `AppWorkspaceShell.tsx` owns the primary shell, and `AppRootSurfaces.tsx` owns root overlays/modal stacking. Evidence is indexed in [Orca source inventory](orca-source-inventory.md#architecture-and-boundary-evidence).

Use this as a responsibility model, not a file template. Root composition may own ordering and lifetime cleanup; feature behavior belongs below it. Lazy-load surfaces that are expensive and conditional. Gate loading by the state that can make the surface appear, provide stable `Suspense` fallbacks, and wrap independently recoverable surfaces in an error boundary. Keep critical recovery paths eager when a failed lazy chunk could strand the user.

## Boundary Review

Before extraction, write down:

1. public entry point;
2. state/effects it owns;
3. allowed inward dependencies;
4. focused verification command.

An import cycle, an internal import through the feature's public barrel, or a coordinator importing four or more sibling domains requests review. It is evidence to inspect, not an automatic failure. The full decision model is in [feature-boundaries.md](feature-boundaries.md).
