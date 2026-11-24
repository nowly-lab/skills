---
name: dmmf-implementation
description: >-
  Turn functional domain modeling outputs into TypeScript implementation-ready workflow state logic, tasks, examples, Mermaid diagrams, and living documents using Zod request/response parse boundaries. Use when a workflow, bounded context, event map, or domain model needs to become implementation work from workflow state construction, state transition, dependency injection, long orchestration extraction into named sub-workflows, error/effect handling, boundary schema design, persistence boundaries, transactions, CQRS, functional domain modeling patterns in TypeScript, CLI/job skipped responses, adapter error translation with HTTP status overrides, or evolving an existing model without making it dirty. Avoid ID aliases, branded types, custom Result wrappers, and extra request wrapper concepts.
---

# DMMF Implementation

This modeling skill provides technical contracts; it does not define the work process. Standalone modeling retains the technical contracts below within the requested scope. The DMMF `implementation-plan.md` is a technical modeling artifact, not the HTML plan of record.


## Background

The topic references follow the order-taking example and chapter order of Scott Wlaschin's *Domain Modeling Made Functional* (Pragmatic Bookshelf, 2018), re-expressed in TypeScript with Zod and with this skill's own rules. Read the book for the full reasoning.

## Core Workflow

Use this skill after `scrum-domain-modeling` or equivalent domain discovery has produced a workflow, event map, glossary and bounded-context assumptions.

Always start by reading `references/typescript-rules.md` and `references/implementation-map.md`. Then read the topic reference needed for the requested work:

- Pipeline composition, validation, pricing, acknowledgment, events, dependency injection, or dependency tests: `references/01-pipeline-typescript.md`
- Workflow errors, exception adapters, side-effect adapters, validation accumulation, or async effects without custom Result wrappers: `references/02-errors-effects-typescript.md`
- Request/response schemas, serialization wrappers, boundary parse, response validation, schema versioning, or domain-state-to-schema mapping: `references/03-serialization-typescript.md`
- Persistence at the edge, context model reads/writes, CQRS, event sourcing, bounded-context storage ownership, document/RDB mapping, transactionally saved events, or transactions: `references/04-persistence-typescript.md`
- Requirement evolution, shipping, VIP handling, promotion codes, pricing method changes, contract evolution, or business-hour constraints: `references/05-evolution-typescript.md`

For work from `scrum-domain-modeling`, read the product's domain model data (`data/*.json` in its model directory) and the user's request. Use the workflow models, the event and command flows of the big picture, the glossary, context boundaries and hotspots needed for the requested slice. Distinguish observed behavior, accepted requirements and unresolved decisions; follow the user's instructions for implementation authorization.

## Knowledge Location

**REQUIRED DOCUMENTATION CONTRACT:** Read [Implementation Documentation Contract](../scrum-domain-modeling/references/implementation-documentation.md). Apply its file evidence, scoped refactoring, and current SSoT update rules to every DMMF artifact below. This contract preserves the product's language, document location, and authorization rules.

Keep this skill directory instruction-only. Do not write generated plans, histories, or working documents inside this skill's folder, wherever it is installed.

Write generated documents under `knowledges/dmmf-implementation/`. For a specific feature or implementation slice, create or update `knowledges/dmmf-implementation/<topic-slug>-YYYY-MM-DD/`.

Use these filenames unless the user asks for a different structure:

- `implementation-plan.md`
- `workflow-pipeline.md`
- `workflow-state.md`
- `error-model.md`
- `boundary-schemas.md`
- `persistence-boundary.md`
- `diagrams.md`
- `test-plan.md`
- `open-implementation-questions.md`

Each pipeline step/state/schema/error/persistence boundary and test task must link concrete code/test/document paths and symbols, with repository roots, revision, path state, and concise rationale. Carry any applicable current-to-target refactoring decisions into `implementation-plan.md`; distinguish proposed skeleton paths from inspected implementation. After verification, refresh actual paths and update the product's current SSoT with actual behavior, rationale, verification and remaining gaps; point the DMMF plan to that current model. Save that record even when implementation remains uncommitted; preserve it before authorized worktree cleanup.

## Required Sections

For every request, produce these sections:

