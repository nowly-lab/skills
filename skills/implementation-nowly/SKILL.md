---
name: implementation-nowly
description: Use when implementing a ready product plan from planning-nowly in the same session, through tests, the review-nowly handoff, PR and release, keeping the planned domain model true.
---
# Implementation execution

> **For nowly-lab members.** This skill uses the MCP servers in [nowly-lab/mcp](https://github.com/nowly-lab/mcp), a private repository: `npx -y -p github:nowly-lab/mcp ...` works only for a GitHub account with access to it.

Product work runs as one chain of skills: [planning-nowly](../planning-nowly/SKILL.md) → [implementation-nowly](../implementation-nowly/SKILL.md) → [review-nowly](../review-nowly/SKILL.md), returning to implementation-nowly for the PR, then [demo-nowly](../demo-nowly/SKILL.md) records the demo video and attaches it to that PR when the PR changes a screen, before the merge and release. It applies to all product work, including investigation-only, requirements clarification, planning-only, fixes, review and delivery/release; product-specific skills supply structure, commands and constraints but do not replace or abbreviate the chain.

This skill is the middle of the chain: it receives the plan from planning-nowly, the same way `superpowers:executing-plans` receives a plan from `superpowers:writing-plans`, implements and verifies it, hands off to review-nowly, then creates the PR and releases. The domain model was already updated during planning; this skill keeps it true.

**Core principle:** the plan already did the thinking. Execute it in the same session and worktree that produced it, prove each step with a test you watched fail and then pass, and leave a record in the owner record that survives your own forgetting.

## Entry check

Start only with the handoff inputs: the plan link, the route (single-owner or independent review) and the owner record. Before any product code change, read the owner record's `planning` entry:

- `status: ready`, the plan matches the current scope and checked-out revision, and coverage lists files, test assertions, commands and expected results: continue.
- Anything missing, stale or unverified, or no plan: stop and use `planning-nowly` to repair it. Do not backfill planning evidence from an artifact's existence.

Planning and implementation stay with the same owner in the same session and worktree. Do not hand implementation or QA to someone else. When taking over work someone else started, have them stop at a safe boundary and write a handoff, preserve their files, commits, tests and runtime data, and confirm they have stopped before editing the same worktree.

## 1. Implement

1. Read and invoke `dmmf-implementation`, following the instructions that apply to the task. Record any unavailable skill and its limitation.
2. Work through the plan's tasks in order. For each one, before the production change, write and run the planned test and record the intended failure (RED). Implement, then record the pass (GREEN). If a meaningful test cannot be created, stop and report why.
3. **Continuous execution.** Do not pause between tasks to ask whether to continue.
4. **Rulings, not stalls.** Decide conflicts, ambiguities and plan defects yourself, and record each one in the owner record as `Ruling: <decision> — <why> — <cost if wrong>`. Update the HTML plan when a ruling changes it. Deviating from the plan without a recorded ruling is a decision made in secret.
5. **Stop only for:** an irreversible or destructive operation; a security- or credential-sensitive action; a side effect outside the worktree that needs approval (a merge, a push to a shared branch, a publish or install); a material scope expansion or indispensable user-only input; or a plan so broken that every path forward is a guess. Ask through Plannotator as described in planning-nowly's Plannotator usage. For a non-blocking question, use the Inbox and continue independent work.

For products using PostgreSQL, develop and test against Neon branches by default, unless the project's tips skill or `AGENTS.md`/`CLAUDE.md` names another isolated test database. Use `neon-cli`, verify the product's project and parent branch before creating task-specific branches, verify the target before migrations or destructive tests, and keep credentials out of records and logs. If the correct target cannot be verified, report the blocker rather than using production or another product's database. Honor an explicit user instruction to use a different setup.

Automated tests, typecheck and build checks are the owner's responsibility. Run the plan's verification commands and record their actual output.

## 2. Review handoff

When every plan task is GREEN and the plan's verification commands have passed, implementation is complete. Do not open the PR yet.

**REQUIRED SUB-SKILL:** Use `review-nowly`, passing the plan link, route, owner record, revision/diff range, test evidence and known limitations. It runs the review for the route and returns a verdict. Continue to [Domain model check](#3-domain-model-check) only after it reports that findings are resolved, or report its blocker.

## 3. Domain model check

Planning already updated the product's domain model to the planned shape; there is no separate documentation step here.

- **During implementation:** when the work must differ from the planned model (a rule, an event, a flow, a state or a file changes), ask the person through the Plannotator Inbox, agree on the change, then update the model data with `scrum-domain-modeling`, run `render`, and record the ruling. Never let the code and the model silently diverge.
- **Before the PR:** run `npx -y -p github:nowly-lab/mcp event-storming-mcp check <model-dir> --repo <product-root>` (see `scrum-domain-modeling`). It must pass: the data is valid, the pages are current, and every evidence path and symbol exists. Record the output in the owner record. A failure means the implementation and the plan differ: resolve it as above, not by deleting evidence.

## 4. PR and release

After implementation checks, a resolved `review-nowly` verdict and a passing domain model check, create the PR for the authorized scope. Then give the assets planning recorded for this branch the PR: `npx -y -p github:nowly-lab/mcp marketing-mcp asset link --repo <product worktree> --group <branch> --pr <owner/repo>#<n> --pr-title "<PR title>"` (`marketing-mcp-tips`, "Assets"). Include the plan link, test results, review verdict, the domain model pages changed by the plan and any actual-screen evidence, and state the remaining verification limitations.

**Demo video for every PR that changes a screen.** **REQUIRED SUB-SKILL:** once the PR exists, use `demo-nowly` with the PR number and the product: it adds or updates the feature's Maestro flow in the product's `.maestro/demo/` (pushed to the PR branch), records it and attaches the video to the PR as a comment. Continue to the merge and release only after the video is attached, or after the PR says why it has none. The flow is part of the PR's code. When the change cannot be recorded this way (a feature that only works on a real device: camera, purchases, push notifications), say so in the PR and why. When the product has no demo setup yet (no `.maestro/demo/` flows or no way to reach signed-in screens locally), say so in the PR and record the setup as a follow-up instead of blocking the PR. These PR videos are the source for App Store review notes and sprint reviews: collect them from the PRs of that release or sprint (`demo-nowly`, "Find and download the videos later") rather than recording again.

Opening a PR does not authorize merging. Apply the [main-merge release policy](references/main-release-policy.md) to allowlisted products. An authorized main merge includes release to every existing verified product-owned production surface without another routine approval. Preserve real platform approvals, credentials, data boundaries, branch protections and deployed-artifact verification.

If the project has its own tips skill (for example `<product>-tips`) or `AGENTS.md`/`CLAUDE.md`, follow it for structure, commands and release steps, and update it with the external services and project names used, including project IDs and environments where needed. Record where release secrets are stored in the team's secret manager using verified references (for example vault, item and field), and mark unknown details explicitly. Record references only, never secret values or connection strings. Access the secret manager the way the project's tips skill or the team's documentation says.

## 5. Completion

If release or production verification shows behavior that differs from the domain model, agree the change with the person through the Plannotator Inbox and update the model through `scrum-domain-modeling`.

Before reporting completion, apply `superpowers:verification-before-completion`, update the goal status in the owner record and mark the goal complete only when its criteria are verified. Report blockers rather than claiming completion.

### Worktree cleanup

When the work is complete (the PR is merged and the release to every required surface is verified), delete the worktree the work used and clean up. Do this as part of completion, without another approval. Release authorization covers it.

1. **Check that nothing would be lost.** `git status --porcelain` is empty and `git log origin/main..HEAD` shows no commits missing from main (a squash merge leaves branch commits that are already in main; confirm with the merged PR). If uncommitted changes, unpushed commits or files that belong to someone else remain, stop and report them instead of deleting.
2. **Keep the evidence outside the worktree.** The owner record, plan, review record, release logs and screenshots must already live outside the worktree (for example the session scratchpad). Move anything still needed before deleting. Release artifacts under ignored build folders (such as `dist/` or `build/`) are disposable once their published copies are verified.
3. **Stop what runs from the worktree.** End dev servers, preview servers, workers and terminals whose working directory is in the worktree. Never stop the user's installed app, live sessions or another worktree's processes.
4. **Remove the worktree** with `orca worktree rm --worktree path:<worktree> --delete-branch --json` (Orca-managed), or `git worktree remove <path>` followed by deleting the merged local branch. Delete the merged remote branch when the repository does not do it automatically. Never use `--force` to get past uncommitted or unknown files.
5. **Record and report.** Note the removed worktree path, branch and the evidence location in the owner record, and mention the cleanup in the completion report.

Skip cleanup and say why when the user asked to keep the worktree, follow-up work in the same scope is already agreed, or the release is blocked or partial.
