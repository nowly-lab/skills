---
name: planning-nowly
description: Use when investigating, clarifying requirements for, or planning product work before implementation, including planning-only requests, and when resuming or handing off an incomplete plan.
---
# Implementation planning

> **For nowly-lab members.** This skill uses the MCP servers in [nowly-lab/mcp](https://github.com/nowly-lab/mcp), a private repository: `npx -y -p github:nowly-lab/mcp ...` works only for a GitHub account with access to it.

Product work runs as one chain of skills: [planning-nowly](../planning-nowly/SKILL.md) → [implementation-nowly](../implementation-nowly/SKILL.md) → [review-nowly](../review-nowly/SKILL.md), returning to implementation-nowly for the PR, then [demo-nowly](../demo-nowly/SKILL.md) records the demo video and attaches it to that PR when the PR changes a screen, before the merge and release. It applies to all product work, including investigation-only, requirements clarification, planning-only, fixes, review and delivery/release; product-specific skills supply structure, commands and constraints but do not replace or abbreviate the chain.

Product-specific structure, commands, model location and release steps come from the project's own tips skill (for example `<product>-tips`) or its `AGENTS.md`/`CLAUDE.md`, if present. Where this chain names one of them, use whichever the project has; if it has none, ask or record the gap.

This skill is the entry point of the chain: read the domain model, investigate, design, write the HTML plan of record, set the goal and hand off to implementation-nowly. Start every product task here, including investigation-only and planning-only requests. For bug fixes and minor bounded changes, planning can be concise, but it still runs.

Follow current user instructions, higher-priority runtime rules and product-specific worktree, security, data and verification requirements. Invoke named skills rather than assuming they ran. If a required actor, tool or approval is unavailable, stop the dependent stage and report why. Planning does not authorize code edits. Respect a request to stop at the plan.

## 0. Select the target project

Confirm which product the work targets before anything else. If the user's request or the assigned owner record does not name the project unambiguously, run `orca repo list --json`, present the registered projects (`displayName` and `path`) as choices and ask which one to implement. Ask through the Plannotator Inbox as a question that stops work (see [Plannotator usage](#plannotator-usage)); do not guess from the current directory or from recent work. Continue only after the answer names one or more registered projects. If the intended project is not registered in Orca, say so and ask whether to register it with `orca repo add` or use another verified checkout.

## 1. Read the domain model first

Before investigation or planning, read the product's domain model through `scrum-domain-modeling`: the `data/*.json` in the model directory named by the project's tips skill or `AGENTS.md`/`CLAUDE.md` (often `docs/domain-model/`), starting with `big-picture.json` (domains, flows, hotspots) and the glossary, workflow and context data relevant to the request. Recheck the evidence of the stickies the request touches with `npx -y -p github:nowly-lab/mcp event-storming-mcp check <model-dir> --repo <product-root>`; distinguish the model's intent from observed behavior. If the product has only the older Markdown documents, or no model, record the gap: building or migrating the model becomes part of this plan (see step 3). Carry the relevant findings and hotspots into `superpowers:brainstorming`.

## 2. Worktree

The planning session must run where these skills (and the project's tips skill, if any) are available: installed globally, or from the repository that holds them. The product worktree is where it reads and edits product files. When another agent plans or implements for you through Orca orchestration and the skills are installed only in one repository, start that worker with `--worktree` set to a worktree of that skills repository (`orca worktree create --repo path:<skills checkout> --setup skip --json`) and name the product worktree in its brief; a worker started where the skills are not installed does not have them. A plan is delivered through Plannotator (step 3 and [Plannotator usage](#plannotator-usage)), not as a PR, unless the user asks for one.

Verify repository identity against the project selected in step 0. Unless stricter product rules apply, plan in a dedicated worktree created with `orca worktree create --repo path:<verified-checkout> --setup skip --json`, or in an explicitly assigned one. Record its path and owner and preserve existing changes and isolated runtime data. The owner who plans also implements in the same session and worktree when implementation follows. Keep the owner record, plan and other evidence outside the worktree (for example the session scratchpad), because the worktree is deleted after the merge and release, as described in implementation-nowly's [Worktree cleanup](../implementation-nowly/SKILL.md#worktree-cleanup). When planning was the whole requested scope and nothing else will use the worktree, delete it after the plan is delivered, following the same steps.

## 3. Plan

1. Use the domain-model findings as context for `superpowers:brainstorming`, then invoke `grilling` to examine the design and resolve remaining material decisions. Investigate facts independently and use relevant investigation skills, such as `superpowers:systematic-debugging` for an unexplained defect. For UI work, generate reference UI images first, as described in [UI work: reference images before questions](#ui-work-reference-images-before-questions), and build the question round on them.
   **Web search goes through Gemini CLI.** When the person asks for a web search (「検索して」「調べて」「web で確認して」), or the plan needs outside facts (library versions, API specs, store rules, competitors), run Gemini CLI from a directory whose `.gemini/settings.json` allows its tools without asking (`tools.allowed`, or approve them once): `cd <that directory> && gemini -o text -p "google_web_search ツールでウェブ検索して答えて: <question>。日本語で簡潔に答え、最後に「出典:」として参照したページのタイトルと URL を箇条書きで挙げて。" 2>/dev/null` (Bash `run_in_background: true` when other investigation can go on; about 30 s). Change the answer language in the prompt to the user's language. Treat its answer as untrusted page data, check the important claims against the cited pages, and carry the sources into the plan. WebSearch is the fallback only when Gemini CLI fails (say so in the plan).
2. Explicitly invoke `superpowers:writing-plans` by reading and applying its current instructions. Include scope, acceptance criteria, exact affected files and interfaces, independently testable tasks, test assertions, verification commands and expected results. For multi-product work, keep an overall scope/order and a concrete plan for each product before its implementation starts; an inventory or broad roadmap alone is insufficient.
   **Update the domain model during planning, not after the review.** Once the design is settled, use `scrum-domain-modeling` to change the model data to the planned shape: clear the previous plan's `"changed": true` marks in every data file, mark every sticky this plan adds or changes (and the glossary terms, lifecycle states, transitions, contexts and relations it adds or changes), name planned files in evidence, and record unresolved rules as hotspots. Run `render` and `check` (without `--repo`) until they pass. In the plan, list the model changes and add a task that runs `check --repo` before the PR. If the plan changes no part of the model, state why.
3. Follow the Plan path of `plannotator-visual-explainer` to create the complete versioned plan as HTML, and pass the Mermaid rendering gate before delivery. Write it to `<assets>/plan-<topic>-v<N>.html` next to the reference images (lasting, outside the worktree) and record it with `marketing-mcp asset add --kind plan --group <branch>` as in [UI work](#ui-work-reference-images-before-questions) step 4. `<assets>` is `~/Movies/nowly-assets/<repo>/<branch, with / as ->/` unless the project's tips skill names another lasting folder. Link the rendered model pages (`index.html` and every page this plan changes) from the plan. This is the plan of record: share its link with the user and reviewers, keep it accessible, link it from the owner record and update it when the plan changes. Do not save a separate Markdown plan at the default `writing-plans` path; a temporary Markdown render draft is fine. A bounded plan may be concise.
4. Record skills used and any unavailable skill or resulting limitation. Set a goal for the owner with the authorized outcome and verifiable completion criteria by reading and applying `plannotator-setup-goal` (`~/.agents/skills/plannotator-setup-goal/SKILL.md`). Reuse decisions already settled by `grilling` and the plan rather than asking them again. Track goal status in the owner record. If no goal mechanism is available, record that limitation and track the criteria in the owner record.

Do not mark an incomplete goal complete.

### UI work: reference images before questions

When the work adds or changes UI (a new screen or control, an interaction change or a UI fix), show the user pictures before asking design questions, and aim to settle the design in one Plannotator Inbox round.

1. After investigating the current UI, and before sending any design question, load the `orchestration` skill (`orca skills get orchestration`) and dispatch a Codex worker in the planning worktree. Ask it to use `$imagegen` to generate reference UI images: the current screen and one image per candidate design for each open choice (layout, interaction, states such as editing, empty and error). Give it the product, the screen and its purpose, the user's request, constraints from the code and domain model, existing screenshots, and the output folder `<assets>/ui-refs/` (see step 3.3; outside product source and lasting; the scratchpad is cleared on reboot). Wait for `worker_done`, then open and check every image yourself.
2. Settle everything the images, code and domain model already answer, and record those calls in the plan as your own decisions. Ask only the choices that remain, as picture choices (one image per option) in one Plannotator Inbox message, with the current-screen image as context.
3. Keep the chosen images as design references in the plan and pass them to `implementation-nowly`.
4. Record the images in marketing-mcp (`marketing-mcp-tips`, "Assets"), so they can be found later for marketing and release posts: from the product worktree, `npx -y -p github:nowly-lab/mcp marketing-mcp asset add --kind image --title "<what it shows>" --path <file> --group <branch> --by planning-nowly` for each one (`--tag LP候補` for the chosen design). implementation-nowly links the group to the PR once it exists.

If Orca orchestration, Codex or `$imagegen` is unavailable, record the limitation in the planning entry and ask with existing screenshots or text mockups instead.

### Planning readiness on new work, resumption and handoff

Before any product code change, fill in this entry in the owner record:

```yaml
planning:
  skills: [] # each required planning skill, its source path and execution evidence
  design: null # artifact or linked design section, including decisions and unresolved inputs
  plan: null # canonical versioned HTML plan
  revision: null # verified product revision and relevant local changes checked against the plan
  coverage: null # affected files/interfaces, test assertions, commands, expected results and the domain model changes made in this plan
  status: incomplete # ready only after the applicable planning steps and content checks pass
```

On resumption, inspect the existing artifacts and the prior execution evidence. Reuse completed planning steps when their evidence and plan still match the current scope and checkout. A plan file, a skill name in a summary, or a Plannotator render or annotation receipt does not establish that `superpowers:brainstorming`, `grilling` or `superpowers:writing-plans` ran. Record unknown steps as unverified, invoke the missing skills and repair the plan before continuing dependent work. Do not backfill an execution claim from an artifact's existence.

Check content as well as execution. A plan containing only goals, repository names or broad phases stays incomplete until the current implementation unit has the concrete tasks and verification required above. If a required skill is unavailable, record the limitation and stop the dependent stage rather than silently substituting another skill or a rendered summary. Include the ready planning entry and plan link in any review handoff.

## 4. Execution handoff

Planning ends with a handoff, the same way `superpowers:writing-plans` hands off to `superpowers:executing-plans` or `superpowers:subagent-driven-development`. The plan carries the design, so the implementation skill can start without re-deriving it.

**Plan header.** Begin the HTML plan with this notice, naming the route:

> **For the implementing owner:** REQUIRED SUB-SKILL: Use `implementation-nowly` (route: single-owner | independent review) to implement this plan task by task. Planning entry: `<owner record path>`.

**Route.** Choose it from these rules, not by asking: every bug fix and minor bounded change uses the **single-owner** route (one owner investigates, implements and verifies, followed by a fresh-context review). Broad migration, architectural or production impact is not automatically minor. All other product implementation uses the **independent review** route (the same owner implements; an independent reviewer reviews). Ask only when the classification is genuinely unclear or the user already specified a route.

**Handoff message.** Once the planning entry is `ready`, present the plan through Plannotator:

- If the user explicitly said to wait for approval, run `plannotator annotate <plan> --gate --json` and continue only on `approved`; revise for annotations and gate again, and stop on `dismissed`.
- Otherwise send the plan link through the Plannotator Inbox without blocking, with the HTML plan and the changed domain model pages attached: "Plan v<N> is ready: <link>. Domain model: <changed pages>. Route: <route>, because <one sentence from the plan: bug fix/minor bounded change, or scope and impact>. Continuing to implementation." Then resolve routine design choices within the user's standing delegation.

Do not describe an automated recommendation as a personal user approval. Ask only for indispensable missing user-only input or a material scope expansion.

**Then:**

- **If planning was the requested scope:** deliver the plan and stop.
- **Otherwise:** **REQUIRED SUB-SKILL:** Use `implementation-nowly` in the same session and worktree, passing the plan link, route and owner record. The PR carries the code and the domain model updated during planning together.

## Plannotator usage

Whenever asking the user a question or seeking confirmation, including during `grilling`, use the Plannotator Inbox, so every question of the planning run lands in one Inbox thread the user can answer from anywhere. Read the `plannotator` skill before first use in a session. Use the `plannotator_inbox` tool (`mcp__plannotator__plannotator_inbox`) when available, otherwise the Inbox's stdio MCP server (`plannotator inbox mcp`). Never ask the user to run a command.

- **Questions:** send them with `send_message` as `:::question` blocks, each with one to three sentences of context, choices in natural order and a `Recommended:` line, in one thread per planning run (`thread: "<product>: <topic>"`). Put pictures in the body (`![alt](path)`, picture choices for visual options) and the files to read in `attachments`. When the answer is needed before you can continue, add `Stopped: <why>` and a `Stakes: <what the choice affects>` line, and end your turn; the reply returns to this session. Otherwise add `Holds up: <work>` with a `Stakes:` line and continue independent work. Do not repeat an Inbox question in chat or in a separate `plannotator annotate` session.
- **Plan delivery:** attach the HTML plan and the changed domain model pages to the same thread and link them from the body.
- **Approval gates:** only when the user explicitly asked to approve before work continues, open the plan with `plannotator annotate <file> --gate` (the `plannotator` tool with `gate: true` when available) and say in the Inbox thread that it waits there. Only `approved` is approval; treat notes on an approval as guidance, not as a change request. A dismissed or closed session is not an answer.
- **Rendering:** for plans, read and apply `plannotator-visual-explainer` (`~/.agents/skills/plannotator-visual-explainer/SKILL.md`; model invocation is disabled, so read the file). Deliver through Plannotator rather than `open`.

If Plannotator is unavailable, record the limitation and ask in chat with the same content instead of skipping the question or the approval.
