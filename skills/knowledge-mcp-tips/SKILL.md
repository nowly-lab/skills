---
name: knowledge-mcp-tips
description: Tips for knowledge-mcp (packages/knowledge-mcp in nowly-lab/mcp), the MCP server that keeps one person's decisions, current views (今こう思っている), knowledge and why-why side branches with sources in a local data folder, and brings them back with spaced-repetition reviews: structure, commands, data folder, how why-why-talk and meetings feed it, release and constraints. Use when working on it, or when recording what the person decided or asking what they think now.
---

# knowledge-mcp tips

> **For nowly-lab members.** This skill uses the MCP servers in [nowly-lab/mcp](https://github.com/nowly-lab/mcp), a private repository: `npx -y -p github:nowly-lab/mcp ...` works only for a GitHub account with access to it.

This is a tips skill: structure, commands and constraints. Repository-wide structure, commands and release are in `mcp-tips`.

## Project and structure

Package `packages/knowledge-mcp` in the repository `nowly-lab/mcp`, created 2026-11-18. Paths below are relative to the package folder in your checkout. Domain model: `packages/knowledge-mcp/docs/domain-model`.

| File | What |
| --- | --- |
| `src/model.ts` | Zod schemas of the data (topics, decisions, views, items, cards, sources), labels, local dates |
| `src/ops.ts` | Pure changes: record a decision, supersede, add knowledge, set a view, confirm, update |
| `src/whywhy.ts` | Reads why-why-talk output (folder, `session.json`, `result.json`) and maps it onto the data |
| `src/recall.ts` / `src/review.ts` | Search, what the person thinks now; spaced repetition (simplified SM-2) and due cards |
| `src/store.ts` | The data folder: lock, versions, history, restore, file modes |
| `src/mcp.ts`, `src/board.ts`, `src/render.ts`, `src/cli.ts` | MCP tools, the read-only page (127.0.0.1:47861), the CLI |
| `src/voice/` (added 2026-11-18, 0.2.0) | Voice review: `session.ts` (`ReviewSession`, `<home>/reviews/<date>-<n>.json`, `affirmed()`, `confirmChange`), `gemini.ts` (brief with today's cards only), `tools.ts` (Gemini functions), `server.ts` (page server, random port), `meeting-guard.ts`, `start.ts` (`openReview`) |
| `web/review.ts`, `web/review.html`, `scripts/build-web.mjs` | The voice review page (bundles `../live-voice/web/*`), built into `web/dist` |

## Data folder (personal data)

`~/.knowledge-mcp` (override with `KNOWLEDGE_MCP_HOME`): `knowledge.json` (current data), `history.jsonl` + `blobs/` (versions), `sources/` (a copy of every imported file), `locks/`, `reviews/` (voice review sessions: cards asked, the person's words, grades; never audio). Folder 0700, files 0600.

- Never copy this data into a repository, an issue, a PR, a Slack message or an external service unless the person asks. Tests and fixtures are fictional.
- knowledge-mcp calls no AI and no network, except the voice review the person starts (Gemini Live, below). Summaries are written by the agent (`set_view`) and stay 「AI のまとめ・未確認」 until the person confirms them (`confirm`).
- Git only if the person opts in: point `KNOWLEDGE_MCP_HOME` at a private folder they manage. knowledge-mcp never commits or pushes.

## Commands

```sh
claude mcp add -s user knowledge -- npx -y -p github:nowly-lab/mcp knowledge-mcp mcp   # register once per user
npx -y -p github:nowly-lab/mcp knowledge-mcp import <why-why output folder | session.json | result.json>...
npx -y -p github:nowly-lab/mcp knowledge-mcp due            # today's cards
npx -y -p github:nowly-lab/mcp knowledge-mcp think <topic>  # what the person thinks, with sources
npx -y -p github:nowly-lab/mcp knowledge-mcp                # the page
npx -y -p github:nowly-lab/mcp knowledge-mcp review         # end-of-day voice review (Gemini Live)
node scripts/review-live-smoke.ts                           # real Gemini, fictional cards, no sound (a few cents)
node scripts/review-e2e.mjs <screenshot-dir>                # Chrome, fake Live socket, --mute-audio
cd packages/knowledge-mcp && npm test && npm run typecheck
```

## How things feed it

| From | What the agent does |
| --- | --- |
| why-why-talk result | `ingest_why_why` on the output folder (the `files:` line of the result). Directions → decisions (by gemini / agent, unconfirmed), reasons → their why, rejected / open questions / facts / searches → knowledge, dug whys → reasons, undug or rejected branches and unchecked questions → side branches (脇道). Decisions and undug branches get cards. Re-import is safe: only changes update, confirmed or edited entries are kept. Put a question into an existing topic with `topics: {q1: "<title>"}`. |
| A meeting (`meeting-hub`) | The person states a decision: `record_decision` with `by: person` for their own words, `source: {kind: meeting, title, ref: <meeting id>, quote}`, and `supersedes` when it replaces an earlier one. |
| Plannotator Inbox answers, hearing sheets, chat | `record_decision` / `add_knowledge` with `source.kind` `inbox` (ref: message id) or `hearing` (ref: file path) or `note`. Record only what the person decided, not your suggestion. |

Answering "what does the person think about X": `what_they_think`, then cite the sources and say which lines are 「AI のまとめ・未確認」. Writing a summary: `set_view` with `basedOn` ids and a `changeNote`; ask the person to confirm.

Reviews: `due_reviews` → ask the prompt (not the answer) in the chat or the Inbox → the person answers → `record_review` with their words and a grade (again / hard / good / easy). If the answer differs from what is stored, ask whether they think differently now; if so, record the new decision with `supersedes`.

## Voice review (「今日の復習」)

The review is meant for once at the end of the day, by voice (a knowledge-mcp page, Gemini Live like why-why-talk without the MCP). When the person says 「今日の復習」 / 「定着しよう」: call `open_review` and open the URL in Orca's browser (it opens nothing when there are no cards, no key, or while meeting-voice-mcp records; say so). On the page Gemini asks each card, grades it (`record_answer`), tells the stored answer when it differs, and proposes a changed view (`propose_change`); the record changes only after the person's own yes: the server needs Gemini's read-back of the proposed sentence, then a person utterance made only of yes words (はい、そうです…; no negation, no でも, not 「いいです」「大丈夫です」), or the 「この内容で記録」 button. Only the asked card can be graded, and a session is held by one process (`reviews/<id>.owner`). The new decision is `by: gemini`, confirmed, source `review` quoting the person; the old one stays superseded. `open_review {wait: true}` returns the summary (answered, changed views, next due dates).

- 「止めよう」/「再開しよう」 pause and resume (the mic keeps streaming so 「再開しよう」 is heard; tools are refused while paused). 「次」「パス」 skip (stays due), 「もう一回」, 「今日はここまで」. Page gone 60 s → suspended; the same day continues from the next unanswered card. `next_card` is refused until the card is recorded unless `skip: true`.
- What goes out: voice, both transcripts and today's cards (question, stored answer, decision and reason only) go to Google. The key is `GEMINI_API_KEY` (with a free-tier key Google may use the data: tell the person before the first review); `KNOWLEDGE_MCP_GEMINI_KEY` takes a separate paid key instead. Settings `KNOWLEDGE_MCP_LIVE_MODEL` (`gemini-3.8-live`), `KNOWLEDGE_MCP_VOICE` (`Kore`).
- Measured 2026-11-18: two fictional cards, about 1.5 minutes, 19,477 tokens. Gemini sometimes skips `record_answer` before `propose_change` or `next_card`; the server refuses `next_card` until the card is recorded, and a confirmed change counts as answered.
- A loose paraphrase in the read-back is refused (fails safe: Gemini asks again). Watch for it in voice trials.
- Never play Gemini's voice yourself on a machine where meetings are recorded: the person tries it; automated checks use `--mute-audio` or no audio output.

## Release

Merge to `main` (see `mcp-tips`), then `npx -y -p github:nowly-lab/mcp#main knowledge-mcp --help` from an empty folder. Restart Claude Code sessions (or `/mcp` reconnect) to pick up a new version.

## Constraints

- The MCP server talks over stdio; the page listens on 127.0.0.1 only, is read-only and checks the Host header.
- A broken `knowledge.json` is never overwritten: fix it by hand or `restore_version`.
- v1 does not import meeting-voice transcripts or Inbox answers automatically; the agent records them. Automatic importers are future work.
