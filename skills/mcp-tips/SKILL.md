---
name: mcp-tips
description: "Tips for nowly-lab/mcp, the repository that holds every nowly-lab MCP server as its own package (event-storming-mcp, meeting-voice-mcp, why-why-talk, diagram-mcp, metric-tree-mcp, marketing-mcp, knowledge-mcp, speak-mcp): layout, how npx runs a package from GitHub, dependency rules, commands, release and constraints. Use when working on any of those packages or adding a new MCP."
---

# nowly-lab/mcp tips

> **For nowly-lab members.** This skill uses the MCP servers in [nowly-lab/mcp](https://github.com/nowly-lab/mcp), a private repository: `npx -y -p github:nowly-lab/mcp ...` works only for a GitHub account with access to it.

This is a tips skill: structure, commands and constraints. Package details are in `event-storming-mcp-tips`, `why-why-talk-tips`, `meeting-voice-mcp-tips`, `speak-mcp-tips`, `marketing-mcp-tips` and `knowledge-mcp-tips`. diagram-mcp and metric-tree-mcp have no tips skill of their own; each has a README.

## Project and structure

Repository [`nowly-lab/mcp`](https://github.com/nowly-lab/mcp) (MIT). Running a package with `npx -y -p github:nowly-lab/mcp …` fetches it from GitHub; if npx cannot reach the repository (a fork kept private, a proxy), log in with `gh auth login` first. Clone it anywhere (`<checkout>` below). One npm workspace per MCP under `packages/`:

| Package | Bin | Was |
| --- | --- | --- |
| `packages/event-storming-mcp` | `event-storming-mcp` | `nowly-lab/event-storming-mcp` (archived) |
| `packages/meeting-voice-mcp` | `meeting-voice-mcp` (+ the `meeting-voice` Claude Code plugin in `plugin/`) | `nowly-lab/meeting-voice-mcp` (archived) |
| `packages/why-why-talk` | `why-why-talk` | `nowly-lab/why-why-talk` (archived) |
| `packages/diagram-mcp` | `diagram-mcp` | new (ER and network diagrams) |
| `packages/metric-tree-mcp` | `metric-tree-mcp` | new (KPI trees: actual vs expected, bottleneck path, `next_question`; nowly-lab/mcp#16) |
| `packages/marketing-mcp` | `marketing-mcp` | new (each product's marketing strategy and ad campaigns in its `docs/marketing`; see `marketing-mcp-tips`) |
| `packages/knowledge-mcp` | `knowledge-mcp` | new (one person's decisions, current views and knowledge, why-why side branches, spaced-repetition reviews; data only in `~/.knowledge-mcp`) |
| `packages/speak-mcp` | `speak-mcp` | new (Japanese read-aloud with local Irodori-TTS, one daemon per Mac; see `speak-mcp-tips`) |
| `packages/live-voice` | (none: a library) | new 2026-11-18: the Gemini Live pieces shared by why-why-talk and knowledge-mcp's voice review (single-use tokens, base Live settings; the browser's Live client, reconnect, mic, player). Moved out of why-why-talk, not copied |

The three old repositories came in with their full history through `git subtree add` (2026-11-17, nowly-lab/mcp#1). Their dated design specs under `docs/superpowers/specs` keep the old commands; they are historical records.

## Running a package

```sh
npx -y -p github:nowly-lab/mcp <bin> [args]           # main
npx -y -p github:nowly-lab/mcp#<branch> <bin> [args]  # a branch
npx -y -p git+file://<checkout>#<sha> <bin> [args]    # a local commit, before pushing
```

`npx -p github:` installs **only the root package's dependencies** and runs the root `prepare`, which builds every workspace. So:

- the root `package.json` lists every bin (`packages/<name>/dist/cli.js`) and the **union** of all packages' runtime dependencies;
- each dependency has one version across packages (zod 4.6.7, `@modelcontextprotocol/sdk` 1.32.2 as of 2026-11-17). When a package needs a new dependency or version, change the package and the root together.

Without the union in the root, a package's import fails with `ERR_MODULE_NOT_FOUND` (checked with a two-package probe on 2026-11-17).

Sharing code between packages: put it in a library package such as `packages/live-voice` (no bin, built with tsc to `dist` with `.d.ts`). Server code imports it by relative path to its built `dist` (`../../../live-voice/dist/index.js` from `src/<dir>/`, the same depth from `dist/<dir>/`); a page bundles its `web/*.ts` sources with esbuild. `npm install` (also the one `npx -p github:` runs) starts every workspace's `prepare` in parallel, alphabetically, before the root `prepare` builds them in list order, so each user runs `node ../live-voice/scripts/ensure-built.mjs` first in `build`/`prepare`/`pretest`/`typecheck` (it builds once, under a lock).

## Commands

```sh
npm install           # at the root: installs and builds every package
npm test              # every package
npm run typecheck
cd packages/<name> && npm test    # one package
node packages/event-storming-mcp/dist/cli.js check packages/<name>/docs/domain-model --repo packages/<name>
```

Each package keeps its own domain model in `packages/<name>/docs/domain-model`.

## Adding an MCP

1. `packages/<name>/` with its own `package.json` (bin, scripts `build`/`prepare`/`test`/`typecheck`), README, tests and `docs/domain-model`.
2. Add the bin and any new runtime dependencies to the root `package.json`, **add `packages/<name>` to the root `workspaces` list** (it is an explicit list since 2026-11-18, `packages/live-voice` first; a package missing from it is never installed or built, and npx fails with `ERR_MODULE_NOT_FOUND`), then a row to the root README.
3. Check `npx -y -p git+file://<checkout>#<sha> <bin> --help` and an MCP `tools/list` before the PR.

## Release

- Release = merge to `main`; no npm publish. Verify after the merge with `npx -y -p github:nowly-lab/mcp <bin> --help` (`npm cache clean --force` if npx serves an old copy).
- The plugin marketplace is the root `.claude-plugin/marketplace.json` (name `nowly-lab-mcp`): `/plugin marketplace add nowly-lab/mcp`, `/plugin install meeting-voice@nowly-lab-mcp`. Bump `packages/meeting-voice-mcp/plugin/.claude-plugin/plugin.json` when the plugin changes.

## Constraints

- Keep out of the repository: any secret, account id, customer data or product schema in code, tests, fixtures or commits. Fixtures are fictional.
- Servers bind 127.0.0.1 only and check the Host header.
