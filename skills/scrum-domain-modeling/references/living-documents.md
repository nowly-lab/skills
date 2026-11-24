# Living Documents

What each part of the domain model should capture. The JSON shape is in [data-format.md](data-format.md); the script renders the pages. The model is the product's current overall picture, kept in the product repository's model directory.

## General rules

- One model per product. Never keep a second current model (old Markdown, a copy elsewhere). When migrating, remove the old documents in the same change; Git keeps their history.
- The model states the current intended behavior: what is built plus what the current plan is building. Mark the current plan's additions and changes with `"changed": true` (stickies, glossary terms, lifecycle states, transitions and rejections, contexts and relations); clear the previous plan's marks in every data file when a new plan starts.
- Distinguish observation from inference. When the code does not show a rule, record a hotspot instead of a rule.
- Every material sticky, term, transition and context that maps to code carries `evidence`: a file relative to the product root and, where useful, a symbol that literally appears in it. `check --repo` proves these exist. A directory alone is not evidence when concrete files are known.
- Text is for the product owner: plain business language in the product's working language. Code names belong in glossary `code` and evidence `symbol`.

## Big picture (`big-picture.json`)

The product-wide EventStorming board.

- Domains: the major areas of the business flow; each becomes an ellipse.
- Flows: `actor → command → aggregate → event`, branches that merge at a policy, events that fan out into other domains. Every state-changing command reaches an event.
- Policies: `event → policy → command` with an execution type (`sync`, `async`, `scheduled`, `external`). The sticky holds the condition only ("〜されたら"); the command is what is done. A `scheduled` policy may start from the clock; a person's decision is `policy → actor → command`.
- Aggregates: in the flow between the command and its events, named with a noun, with the rules they always keep in `invariants` and the code name in evidence.
- Read models: what an actor looks at to decide the next command, fed by `result` edges from events. Not results, logs or outputs that nobody uses to decide; those stay off the board.
- External systems: attach where they are called or where they send events.
- Hotspots: open questions, conflicts, risks and known limits, attached to what they concern. This is where open questions live; there is no separate open-questions document.
- Update when the top-level flow, an actor, a domain boundary, a command, an event or a policy changes.

## Domain glossary (`domain-glossary.json`)

Ubiquitous language: business term, meaning in business language, code/API names (`code`), the stickies it relates to (`nodes`) and evidence. Add a term when it first appears or an expert corrects the wording; note where business and code names differ in `meaning`.

## Event and command map (derived)

Rendered from the big picture: who issues each command, the aggregate and external systems involved, the events it emits, and which policies react to which events. Fix it by fixing the big picture.

## Workflow models (`workflow-models.json`)

One lifecycle per thing with meaningful states (a participant connection, a media publication, an order). States, transitions on the big picture's commands and events (`on`) with guard and effect, and rejections: `invalid` (refused in that state) or `ignored` (accepted as a no-op). The page draws the state diagram, the transition table and the state × command/event matrix from the same data, so they cannot disagree. A pair left undefined shows as "未定義": decide it or record a hotspot. Keep UI screen states out unless they change business meaning.

## Context map (`context-map.json`)

Bounded contexts: name, technology, responsibility, the state it owns, the contracts it offers, what it guarantees, the big picture domains it covers and evidence; relations between contexts with a short label (the protocol or contract). Update when ownership or a cross-context contract changes.

## Work breakdown, decisions and verification

These are not part of the model. The task breakdown, acceptance checks, decisions, rulings and verification results belong in the HTML plan and the owner record kept by `planning-nowly` and `implementation-nowly`.
