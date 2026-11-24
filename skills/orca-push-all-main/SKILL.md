---
name: orca-push-all-main
description: Use when pushing main for all Orca projects.
---

# Push main for all Orca projects

Use when explicitly asked to push main across Orca's registered projects. Creating this skill does not authorize a push.

For an explicit implementation and release task, use dedicated owned worktrees and [planning-nowly](../planning-nowly/SKILL.md) → implementation-nowly → review-nowly, then apply the [main-merge release policy](../implementation-nowly/references/main-release-policy.md). That explicit task can authorize scoped commits, PRs, normal merges and existing production releases. The push-only procedure below remains unchanged for push-only requests; its allowlist, identity, exact destination, secret and data protections apply to both routes.

The allowlist is a plain-text file, `~/.config/orca-main-sync/allowlist.txt`, shared by `orca-pull-all-main` and `orca-push-all-main`. It holds one registered Orca project name per line, exactly as `repo list` shows it; blank lines and lines starting with `#` are ignored. For example:

```text
# ~/.config/orca-main-sync/allowlist.txt
example-app
example-api
```

If the file is missing, unreadable or lists no names, stop and ask the user which projects to include. Never fall back to all registered projects. Match the registered name and verify repository identity before acting. Exclude every other registration; do not automatically add newly registered projects. Change the allowlist only on explicit user direction.

1. Load `orca-cli`, resolve its executable, and load its version-matched guide. List all projects on the current host using `ORCA repo list --json`; apply the allowlist without hardcoding paths or project counts. If a paired environment is explicitly requested, run Git on that same host using documented facilities; report a blocker if this is not possible.
2. Account for every registered project; report projects outside the allowlist as excluded without Git operations. Skip non-Git, inaccessible, duplicate physical checkouts, non-root paths, dirty checkouts, detached HEAD, branches other than main, ongoing Git operations, and projects whose safety cannot be verified. Inspect status, current branch, worktree list, operation state, and origin push destination; failures must not be interpreted as clean. Never commit, switch branch, stash, reset, force push, or change a remote. Report duplicate projects with a reference to their original checkout's outcome.
3. For each eligible project, fetch the exact `refs/heads/main` from the same destination that an explicit `git push origin` would use. If origin has multiple push URLs, has a different fetch destination, or its actual push destination cannot be unambiguously fetched and verified, skip and report why; do not assume the fetch URL is the push URL. Do not create a missing remote main. Treat failed network/authentication checks as failures; never rely on stale tracking refs.
4. Compare the freshly fetched remote commit and local main. If equal, report already current. If remote main is an ancestor of local main, inspect and report all outgoing commits and their destination before pushing. If the remote is ahead or histories diverge, skip; never force push or implicitly pull. If the user has not explicitly authorized pushing all identified outgoing commits, get approval before pushing. Recheck clean status, branch, HEAD, and push destination immediately before the push; if changed, skip. Push only the exact inspected commit to `refs/heads/main` with a normal non-force push, handling rejection safely. Never fall back to another branch or remote.
5. Read back the exact push destination's `refs/heads/main` with `git ls-remote` and verify it matches the commit pushed; a successful push command alone is not verification. Report each project as pushed with old and new SHA, already current, skipped with reason, or failed with error, and summarize counts. If verification is unavailable or the remote changes again, report it honestly rather than claiming success. Continue other projects after individual errors.
