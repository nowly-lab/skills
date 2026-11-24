# FDM To Scrum Map

Use this reference to map functional domain modeling work into Scrum events.

## Model Of The Work

Treat the early flow of domain modeling as three stages:

- **Understanding**: share the model with domain experts, discover business events, split domains, define bounded contexts, and build ubiquitous language.
- **Modeling**: document workflows, lifecycle states, constraints, inputs, outputs, dependencies, and substeps.
- **Implementation preparation**: verify context communication, contracts, DTOs, trust boundaries, vertical workflow slices, and I/O placement.

For this skill, understanding and modeling primarily drive planning and refinement. Implementation preparation is the readiness bridge from discovery/modeling into implementation.

## Scrum Event Responsibilities

### Product Backlog Refinement

Goal: turn a vague item into a domain-work item with known experts, questions, and documents.

Do:

- Identify the domain experts, users, support roles, compliance/security stakeholders, downstream teams, and operational owners.
- Run or plan event storming with people who ask questions and people who know answers.
- Capture business events in past tense.
- Capture commands as requests that trigger work.
- Group event chains into workflows.
- Detect upstream/downstream teams and handoffs.
- Identify non-functional requirements: volume, timing, predictability, auditability, compliance, resilience, latency, and user expertise.
- Update glossary and open-question log.

Outputs:

- Event list
- Command list
- Workflow candidates
- Stakeholder/expert map
- Context candidates
- Open questions
- Non-functional requirement notes

### Sprint Planning

Goal: choose a narrow workflow slice and define what "done enough to implement" means.

Do:

- Pick one workflow or thin path through a workflow.
- Define primary input command.
- Define other inputs and dependencies.
- Define output events and side effects.
- Define invalid/exception paths.
- Define acceptance examples in business language.
- Decide what documents must be updated during the sprint.
- Add technical spikes only for unknown implementation risks, not as a replacement for domain modeling.

Outputs:

- Sprint goal tied to a workflow
- Backlog items for conversations, documents, tests, and implementation
- Readiness gate for coding

### Daily Scrum

Goal: keep domain understanding from drifting while implementation proceeds.

Ask:

- Which domain question is blocking implementation?
- Which term changed meaning?
- Which document no longer matches the latest conversation?
- Which context boundary or dependency is unclear?
- Which command/event/DTO contract is unstable?
- Which expert conversation must happen before more code is written?

Outputs:

- Updated blockers
- Follow-up conversations
- Document update tasks

### Sprint Review

Goal: validate the workflow model and implementation behavior with stakeholders.

Do:

- Demonstrate scenarios as command -> workflow -> events, not only UI screens.
- Ask domain experts whether the lifecycle states match real work.
- Ask downstream teams whether output events/contracts are sufficient.
- Confirm non-functional expectations with realistic volumes and failure cases.
- Capture terminology corrections immediately.

Outputs:

- Accepted scenarios
- Changed terms
- Contract changes
- New backlog items

### Sprint Retrospective

Goal: improve the team's modeling system.

Ask:

- Did experts join at the right time?
- Did we discover requirements too late?
- Did documents stay current?
- Did terminology drift between code, tickets, and conversations?
- Were context boundaries useful or artificial?
- Did technical design start before domain understanding was sufficient?

Outputs:

- Working agreement changes
- Definition of Ready updates
- Documentation hygiene changes

## Implementation Readiness Gate

Do not mark a story implementation-ready until these are clear:

- Workflow name and purpose
- Domain experts who validated it
- Command(s) that trigger it
- Input data and dependencies
- Output event(s)
- Side effects
- Invalid paths and error events
- Lifecycle states and constraints
- Bounded context owner
- Cross-context relationships
- DTO/contract shape for external communication
- Trust boundary validation
- Living documents updated
- Related code/test/document paths checked, with unresolved locations explicit
- Targeted refactoring scope and preserved behavior recorded, or a reason no refactor is needed

## Backlog Item Pattern

Use this structure:

```markdown
### [Workflow/Context] - [Task]

Purpose:
Stakeholders:
Scrum event:
Inputs:
Outputs:
Documents to update:
Related files and evidence: <repository root label + relative paths + symbols + path states>
Rationale: <observed evidence, chosen approach, tradeoffs>
Planned changes: <create/edit/move/remove; old-to-new paths>
Refactoring scope: <responsibility, affected callers/contracts, preserved behavior, non-goals; or justified none>
Dependencies and execution order:
Verification: <checks and test paths; results/evidence added after execution>
Definition of done:
Open questions:
Status: <planned/in-progress/verification-blocked/implemented>
Current SSoT: <root/context document#section; latest behavior, rationale, checks, gaps and Git status>
```
