---
name: review-nowly
description: Use when product implementation from implementation-nowly is complete and verified, before the PR, to run the route's review loop until findings are resolved.
---
# Implementation review

Product work runs as one chain of skills: [planning-nowly](../planning-nowly/SKILL.md) → [implementation-nowly](../implementation-nowly/SKILL.md) → [review-nowly](../review-nowly/SKILL.md), returning to implementation-nowly for the PR, then [demo-nowly](../demo-nowly/SKILL.md) records the demo video and attaches it to that PR when the PR changes a screen, before the merge and release. It applies to all product work, including investigation-only, requirements clarification, planning-only, fixes, review and delivery/release; product-specific skills supply structure, commands and constraints but do not replace or abbreviate the chain.

This skill starts automatically when implementation-nowly finishes implementing, the same way `superpowers:executing-plans` ends with a whole-branch review before `superpowers:finishing-a-development-branch`. It returns a verdict to implementation-nowly, which then creates the PR.

The owner stays the same: it coordinates the review, fixes findings in the same session and worktree and keeps the owner record. Reviewers never edit.

## Entry check

Start only with the handoff inputs: plan link, route, owner record, revision/diff range against the merge base, test evidence and known limitations. If any task is not GREEN or the plan's verification commands have not passed with recorded output, return to implementation-nowly instead of reviewing.

## 1. Choose the review for the route

- **Single-owner route** (bug fixes and minor bounded changes): run one whole-branch review in a fresh context with `superpowers:requesting-code-review`, scoped to the merge-base..HEAD diff and the plan, on the most capable available model. If no fresh-context reviewer is available, use the `code-review` skill on the diff and record that limitation.
- **Independent review route** (all other product implementation): use an independent reviewer who did not plan or implement the change, as described in [Independent review](#2-independent-review).
- **User-requested review:** if the user asked for a specific reviewer or review, use it in addition to the route's review.

## 2. Independent review

- **Handoff:** give the reviewer the plan link, the ready planning entry, the revision and diff range, test evidence, known limitations, the relevant user flows for actual-screen checks and a reviewer record path separate from the owner record. Keep secrets out of records.
- **Scope:** the reviewer checks correctness, regressions, tests, architecture and ownership without editing, sends actionable findings and questions to the owner, and records findings, re-review, verdict and any actual-screen evidence in its own record.
- **Independence:** if the intended reviewer is unavailable, the owner may record a substitute reviewer. Record the unavailable reviewer, the actual reviewer, verdict and re-review. Independence remains mandatory; the owner never reviews its own change as the independent review.
- **Actual-screen checks:** these belong to the review, not to a separate stage. Record the actions, observations, evidence and unverified behavior. Automated tests do not count as actual-screen verification.

## 3. Fix loop

1. Apply `superpowers:receiving-code-review` to every finding: verify it technically before acting, and push back with evidence when it is wrong.
2. Grade findings. For Critical and Important findings, fix each one in the same worktree with RED → GREEN and rerun the plan's verification commands. Record Minor findings you do not fix, with the reason, in the owner record.
3. Relay reviewer questions that only the user can answer through Plannotator, using the Inbox for non-blocking questions. Do not repeat them in chat.
4. Request re-review from the same reviewer with the updated revision and evidence. Repeat until findings are resolved, or report the blocker.

Stop only for the conditions listed in implementation-nowly: destructive or security-sensitive actions, external side effects that need approval, material scope expansion or user-only input, or a plan defect that leaves every path a guess.

## 4. Verdict and return

Record in the owner record: route, actual reviewer and model, reviewed revision, findings with resolution, re-review result, final verdict, actual-screen evidence and remaining unverified behavior.

**Then return to implementation-nowly, [Domain model check](../implementation-nowly/SKILL.md#3-domain-model-check)**, which runs the domain model check before the PR, passing the verdict and review evidence for the PR description. If the review is blocked, report the blocker instead of creating the PR.
