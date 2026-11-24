# Domain model data format

The product's domain model is a set of JSON files. `npx -y -p github:nowly-lab/mcp event-storming-mcp` validates them and renders the HTML pages (the format is maintained with the tool, in its `docs/data-format.md`). Edit only the JSON; never edit the generated HTML.

```text
<model-dir>/                # the product's model directory (see SKILL.md: Where the model lives)
  data/
    big-picture.json        # required
    domain-glossary.json    # required
    workflow-models.json    # required
    context-map.json        # required
  index.html                # generated
  big-picture.html          # generated
  domain-glossary.html      # generated
  event-command-map.html    # generated from big-picture.json (no data file of its own)
  workflow-models.html      # generated
  context-map.html          # generated
```

Unknown keys are errors. IDs use `[a-z0-9-]` and start with a letter. Text is plain text; HTML in text is escaped.

## Shared parts

Every data file has:

| Key | Type | Meaning |
| --- | --- | --- |
| `schema` | string | `"<file-name>/v1"`, for example `"big-picture/v1"` |
| `title` | string | Page title |
| `summary` | string, optional | One or two sentences under the title |
| `checked` | object | `{ "revision": "<git sha or ref>", "date": "YYYY-MM-DD" }`: the product revision the model was checked against |

`changed` (optional boolean wherever it appears) marks what the current plan adds or changes: a sticky, a glossary term, a lifecycle state, transition or rejection, a context or a relation. Each page lists the marked items at the top and makes them pulse; a checkbox there turns the pulsing off. Pages also light up what refers to a changed sticky without its own mark: a glossary term naming it in `nodes`, an event and command map row containing it, a transition or rejection whose `on` is it. Planning clears the previous plan's marks in every file before setting its own.

`evidence` (optional wherever it appears) is a list of `{ "path", "symbol"?, "role"?, "note"? }`:

- `path`: file path relative to the product repository root. Planning may name a path that does not exist yet.
- `symbol`: a name that must appear in that file (function, type, test name).
- `role`: one of `entry`, `rule`, `contract`, `persistence`, `consumer`, `ui`, `test`, `source`.
- `note`: why this file supports the item.

There is no path state field. `check --repo <product-root>` fails when a `path` is missing or its `symbol` is not in the file, so planned paths are proved by the implementation before the PR.

## big-picture.json

| Key | Type | Meaning |
| --- | --- | --- |
| `product` | string, optional | Product name shown in every page header (defaults to `title`) |
| `domains` | list | `{ "id", "name", "note"? }`. Drawn as an ellipse around its stickies. |
| `nodes` | list | Stickies (below) |
| `edges` | list | `{ "from", "to", "kind" }`; `kind` is `flow` (solid arrow, what happens next) or `result` (dotted arrow, an event updates a read model) |

Sticky (`nodes[]`):

| Key | Type | Meaning |
| --- | --- | --- |
| `id` | string | Unique within the file |
| `type` | enum | `actor`, `command`, `event`, `policy`, `readModel`, `aggregate`, `external`, `hotspot` |
| `domain` | string | A `domains[].id` |
| `text` | string | Sticky text. Events are past-tense business facts; commands are requests; policies are the condition only ("〜されたら", "〜の場合"); aggregates are nouns ("在庫"). |
| `execution` | enum | Policies only, required: `sync`, `async`, `scheduled`, `external` |
| `invariants` | list of strings, optional | Aggregates only: the rules the aggregate always keeps ("在庫数は0以上") |
| `attach` | object, optional | `{ "to": "<node id>", "pos": "above" \| "below" \| "above-left" \| "above-right" \| "below-left" \| "below-right" }`: stick this note onto another note instead of placing it in the flow. Typical for `external`, `hotspot` and a `readModel` with no incoming `result` edge (a read model is attached only to the `actor` or `command` that uses it). An `aggregate` is never attached. The host must not itself be attached. |
| `changed` | boolean, optional | `true` marks a sticky that the current plan adds or changes. Planning clears the previous plan's marks before setting its own. |
| `note` | string, optional | Extra detail shown in the side panel |
| `evidence` | list, optional | See shared parts |

Rules:

- Edges connect stickies in the flow; neither end may be an attached sticky, except that a `result` edge may point at an attached `readModel`.
- A `result` edge starts at an `event` and ends at a `readModel`.
- Every `readModel` is something an actor looks at to decide the next command. In the flow it has an incoming `result` edge from an `event` and outgoing `flow` edges only to the `actor` or `command` that uses it (`event ⇢ readModel → actor → command`); attached, it is stuck on that `actor` or `command`. A result, log or output that nobody uses to decide is not a read model: leave it off the board.
- An actor starts a flow inside its own domain. When the same person acts in several domains, give each domain its own actor sticky; link domains with `flow` edges from an event to the next domain's actor, policy or command.
- Every `policy` has an incoming edge from an `event` (a `scheduled` policy may have none: it starts from the clock) and an outgoing edge to a `command`, or to an `actor` that issues a `command` when a person decides.
- Every `aggregate` sits in the flow: an incoming edge from a `command` and an outgoing edge to an `event`.
- Every state-changing `command` reaches an `event` through its outgoing `flow` edges.

`event-command-map.html` is derived from these stickies and edges: (read model →) actor or policy → command → aggregate (with its invariants) or external system → event, and event → policy (with execution) → (actor →) command.

## domain-glossary.json

`terms[]`: `{ "term", "meaning", "code"?: [string], "nodes"?: [node id from big-picture], "changed"?, "evidence"? }`. Terms are unique.

## workflow-models.json

`lifecycles[]`:

| Key | Type | Meaning |
| --- | --- | --- |
| `id`, `name` | string | |
| `domain` | string, optional | A big-picture domain id |
| `summary` | string, optional | |
| `states` | list | `{ "id", "name", "initial"?: true, "final"?: true, "changed"? }`; exactly one initial state |
| `transitions` | list | `{ "from", "on", "to", "guard"?, "effect"?, "changed"?, "evidence"? }`; `on` is the id of a big-picture `command` or `event` |
| `rejections` | list | `{ "state", "on", "kind": "invalid" \| "ignored", "reason", "changed"? }`: that command or event is refused (`invalid`) or accepted as a no-op (`ignored`) in that state |

There is no separate trigger list: the matrix columns are the commands and events that `on` names. Something driven by time is a command issued by a `scheduled` policy. The page draws the state diagram, the transition table and the state × command/event matrix (rejections show there with their reason) from the same data. A pair with neither a transition nor a rejection shows as "未定義"; decide it or record a hotspot. The same pair may not be both a transition and a rejection.

## context-map.json

| Key | Type | Meaning |
| --- | --- | --- |
| `contexts` | list | `{ "id", "name", "tech"?, "responsibility", "owns": [string], "contract": [string], "guarantees"?: [string], "domains"?: [big-picture domain id], "changed"?, "evidence"? }` |
| `relations` | list | `{ "from", "to", "label", "changed"? }` between context ids |
