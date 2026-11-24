# Implementation Map

Use this reference to choose the implementation path.

## Topics

- Pipeline (`01-pipeline-typescript.md`): compose a domain workflow into a pipeline, implement validation, adapters, dependencies, and assembled workflow.
- Errors and effects (`02-errors-effects-typescript.md`): make failures explicit without custom Result wrappers by using framework parse boundaries, adapter-level exception conversion, async effect boundaries, and accumulated validation where useful.
- Serialization (`03-serialization-typescript.md`): keep serialization separate from core logic; use Zod request/response schemas as bounded-context contracts and parse/validate in adapters.
- Persistence (`04-persistence-typescript.md`): push persistence to the edge, keep storage ownership inside bounded contexts, use context models for reads/writes, and handle transactions deliberately.
- Evolution (`05-evolution-typescript.md`): evolve the model by adding explicit state variants, transformation stages, and schema versions while keeping business rules visible.

## Strict Topic References

Use these files as the primary implementation references because they follow the implementation order and state modeling rules separately from their TypeScript form:

- `01-pipeline-typescript.md`
- `02-errors-effects-typescript.md`
- `03-serialization-typescript.md`
- `04-persistence-typescript.md`
- `05-evolution-typescript.md`

## Preconditions

Apply the [shared documentation contract](../../scrum-domain-modeling/references/implementation-documentation.md): identify code/knowledge roots and inspected revision, map the files of each design element as evidence that `event-storming-mcp check --repo` can prove, and retain concise evidence-based rationale. A code skeleton is planned guidance until matched to an actual implementation.

Before implementation, collect or create:

- Workflow name and bounded context.
- Workflow state that the workflow transforms.
- Workflow outcome or emitted event outcome.
- Valid lifecycle workflow states.
- Business validation rules.
- External dependencies such as pricing, address validation, customer status, context models, clock, gateway clients, or message bus.
- Cross-context request/response schemas.
- Open domain questions that block implementation.

If any item is missing, include it in `open-implementation-questions.md` and decide whether to create a spike or defer the implementation slice.

## Implementation Sequence

1. Name the narrow workflow slice.
2. Define the workflow state shape.
3. Model valid workflow states and invalid paths.
4. Implement pure state transition steps.
5. Choose context model dependencies for persistence-facing reads/writes and small adapter functions for external services.
6. Compose the steps into a pipeline.
7. Extract long conditional or effect-heavy branches into named sub-workflows with one object argument.
8. Add boundary error and effect flow.
9. Add Zod request and response schema validation in framework/message adapters.
10. Add persistence through context models at the edge.
11. Add tests for business rules, error paths, and contracts.

For TypeScript artifacts, also include:

12. Zod schemas with inline field constraints for request/response boundaries.
13. Discriminated unions for workflow states, outcomes, events, errors, and choices.
14. A dependency-bound factory such as `makePlaceOrderWorkflow`.
15. Mermaid diagrams for workflow order, error flow, and edge boundaries.

## Scrum Link

Use this skill during Sprint Planning and implementation execution. Feed its outputs back into Scrum living documents:

- `workflow-pipeline.md` updates the workflow model.
- `workflow-state.md` updates the glossary and domain model.
- `error-model.md` updates acceptance examples and invalid paths.
- `boundary-schemas.md` updates context map contracts.
- `persistence-boundary.md` updates context model reads/writes, transaction boundaries, and event-saving decisions.
- `diagrams.md` records Mermaid diagrams for workflow, effects, and context contracts.
- `test-plan.md` becomes backlog implementation and verification tasks.

Every mapping includes exact code/test/document paths or a stable evidence ID in the owning packet. `implementation-plan.md` owns the scoped refactor map (current → target, responsibilities/callers, preserved behavior, dependencies, non-goals and checks). After implementation, update actual behavior, rationale, check results and remaining failures directly in the product's current SSoT; link the plan to that model and do not infer test success from a test-plan file or commit.

## Required TypeScript Artifacts

When generating implementation guidance, include at least these TypeScript artifacts:

- Zod schemas for request and response boundaries, with ID fields written inline as `z.string().ulid()`;
- workflow function type aliases;
- dependency type aliases containing context models for persistence and function dependencies for external effects;
- discriminated union state variants, domain events, and errors;
- framework/message adapter examples that parse request data, call core with the parsed object, and validate response data;
- a dependency-bound workflow factory;
- named sub-workflow functions for long orchestration branches, using one object argument that carries parsed values, current state/result, dependency callbacks, and narrow logging ports;
- context model method calls for both reads and writes, with emitted events saved in the same transaction as the state mutation;
- tests for schemas/parsers, pipeline success, and error branches.
