# nowly-lab skills

Agent skills (Claude Code, Codex and other agents that read `SKILL.md`) used at nowly-lab for planning, implementing, reviewing and demoing product work, domain modeling, UI quality and our MCP tools.

## Install

```bash
git clone git@github.com:nowly-lab/skills.git ~/workspaces/nowly-lab/skills
~/workspaces/nowly-lab/skills/install.sh
```

`install.sh` links each folder in `skills/` into `~/.claude/skills` and `~/.agents/skills`. Because they are links, an edit in this checkout takes effect at once and shows up in `git diff`. To update on another machine, `git pull`; run `install.sh` again after skills are added or removed. It never replaces an existing folder or a link to somewhere else; it reports them as conflicts. `./install.sh --dry-run` shows what it would do, `./install.sh --uninstall` removes its links.

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

Some skills use the MCP servers in `nowly-lab/mcp`, a private repository. They are marked "For nowly-lab members" and work only for an account with access to it. This includes `planning-nowly`, `implementation-nowly` and `demo-nowly`, which keep the domain model and demo-video records in those servers.

## License

[MIT](LICENSE). `skills/react-component-quality` includes code from [stablyai/orca](https://github.com/stablyai/orca) under its MIT license; see that skill's `NOTICE`.

## Contributing

Keep skills free of private details: no absolute paths, host names, private repository or product names, secret locations or customer data. Run the check before a commit:

```bash
./scripts/check-public.sh
```
