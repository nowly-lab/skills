---
name: orca-pull-all-main
description: Use when pulling main for all Orca projects.
---

# Pull main for all Orca projects

Use when asked to update or pull main across Orca's registered project repositories. Creating this skill alone does not authorize running it.

The allowlist is a plain-text file, `~/.config/orca-main-sync/allowlist.txt`, shared by `orca-pull-all-main` and `orca-push-all-main`. It holds one registered Orca project name per line, exactly as `repo list` shows it; blank lines and lines starting with `#` are ignored. For example:

```text
# ~/.config/orca-main-sync/allowlist.txt
example-app
example-api
```

If the file is missing, unreadable or lists no names, stop and ask the user which projects to include. Never fall back to all registered projects. Match the registered name and verify repository identity before acting. Exclude every other registration; do not automatically add newly registered projects. Change the allowlist only on explicit user direction.

1. Load `orca-cli`, resolve its executable, and load its version-matched guide. Run `ORCA repo list --json` on the current host; apply the allowlist without hardcoding paths or project counts. If the user explicitly specifies a paired environment, target it only with documented environment support and execute Git on that same host; if that cannot be done safely, report the blocker. Never mistake local paths for remote paths.
2. Enumerate every returned entry, reporting projects outside the allowlist as excluded without Git operations, and reporting non-Git folders and missing or inaccessible paths as skipped. Deduplicate identical physical checkouts, but retain all project names in the report. Do not traverse or update child worktrees or switch branches. For each Git project path confirm it is the checkout root (`git rev-parse --show-toplevel`) and inspect `git status --porcelain`, current branch, `git worktree list --porcelain`, ongoing merge/rebase/cherry-pick state, and origin configuration. Treat status command failures as failures, not clean trees. Skip dirty trees, detached HEAD, branches other than main, ongoing Git operations, and paths that cannot be verified. Do not stash, reset, clean, checkout or force changes.
3. For each eligible checkout, fetch the exact `refs/heads/main` from origin and verify fetch succeeded and that branch exists; no fallback to a stale remote-tracking ref or another remote/branch. Compare local HEAD to the freshly fetched commit. If equal, report already current. If local HEAD is an ancestor of the fetched commit, recheck branch and cleanliness immediately before applying `git merge --ff-only` to that exact fetched commit. If local main is ahead or diverged, skip and report the situation; do not rebase or merge non-fast-forward histories. Do not run a pull in a different checked-out branch or update a worktree that is actively changing. Handle authentication or network failures per repository and continue with others.
4. Verify the resulting branch, HEAD and clean status against the exact successfully fetched commit. Report one outcome for every registered project: updated (old/new short SHA), already current, skipped with reason, or failed with error. Treat a successful fetch without a verified checkout update as not updated. Summarize totals and flag upstream changes after the fetch as unverified. Never claim all projects succeeded if any were skipped or failed.
