---
name: scrum-domain-modeling
description: Maintain each product's domain model, the single source of truth for its overall picture, as JSON data rendered to HTML pages (an EventStorming big picture board, glossary, event and command map, workflow models, context map). Use when planning reads or updates the model, when modeling a product idea or change with event storming, and when an implementation drifts from the planned model.
---

# Domain Modeling

> **For nowly-lab members.** This skill uses the MCP servers in [nowly-lab/mcp](https://github.com/nowly-lab/mcp), a private repository: `npx -y -p github:nowly-lab/mcp ...` works only for a GitHub account with access to it.

The domain model is the product's **single source of truth for the overall picture**. `planning-nowly` reads it before planning and updates it to the planned shape during planning; the model is shown with the plan in Plannotator. `implementation-nowly` keeps it true when the implementation drifts. There is no separate documentation step after review.

The model is JSON data. The script renders it to HTML. **Edit only the JSON; never edit the generated HTML.**

| Page | Data | Shows |
| --- | --- | --- |
| `index.html` | (all) | Links, counts, how many items each page changes, hotspots, stickies changed by the current plan |
| `big-picture.html` | `data/big-picture.json` | EventStorming board: domains as ellipses (or as lanes under timeline phase columns when `phases` is set), stickies joined by flow arrows along the timeline, dotted arrows into read models, aggregates/external systems/hotspots stuck onto their stickies; legend, changed stickies pulsing (toggle), a detail panel with evidence, pinch zoom, and dragging empty canvas to move the board |
| `domain-glossary.html` | `data/domain-glossary.json` | Terms, code names, related stickies, evidence |
| `event-command-map.html` | derived from `data/big-picture.json` | Actor → command → aggregate → event, and event → policy (execution type) → command |
| `workflow-models.html` | `data/workflow-models.json` | Per lifecycle: state diagram (pinch zoom, drag to move), transition table, state × trigger matrix |
| `context-map.html` | `data/context-map.json` | Bounded contexts, relations (pinch zoom, drag to move), responsibilities and contracts |

The exact data format is in [references/data-format.md](references/data-format.md). What each document should capture is in [references/living-documents.md](references/living-documents.md).

## Where the model lives

Use the product's model directory in the product repository. If the project has its own tips skill (for example `<product>-tips`) or an AGENTS.md/CLAUDE.md that names it, use that; otherwise use `docs/domain-model/` (other common choices: `docs/product/scrum-domain-modeling/`, `knowledges/scrum-domain-modeling/`) and ask the person before creating a new one. Commit both `data/` and the generated pages, so the pages open on GitHub and in Plannotator without running anything.

## The tool

The validator, the renderer and the meeting server are the `event-storming-mcp` package of the public repository [nowly-lab/mcp](https://github.com/nowly-lab/mcp/tree/main/packages/event-storming-mcp) (`npx -y -p github:nowly-lab/mcp event-storming-mcp`); maintain them there. It needs Node 22.18 or later and nothing installed: `npx` fetches it.

```bash
npx -y -p github:nowly-lab/mcp event-storming-mcp init     <model-dir>   # empty data files; never overwrites
npx -y -p github:nowly-lab/mcp event-storming-mcp validate <model-dir>   # check the data only
npx -y -p github:nowly-lab/mcp event-storming-mcp render   <model-dir>   # validate, then write the HTML pages
npx -y -p github:nowly-lab/mcp event-storming-mcp check    <model-dir> --repo <product-root>   # data valid, pages current, every evidence path and symbol exists
```

Every problem prints as one line, `data/<file>.json: <JSON path>: <what is wrong and how to fix it>`, often with the closest valid id. Fix the data and run again; `render` writes nothing while any error remains. Exit codes: 0 ok, 1 fix the data or pages, 2 usage. Offline, run it from a checkout of the tool: `node <checkout>/dist/cli.js check …` (see `event-storming-mcp-tips`).

`check --repo` is how evidence is verified: planning may name files that do not exist yet; before the PR, `check` fails unless the implementation created them and the named symbols appear in them.

## In a meeting

When a model is worked on with people watching (an event storming session, a planning meeting), show it on the live board instead of re-rendering files: register the model folder (`npx -y -p github:nowly-lab/mcp event-storming-mcp add <model-dir>` or the MCP tool `register_project`), open the board (`npx -y -p github:nowly-lab/mcp event-storming-mcp`) and share that screen. Edit through the MCP tools (`get_model`, then `apply_changes` with the version you read); every open board redraws at once, and people fix stickies and arrows on the board themselves. A refused `apply_changes` (`conflict`) means someone changed the model first: read it again and redo the change. Rule violations are allowed while drafting; the committed HTML is written once the model validates. The same JSON is the source of truth, so `check --repo` before the PR still applies. Setup and the tool list: `event-storming-mcp-tips`.

## Model a workflow (event storming)

Use this when modeling a feature, workflow or product idea, and when building a product's first model from its code.

1. **Pick one concrete use case.** Prefer a thin happy path ("a member enters the office"). Do not start from tables, APIs, screens or classes.
2. **Events first.** Write past-tense business facts (`入室を記録した`) quickly; order comes later.
3. **Timeline.** Arrange events left to right by business time; add events where the timeline shows gaps. In the data, give the big picture its ordered timeline phases (`phases`, for example 「商品を探す」→「注文する」→「受け取る」) and each event its `phase`: the board then draws domains as lanes and phases as columns, so events read left to right in time across domains. Other stickies follow their next event along the `flow` edges. A model without phases is drawn as domain ellipses ordered by the flow alone; add phases the next time a plan touches such a model.
4. **Hotspots.** Mark conflicts, pain points, unknown rules, external dependencies and "this may branch" points as `hotspot` stickies attached to what they concern. Do not invent rules to remove a hotspot.
5. **Commands and actors.** Commands are requests (`入室する`); actors are the people or systems that issue them. An actor starts a flow: `actor → command → aggregate → event`.
6. **Read models.** What an actor looks at to decide the next command (`在室者と位置` before `席を選ぶ`). Point `result` edges from the events that update them, and place it just before the actor and command that use it. A read model is not a log, an output or "what got saved": if no actor reads it to decide something, leave it off the board (a saved record is part of the event or the aggregate).
7. **Policies.** A rule that decides what happens next when a domain event occurs. Write only the condition on the sticky (`在庫数が0になったら`); the next command says what is done: `event → policy → command`, with `execution` `sync`, `async`, `scheduled` or `external`. A `scheduled` policy may start from the clock (`毎日7時に`) with no event; when a person decides, put the actor between: `policy → actor → command`.
8. **Aggregates.** Data that must be updated together to stay consistent. Name it with a noun (`在庫`, `座席`), place it in the flow as `command → aggregate → event`, and list the rules it always keeps in `invariants` (`座席は32席まで`). One command updates one aggregate; consistency across aggregates goes through policies (eventual consistency). Put its code name in evidence.
9. **Domains.** Group related stickies into domains (the ellipses). Let one event fan out into the domains that react to it; let branches merge at a policy.
10. **Evidence.** For every sticky that maps to code, add `evidence` with the file and a symbol that literally appears in it, so `check --repo` can prove it.

Then record terms in the glossary, lifecycles with meaningful states in workflow models (states move on the big picture's own commands and events; decide every state × command/event pair as a transition, `invalid` or `ignored`, or leave it "未定義" with a hotspot), and boundaries in the context map.

The terms behind policies and aggregates (invariant, formal specification, model checking, counterexample, aggregate, temporal property, eventual consistency, shift left) are in [references/aggregate-and-policy.md](references/aggregate-and-policy.md).

Colors (fixed in the pages): event orange, command light blue, actor small pale yellow, policy purple, aggregate strong yellow, external system pink, read model yellow-green, hotspot red-pink.

## Planning: read, then update

1. **Read.** Open the product's `data/*.json` (agents read the data; the pages are for people). Recheck the evidence of the stickies the request touches against the current checkout with `check --repo`. If the product still has only Markdown documents, migrate them to this format as part of the plan (rebuild the big picture from the code; keep what the Markdown says only where the code confirms it).
2. **Update to the planned shape.** Remove the previous plan's `"changed": true` marks from every data file, then change the data to what the plan will build and mark each added or changed sticky with `"changed": true`. Mark glossary terms, lifecycle states, transitions and rejections, contexts and relations the same way when the plan adds or changes them; items that point at a changed sticky light up without a mark. Every page lists and pulses the marked items, so the reviewer sees the plan's changes on each page. Name new files in evidence even though they do not exist yet. Put unresolved rules on the board as hotspots instead of inventing them.
3. **Render and validate.** `render`, then `check` (without `--repo`, since planned files are not there yet). Fix every error.
4. **Show it with the plan.** Attach `index.html` and the changed pages to the plan's Plannotator Inbox thread, and link them from the HTML plan. The plan's review covers the model.

## Implementation: keep it true

- When the implementation must differ from the planned model (a rule, an event, a flow or a file changes), ask the person in the Plannotator Inbox, agree, then update the data and `render`. Do not silently diverge, and do not silently keep a model that is no longer true.
- Before the PR, run `check <model-dir> --repo <product-root>`. It must pass: data valid, pages current, every evidence path and symbol present.

## Other skills

`dmmf-implementation` turns the workflow models and the event and command map into TypeScript workflow code; it reads the same data. A project's own tips skill or AGENTS.md/CLAUDE.md, when it has one, names the model directory.
