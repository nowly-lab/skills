---
name: event-storming-mcp-tips
description: Tips for event-storming-mcp (packages/event-storming-mcp in nowly-lab/mcp, formerly nowly-lab/event-storming-mcp), the tool that validates and renders scrum-domain-modeling models (init/validate/render/check) and runs the live board for meetings (one local server, an MCP server agents edit through, inline editing and history): structure, commands, MCP setup, release and constraints.
---

# event-storming-mcp tips

> **For nowly-lab members.** This skill uses the MCP servers in [nowly-lab/mcp](https://github.com/nowly-lab/mcp), a private repository: `npx -y -p github:nowly-lab/mcp ...` works only for a GitHub account with access to it.

This is a tips skill: project structure, commands and operational constraints. How to model is in `scrum-domain-modeling`.

## Project and structure

Package `packages/event-storming-mcp` in the repository `nowly-lab/mcp` (MIT; the vendored ELK bundle is EPL-2.0); moved there with its full history on 2026-11-17 from `nowly-lab/event-storming-mcp` (created 2026-11-16), which is archived. Paths below are relative to the package folder in your checkout. Repository-wide structure, commands and release: `mcp-tips`. It is the only maintained copy of the model validator and renderer; the `scrum-domain-modeling` skill calls it with `npx`. Do not keep a copy of the engine in another repository or skill.

| Path | Role |
| --- | --- |
| `model/domain-model.mjs`, `model/lib/{validate,render,layout,pan}.mjs`, `model/vendor/` | The model engine (plain JS). `validateModel` is the full check; `validateStructure` the problems that make data unusable. Changing `render.mjs` output changes every product's committed pages: re-render them in the same change |
| `docs/data-format.md` | The data format (the skill's `references/data-format.md` points here) |
| `src/cli.ts`, `src/commands.ts` | CLI: `serve`, `add`, `mcp`, `status`, `stop`, and the model commands |
| `src/store/registry.ts` | `ProjectRegistry`: watched repositories in `watched-repos.json` (main checkout + model folder + MCP write target); worktrees found each time with `git worktree list --porcelain`; one version and history per checkout (main keeps the project slug, a worktree is `<slug>--<6 chars>`) |
| `src/store/history.ts` | `HistoryStore`: `history.jsonl` per project, `blobs/<sha256>` |
| `src/store/model-store.ts` | `ModelStore`: per-project serial writes, base-version conflicts, two-level validation, pages written only when valid, `ingest` for outside edits |
| `src/store/watch.ts` | Polls the data files (300 ms) and calls `ingest` |
| `src/model/ops.ts`, `src/model/diff.ts` | `OpSchema`/`applyOps` (cascade delete, `previewRemoveNode`), `diffModels`/`summaryText` |
| `src/server/http.ts`, `src/server/daemon.ts` | 127.0.0.1 server: page API, SSE, `/mcp`; `server.json` and `ensureServer` |
| `src/mcp/tools.ts`, `src/mcp/http.ts`, `src/mcp/stdio.ts` | The 12 MCP tools, Streamable HTTP sessions, the stdio relay |
| `web/` | The board shell: pages in an iframe; the big picture gets the inline editor (`board.ts`), edit state (`edit-state.ts`), history (`history.ts`) |
| `scripts/compare-renders.mjs`, `scripts/e2e-browser.mjs` | Byte comparison with committed pages; Chrome check |
| `docs/domain-model/` | The tool's own domain model |

## Commands

```sh
npx -y -p github:nowly-lab/mcp event-storming-mcp init <model-dir>
npx -y -p github:nowly-lab/mcp event-storming-mcp validate <model-dir>
npx -y -p github:nowly-lab/mcp event-storming-mcp render <model-dir>
npx -y -p github:nowly-lab/mcp event-storming-mcp check <model-dir> --repo <product-root>
npx -y -p github:nowly-lab/mcp event-storming-mcp add <model-dir>   # event-storming-mcp add: register a model folder
npx -y -p github:nowly-lab/mcp event-storming-mcp                   # start the server (once per data folder) and open the board
npx -y -p github:nowly-lab/mcp event-storming-mcp status
npx -y -p github:nowly-lab/mcp event-storming-mcp stop
```

In the checkout: `npm install`, `npm test`, `npm run typecheck`, `npm run build`, `node dist/cli.js check docs/domain-model --repo .`, `node scripts/compare-renders.mjs <model-dir>...`, `node scripts/e2e-browser.mjs <url> <slug> <model-dir> <out>`. Offline, or to try a branch: `node <checkout>/dist/cli.js <command>`; `npx -y -p github:nowly-lab/mcp#<branch> event-storming-mcp` fetches a branch; `npm cache clean --force` forces a fresh fetch.

## MCP

- Claude Code: `claude mcp add event-storming -- npx -y -p github:nowly-lab/mcp event-storming-mcp mcp`. Codex: `[mcp_servers.event-storming] command = "npx", args = ["-y", "-p", "github:nowly-lab/mcp", "event-storming-mcp", "mcp"]`.
- Tools: `list_projects`, `register_project`, `unregister_project`, `get_model`, `find_nodes`, `focus_nodes`, `apply_changes`, `validate`, `list_history`, `get_version`, `restore_version`, `open_page`. Always pass the version from `get_model` as `base_version`; `conflict` means read again and redo.
- Each change is recorded with the MCP client's name (Claude Code shows as "Claude" on the board).
- 図の上で直す: people drag empty canvas to move the board (pinch or Ctrl/⌘ + wheel zooms; the generated pages do the same, from `model/lib/pan.mjs`), double-click a sticky to edit its text, add and delete stickies, drag from a sticky's handle to draw an arrow and delete a selected arrow. Type and domain changes, glossary, workflows and contexts are edited through MCP.
- 探す (nowly-lab/mcp#11, 2026-11-17): on the live board's big picture, `/` or ⌘F opens search over sticky text, kind, domain and phase name (width, case and hiragana/katakana ignored; space-separated terms all match). Hits are framed and the rest dimmed; Enter / Shift+Enter or the result list moves to a sticky; Esc clears; the search survives live redraws. Live board only: the generated `big-picture.html` has no search. The project list is resized by dragging its edge (double-click resets; kept per browser).
- 一覧 (nowly-lab/mcp#12, 2026-11-17): `L` or 「付箋の一覧」 opens a list of every sticky on the right of the live big picture, by phase in time order (by domain without phases), then by kind with counts; groups fold, kind chips filter, a click moves to the sticky. While searching it shows only the hits (one search). Closed by default; open/closed kept per browser. Use it to see what there is before searching.
- 幅 (nowly-lab/mcp#13, 2026-11-17): the search box (right edge), the sticky list column (left edge) and the project list are each resized by dragging their edge (←/→ on the handle; double-click resets; kept per browser). Search results grow to the room on the right and stay inside the window; long sticky texts wrap in the results and the list. When the main area is too narrow for the board (520px) and the column, the column floats over the board.
- 寄る (2026-11-19, asked for in a meeting: 「話題になっている、もしくは追加したところに focus して zoom in」): when stickies are added or changed by an agent, a file or another tab, or an agent calls `focus_nodes` (ids; no version, no history, unknown ids refused), the live big picture scrolls and zooms in (up to 100%) so they all fit; focused ones pulse in purple. 「話題に追従」 in the bar turns it off per browser (on by default). It holds still while editing and for 10 s after a hand moved the board, showing 「見る」 instead. The zoom is set through the page's own 等倍 and − buttons (1.25 steps), so the generated pages did not change. Check: `scripts/e2e-focus.mjs` on a copy in an isolated data folder.

## Data

- Projects (nowly-lab/mcp#7 and #8, 2026-11-17): the sidebar is repository → main (primary) → worktrees, built from `watched-repos.json` and `git worktree list`; no Orca call at runtime. A removed worktree disappears by itself (an open board moves to main); a new worktree with a model folder appears without registering. `register_project` / CLI `add <model-dir>` adds the repository (any checkout is folded into its main) and makes that checkout the MCP write target (✎); `unregister_project` / CLI `remove <name|slug|folder>` stops watching it, keeping its history. MCP writes by slug or name go to the write target (falls back to main when it is gone), by a worktree key to that worktree; the board writes to the checkout it shows and can move the write target. First fill from Orca, once: `node packages/event-storming-mcp/scripts/import-orca.mjs [--data-dir DIR] [--dry-run]`, run from a checkout of nowly-lab/mcp (Node refuses to strip types under the npx cache's node_modules); it adds the Orca repositories visible on this machine that have a model folder.
- `~/.event-storming-mcp` (`EVENT_STORMING_MCP_DATA_DIR`): `server.json`, `watched-repos.json`, `projects/<key>/` (version and `history.jsonl` per checkout), `blobs/`. No database (same shape as the Plannotator Inbox, decided 2026-11-16). History is not pruned yet.
- 書きかけ (a draft): a version with rule violations is saved and marked red on the board, and the committed HTML waits until the model validates. Who finishes a draft after a meeting is an open hotspot.
- 文字起こし: getting meeting conversation to the agent is a separate MCP (not built yet); it is expected to call `apply_changes`.

## Release

- Release = merge to `main`; no npm publish. Users and agents run `npx -y -p github:nowly-lab/mcp event-storming-mcp`.
- Before changing the renderer, run `scripts/compare-renders.mjs` over every product model you maintain and re-render the changed ones in their repositories. Re-render them after the tool's PR merges: `npx … check` runs `main`, so pages rendered from an unmerged branch fail it. Push the re-render to each repository the way that repository takes changes (a PR, or `main` directly where its rules allow; `orca-push-all-main` reads which repositories allow it). An out-of-date local checkout shows stale pages: pull before judging.

## Constraints

- Keep out of the repository (see `mcp-tips`): any secret, account id, customer data or product model data in code, tests or commits (tests use the fictional fixture under `test/model/fixtures`).
- Server binds 127.0.0.1 only, checks Host, requires the page nonce for writes and refuses `/mcp` with an `Origin` header. Sharing the board is by screen share; there is no login.
- The generated pages still name the old skill script in their header comment, generator meta and the index page's footer; changing that changes every product's pages, so it waits for a planned renderer change and re-render.