1. `Implementation Slice`
2. `Workflow State`
3. `State Transitions`
4. `Pipeline Steps`
5. `Dependencies And Edges`
6. `Error / Effect Model`
7. `Serialization / Persistence Impact`
8. `TypeScript Implementation Example`
9. `Mermaid Diagrams`
10. `Tests`
11. `Open Questions`

Keep the answer actionable. Prefer file/module boundaries, function signatures, boundary schemas, test cases, and acceptance checks over abstract DDD explanation.

## Implementation Rules

- Start from the modeled workflow's domain workflow state, not from database tables, screens, framework handlers, or extra request wrapper objects.
- Encode request and response boundaries in Zod schemas at framework/adapter gates before writing orchestration code.
- Keep domain functions pure where possible; push I/O, persistence, time, network, and framework concerns to the edges.
- Compose workflow steps as state transitions: framework adapters parse requests with Zod, pass the parsed object into workflow state logic, enrich the state with dependencies, decide/price/transform, persist at boundaries, and validate response schema before returning from the adapter.
- Inject dependencies at the composition boundary. Use context-owned `*Model` dependencies for persistence-facing reads and writes, and function dependencies for external services, gateways, policies, clocks, and logging. Do not add extra persistence wrappers when the target codebase's model layer already owns persistence.
- When a main workflow becomes long because of conditional self-healing, retries, compensating effects, or multiple edge calls, extract that branch into a named sub-workflow with one object argument. Name it after the domain decision or effect, such as `reconcileDormantBillingProfile`, not after a generic helper role. Pass parsed values, the current state/result, dependency callbacks, and narrow logger methods through the object; bind raw clients in adapter closures before calling the sub-workflow.
- Make errors explicit at boundaries with domain error classes, typed error objects, or framework-native error handling. When an adapter converts a returned response variant back into an exception, preserve the business error code separately from the transport status and allow an explicit status override for cases such as data inconsistency that should be HTTP 500 even when the business reason is `not-found`. Do not introduce a custom `Result<T, E>` wrapper unless the target codebase already uses one.
- For CLI commands, workers, queues, scheduled jobs, and message handlers, model expected business precondition failures as workflow outcome variants such as `{ status: "skipped", reason }`, `{ status: "pending", reason }`, or `{ status: "retryable", reason }` instead of throwing inside the core workflow. Reserve thrown errors for programmer bugs, unexpected infrastructure failures, or adapter-level retry/dead-letter decisions.
- Treat Zod request/response schemas as context contracts. Do not add parallel boundary/domain wrappers when a parsed boundary object and workflow state are enough.
- Keep persistence behind workflow-facing model methods. Bounded contexts own their storage and expose contracts, not tables.
- When a workflow emits events, save those event records in the same transaction as the state mutation that produced them. Publish or dispatch from saved events/outbox after commit when another process needs notification.
- Evolve the model by adding explicit state variants, transformation stages, or schema versions; do not hide new rules in generic conditionals.
- Write constrained values as inline Zod fields such as `z.string().ulid()` or `z.number().nonnegative()`, choices as Zod discriminated unions or plain TypeScript unions, dependency binding as closures or dependency-bound factory functions, and failure flows as ordinary TypeScript control flow with parser/adapter boundaries.
- Include at least one concrete TypeScript skeleton for the requested workflow unless the user asks only for conceptual analysis.
- Re-express diagrams as Mermaid. Do not describe a diagram only in prose when it affects implementation structure.

## Readiness Gate

Implementation is not ready until the agent can state:

- the workflow state shape and response schema shape;
- the valid lifecycle workflow states and invalid paths;
- each pipeline step's state transition, dependencies, and failure mode;
- which long orchestration branches are extracted into named sub-workflows and what values/dependency callbacks they receive;
- whether each failure mode is a returned response variant, adapter-translated error, or truly unexpected throw;
- which adapter-translated errors need a transport status override that differs from the domain/business error kind;
- which data crosses a bounded-context boundary as Zod request/response schemas;
- which context model methods perform persistence reads/writes;
- which emitted events are saved in the same transaction as state changes;
- which tests prove business rules, error paths, and contract compatibility.
- which Zod schemas and structural TypeScript types encode the domain modeling concept being applied;
- which Mermaid diagram represents the workflow or boundary being implemented.
