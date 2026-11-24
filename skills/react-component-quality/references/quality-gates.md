# Quality Gates

## Safe Workflow

```bash
node "$SKILL_ROOT/scripts/inspect-project.mjs" --project "$TARGET" --format markdown
node "$SKILL_ROOT/scripts/setup-react-quality.mjs" --project "$TARGET" --format markdown
# Review creates, updates, conflicts, profiles, and target diff.
node "$SKILL_ROOT/scripts/setup-react-quality.mjs" --project "$TARGET" --apply --format markdown
node "$SKILL_ROOT/scripts/setup-react-quality.mjs" --project "$TARGET" --verify --format markdown
```

Setup is additive, target-bounded, and dry-run by default. `--apply` refuses unsafe roots, ambiguous managers/config, unmanaged destinations, local edits to managed files, and max-lines baseline growth. Apply reports verification as `not run`. Explicit `--verify` first validates schema, canonical snapshot hash, every managed file hash/path, exact package scripts and AGENTS markers, and a drift-free setup plan; no gate runs if integrity fails. It then exits nonzero when any gate fails and zero only when all pass.

**Network/cache warning:** setup `--verify` runs the pinned React Doctor gate through the target manager's `npx --yes`, `pnpm dlx`, `yarn dlx`, or `bunx`. That explicit, user-authorized verification may contact a registry and download or cache `react-doctor@0.9.1`. If no installer/network attempt is allowed, do not use setup `--verify`: use the read-only audit with `--run-tools`, run target-local gates, and report React Doctor as unavailable/manual rather than claiming full verification.

Installed package scripts are exact:

| Script | Command |
| --- | --- |
| `create:component` | `node .react-quality/scripts/scaffold-component.mjs` |
| `quality:react` | `oxlint --config .react-quality/config/oxlint-react-quality.json .` |
| `quality:react:changed` | `node .react-quality/scripts/check-changed-code-quality.mjs` |
| `quality:react-doctor:changed` | `node .react-quality/scripts/check-react-doctor-changed.mjs` |
| `quality:max-lines` | `node .react-quality/scripts/check-max-lines-ratchet.mjs` |

The changed-code gate resolves a PR base/merge-base, includes changed and untracked JS/TS files, then runs target-local Oxlint on those files. The React Doctor gate pins `0.9.1`, scopes to changed lines, includes untracked files, disables telemetry/supply-chain work, and blocks errors. Supply an explicit base after `--` in CI or when the inferred upstream is unsuitable.

The max-lines budgets are 300 code lines for `.ts`, 400 for `.tsx`, 600 for `.mjs`, and 800 for tests; blank/comment-only lines are excluded. Existing tracked suppressions are grandfathered in a baseline that may only shrink. `quality:max-lines -- --prune` removes stale entries and refuses to add new bypasses.

## Read-only Audit

```bash
node "$SKILL_ROOT/scripts/audit-react-quality.mjs" --project "$TARGET" --format markdown
node "$SKILL_ROOT/scripts/audit-react-quality.mjs" --project "$TARGET" --base <ref> --run-tools --format markdown
```

Audit installs nothing. `--run-tools` executes only integrity-checked, target-local installed tools; it never invokes installer-backed React Doctor and emits the exact manual command instead. Without it, audit reports static policy/config/architecture evidence. Recognized words, filenames, and script keys are leads: inspect whether policy is affirmative and scripts truly enforce the claim. Separate failures from heuristic boundary recommendations, then run target-native tests, typecheck, build, CI-equivalent commands, and relevant E2E.

Inspection records existing lint/test configs, PR templates, and categorized E2E/build tooling. Audit emits a stable source/test census. Exact known resource-without-cleanup patterns, literal style colors, and known alternative icon-package imports are deterministic evidence; dynamic cleanup, arbitrary utility colors, and other unprovable cases remain review candidates.

## Orca Mechanisms 2–5: Policy vs Implementation

| Mechanism | Orca executable/CI evidence | Root `AGENTS.md` truth |
| --- | --- | --- |
| 2. `pnpm create:component` scaffold | not implemented in Orca | not documented |
| 3. custom Oxlint rules | implemented by configs/plugins/tests and package scripts | no concrete custom-rule names or commands |
| 4. changed-files React Doctor | implemented in scripts/package and required by PR CI | not documented |
| 5. max-lines ratchet | implemented in script/baseline/package and required by PR CI | partial policy only: forbids new disables/bump; omits baseline, command, pruning, CI behavior |

Do not infer documentation from implementation or enforcement from prose. There is a deliberate governance ambiguity in Orca: root policy says never add a max-lines disable, while the executable ratchet retains a reviewer-approved baseline of historical suppressions and permits only shrinkage. Report both; do not describe the baseline as permission for new exceptions. Links are in [Orca source inventory](orca-source-inventory.md#quality-gate-and-policy-evidence).
