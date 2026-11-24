# nowly-lab skills

Agent skills (Claude Code, Codex and other agents that read `SKILL.md`) used at nowly-lab for planning, implementing, reviewing and demoing product work, domain modeling, UI quality and our MCP tools.

## Install

With the [skills CLI](https://github.com/vercel-labs/skills):

```bash
npx skills add nowly-lab/skills -g -s '*' -y
```

This installs every skill globally (`~/.agents/skills`, linked into each agent you use, such as `~/.claude/skills` for Claude Code). Pick skills with `-s <name>` and agents with `-a <agent>` (for example `-a claude-code codex`). Update with `npx skills update -g`, remove with `npx skills remove -g <name>`.

To change a skill, edit it in a clone of this repository, open a pull request, and run `npx skills update -g` after it is merged.

Product-specific knowledge (repository structure, release targets, secrets) does not belong here. Keep it in each product's own `AGENTS.md`/`CLAUDE.md` or in a private `<product>-tips` skill; the skills here read those when present.

## Skills

| Area | Skills |
|---|---|
| Development flow | `planning-nowly` → `implementation-nowly` → `review-nowly` → PR → `demo-nowly` |
| Domain modeling | `scrum-domain-modeling`, `dmmf-implementation` |
| UI and design | `client-ui-design`, `ux-review`, `design-diff`, `react-component-quality`, `appstore-screenshot-marketing` |
| Demo videos | `openscreen-demo`, `demo-nowly` |
| Meetings and thinking | `meeting-hub`, `why-why-talk` |
| MCP tools ([nowly-lab/mcp](https://github.com/nowly-lab/mcp), for nowly-lab members) | `mcp-tips`, `event-storming-mcp-tips`, `knowledge-mcp-tips`, `marketing-mcp-tips`, `meeting-voice-mcp-tips`, `speak-mcp-tips`, `why-why-talk-tips` |
| [Orca](https://github.com/stablyai/orca) | `orca-pull-all-main`, `orca-push-all-main` (these use the `orca-cli` skill that ships with Orca) |

The domain model of the development flow these skills define is in [`docs/domain-model/`](docs/domain-model/index.html) (data in `data/`, pages rendered by `event-storming-mcp`; see `scrum-domain-modeling`).

Some skills use the MCP servers in `nowly-lab/mcp`, a private repository. They are marked "For nowly-lab members" and work only for an account with access to it. This includes `planning-nowly`, `implementation-nowly` and `demo-nowly`, which keep the domain model and demo-video records in those servers.

## License

[MIT](LICENSE). `skills/react-component-quality` includes code from [stablyai/orca](https://github.com/stablyai/orca) under its MIT license; see that skill's `NOTICE`.

## Contributing

Keep skills free of private details: no absolute paths, host names, private repository or product names, secret locations or customer data. Run the check before a commit:

```bash
./scripts/check-public.sh
```

Tests:

```bash
python3 scripts/test_release_policy.py
(cd skills/openscreen-demo/scripts && python3 -m unittest discover -p 'test_*.py')
(cd skills/react-component-quality && node --test scripts/*.test.mjs && node scripts/verify-skill-assets.mjs)
```
