# TypeScript Rules

Use this file before applying the topic references.

## Rules

- Each topic reference states the rules first, then the concrete TypeScript shape.
- Code in the references shows the shape to follow; adapt names and details to the target codebase.
- Preserve this order when planning implementation: pipeline first, errors/effects second, serialization third, persistence fourth, evolution last.
- Reuse the order-taking vocabulary of the references in examples when useful: `PlaceOrder`, `ValidateOrder`, `PriceOrder`, `AcknowledgeOrder`, `CreateEvents`, `CheckedAddress`, `InvoicePaymentResult`.
- Write constrained ID/value types as inline Zod fields inside request/response schemas, not standalone TypeScript ID aliases or handcrafted branded types.
- Write workflow boundaries as request schema, response schema, and workflow state transitions. Do not introduce extra request wrapper objects in TypeScript examples.
- Handle failures with TypeScript boundary parsing, thrown/domain errors, framework-native error handling, or plain async exceptions. Do not add a custom `Result<T, E>` abstraction.
- Follow the local TypeScript model style for persistence: use context-owned `*Model` dependencies for both reads and writes instead of adding extra persistence wrappers.
- Persist emitted workflow/domain events in the same database transaction as the state changes that produced them. Treat later event publication as an outbox/post-commit concern.
- Prefer Mermaid diagrams from the topic reference files over generic diagrams when the user asks for a concrete workflow.

## Minimum Strict Output

When this skill produces implementation guidance from a modeled workflow, include:

- topic references used;
- the rule being applied;
- Mermaid diagram;
- code skeleton with request/response Zod schemas, workflow state transitions, context model dependencies, external-effect functions, and a dependency-bound workflow factory;
- transaction example showing state mutation and event record insertion in the same transaction when the workflow emits events;
- tests mapped to the same pipeline/error/boundary-schema/persistence/evolution concerns.
