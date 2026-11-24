---
name: why-why-talk-tips
description: "Tips for why-why-talk (packages/why-why-talk in nowly-lab/mcp, formerly nowly-lab/why-why-talk and why-why-mcp), the CLI that opens a local page where the person talks freely, picks questions from the talk and attached files, deep-dives them by voice with Gemini Live and sends per-question directions back to the agent: structure, commands, real Gemini checks, release and constraints."
---

# why-why-talk tips

> **For nowly-lab members.** This skill uses the MCP servers in [nowly-lab/mcp](https://github.com/nowly-lab/mcp), a private repository: `npx -y -p github:nowly-lab/mcp ...` works only for a GitHub account with access to it.

This is a tips skill: project structure, commands and operational constraints. It does not define the work process. The procedure agents follow when they use the tool is the `why-why-talk` skill.

## Project and structure

Package `packages/why-why-talk` in the repository `nowly-lab/mcp` (see `mcp-tips`); moved there with its full history on 2026-11-17 from `nowly-lab/why-why-talk` (created 2026-11-13 as `why-why-mcp`), which is archived. Paths below are relative to the package folder in your checkout. Repository-wide structure, commands and release: `mcp-tips`.

| Path | Role |
| --- | --- |
| `src/cli.ts` | `main`: arguments (`--topic` optional, `--attach` repeatable, `--agent-questions`, `--voice agent\|gemini`), subcommand `resume <id\|out> [--force]` (restores from `session.json`), `GEMINI_API_KEY` check, attachment summaries before the page opens, out dir, browser open, exit codes 0 sent / 1 cancelled / 2 failure / 3 suspended and stopped (SIGINT/SIGTERM, `WHY_WHY_SUSPENDED_TTL`) |
| `src/talk/interviewer.ts` | Agent voice (added 2026-11-18): `nextTurn` asks the text model (`gemini-3.1-flash-lite`, `WHY_WHY_INTERVIEWER_MODEL`) for tree tool calls + the next `ask` as JSON (one argument object listing every tool's argument names: a bare `args: {type: object}` made the model return `{}`), validates calls with `ToolArgs`, trims the ask (2 sentences / 120 chars; a resume recap 「前回は…」 + question, 180) |
| `src/talk/server.ts` | `startTalkServer`: 127.0.0.1 only, Host check, nonce on every POST, SSE lease (60 s grace), responds before settling the outcome |
| `src/talk/session.ts` | `TalkSession`: phase (`free_talk` / `questions` / `deep_dive`), free talk ordered by segment `order`, file summaries, question list (≤10), dives (`q1`… roots, `advance` guarded by `questionReady`, person skip = partial), `roleBy` (question-triggered answerer), transcript (4 s fragment merge), per-question drafts, single outcome, serialized redacted saves |
| `src/talk/text-model.ts`, `src/talk/attachments.ts` | `geminiTextModel` (`gemini-3.8-flash`, `WHY_WHY_TEXT_MODEL`): transcribe WAV segments, summarize files, split questions (JSON); `TextModelError` → HTTP 502. Accepted files: text, Markdown, PDF, images, 10 MB |
| `src/talk/tools.ts` | Gemini function declarations (`add_whys`, `add_fact`, `update_branch`, `propose_direction` with `question_id`, `switch_role` with `by`, `next_question`) and their Zod args |
| `src/talk/gemini.ts` | System instruction (five whys per branch, no praise, role section), Live config (functions + `googleSearch`), `mintToken` (single-use, v1beta, `lockAdditionalFields: []`) |
| `src/talk/result.ts` | Result Markdown/JSON |
| `src/analysis.ts`, `src/model.ts`, `src/redact.ts`, `src/render/` | Why-tree engine kept from the MCP version; `TARGET_DEPTH` (5), `depthOf`, `shallowLeaves`, `openBelowTarget` |
| `web/answers.ts` | `readGrounding` and the answer collector that records what the person asked Gemini as the answerer |
| `web/free-talk.ts`, `web/recorder.ts`, `web/files.ts`, `web/questions.ts` | Free talk (segmenter, WAV, ordered posts, failed segments block the next step until 再試行/捨てる), drop check, question list (serialized `createLatestSaver`, list locked while start/send settle), dive list and per-question trees |
| `web/` | Page: three phases in `main.ts`/`index.html`; `queue.ts` (ordered transcript posts), `ui.ts`, `main.ts` |
| `../live-voice/` (shared, moved here 2026-11-18) | `src/token.ts` `mintLiveToken` and `src/config.ts` `baseLiveConfig` (used by `src/talk/gemini.ts`); `web/live.ts` (one connect at a time, resumption, tool replies on the asking connection), `web/reconnect.ts` (`nextConnection`, `createRetryBudget`: 1→30 s backoff, 6 tries, reset only after a connection stayed up 3 s, then つなぎ直す), `web/audio.ts` + `web/audio-worklet.js` (mic at device rate, downsampled to 16 kHz; contexts started inside the click for Safari), `web/pcm.ts`, `web/mic.ts`, `web/mic-input.ts`. Their tests are in `packages/live-voice/test` |
| `scripts/build-web.mjs`, `scripts/live-smoke.ts` | Page bundle; real Gemini check |
| `docs/domain-model/` | Domain model (JSON + pages) |

## Commands

```sh
npm install                # runs prepare: tsc + esbuild page bundle
npm test                   # node --test on .ts sources (Node ≥ 22.18)
npm run typecheck          # server and web
npm run build
node scripts/live-smoke.ts # real Gemini Live: tool call, Japanese, resumption, shallow-leaf rule, switch_role, search grounding, a question put to Gemini, next_question on a ready question (a few cents)
node scripts/text-smoke.ts # real text model: Japanese transcription (macOS say), PDF/Markdown summaries, question split (a cent or two)
npx -y -p github:nowly-lab/mcp event-storming-mcp check docs/domain-model --repo .
```

Browser check with a fake microphone: `playwright-core` with system Chrome (`channel: "chrome"`), flags `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream`, permission `microphone`; drive `dist/cli.js --no-open`. Attach the process exit listener before anything awaits, or a fast exit is missed. For free talk, feed Japanese speech with `--use-file-for-fake-audio-capture=<16 kHz WAV>` (make it with `say -v Kyoko` + `afconvert`, add ~3 s of silence so it splits). To test failure paths without real calls, pass a fake `TextModel` through `main(..., { text })`, and mock the Gemini Live WebSocket with Playwright `page.routeWebSocket(/generativelanguage\.googleapis\.com/)` (answer `setup` with `setupComplete`, then send `serverContent` / `toolCall` messages) while the real page and session server run (2026-11-16).

## Agents (MCP, added 2026-11-17)

- `why-why-talk mcp` (`src/mcp/server.ts`): stdio MCP server, tools `list_talks`, `get_talk`, `add_question`, `start_dive`, `answer`, `suspend_talk`, `resume_talk`, `take_talk`, `add_whys`, `add_fact`, `update_branch`, `propose_direction` and the mode/search tools. Register with `claude mcp add why-why -- npx -y -p github:nowly-lab/mcp why-why-talk mcp`.
- Each talk writes `~/.why-why-talk/talks/<id>.json` (`WHY_WHY_HOME`; dir 0700, file 0600) with its URL and a 64-hex agent token (`src/talk/registry.ts`), removed at the end; a dead pid's file is dropped when listed. Agent routes are `/api/agent/{state,question,start-dive,tool}` with `Authorization: Bearer <token>`, separate from the page's nonce.
- `--agent-questions` (added 2026-11-17, for `meeting-hub`): `TalkSession.questionsBy = "agent"`; the talk starts in `questions` with an empty list, refuses `/api/questions/split` (before any model call) and `/api/free-talk`, and the page hides the free-talk step, もう一度分ける and もう少し話して and shows a note that Claude adds questions. `get_talk` returns `questionsBy`. Without the flag (`"split"`) nothing changed.
- 次のなぜ (added 2026-11-17): `src/next-whys.ts` `nextWhys` (dependency-free, imported by the page too) lists each question's open whys: the root while it has no answer, or a candidate/digging tip under no stopped branch and shallower than five. An agent's `add_whys` marks a candidate parent digging and returns `next` for that question; `get_talk` has `nextWhys`; the tree shows 「次のなぜ: なぜ「…」？」 under each open tip.
- Agent changes push `event: changed` on `/api/lease`; the page reloads (`onAgentChange`) and tells a connected Gemini with a quiet `sendText`. What an agent adds carries `by: "agent"` (「Claude」 badge, （Claude） in the result). Questions in all: 20 (`MAX_TOTAL_QUESTIONS`; the text model's first list stays at 10).
- 「Gemini の声を消す」 (`#voice-mute`) silences the voice and stops listening: no mic audio goes to Gemini and its answer tools are refused (nowly-lab/mcp#18).
- Modes and control phrases (nowly-lab/mcp#18): 「原因を分析したい」「構造で見て」→ 構造モード (`set_mode`, `set_structure`, `record_metric`, `propose_bottleneck`), 「なぜなぜに戻して」, 「検索して」「調べて」 (`wait_for_search`, `post_answer` as Claude / Codex), 「役割を交代」/「役割を戻して」, 「止めよう」 (pause, not finish), 「再開しよう」. Detected on the server from Gemini Live's transcript of the person.
- Browser check: `scripts/agent-e2e.mjs` (needs `playwright-core` and the MCP SDK; both resolve from the root `node_modules` since meeting-voice-mcp has playwright-core). Since agent voice became the default with `--agent-questions` (nowly-lab/mcp#25), its `start_dive (default) starts Gemini's voice` step is stale (seen 2026-11-18); every step before it passes.

## Agent voice, owners, suspend and resume (added 2026-11-18)

- `voiceBy`: `agent` (default with `--agent-questions`) opens no Gemini Live; `answer` (`/api/agent/answer-turn`) applies the text interviewer's calls and returns the next `ask`, which Claude reads with speak-mcp (`speak-mcp-tips`). `personWords` drops the `AI（…）` lines (as meeting-voice-mcp delivers or quotes them) and the participants' labels from what Claude passes; nothing left, or ≥ 80 % like the last ask, is ignored (`ignored: "echo"`); control phrases act first and return `control`. The answer is written to the transcript only after the interviewer answered (a 502 retry records it once); answer turns run one at a time. In agent voice the page, `transcript.md` and `result.md` label the interviewer's lines `AI（読み上げ）` and the legend has no role-swap row. The model also tends to call `update_branch` on the question root (refused, harmless).
- Owner: `CLAUDE_CODE_SESSION_ID` of the starting session, sent by the MCP as `x-why-why-session`; another session's change gets 403 `{error: "owner"}` unless `force`; `take_talk` moves it. MCP `pick` prefers the caller's own talk.
- Registry entries carry `owner`, `state` (`active`/`suspended`), `voiceBy`, `recordPath`; a dead pid's entry stays listed (`running: false`) only while suspended. Resuming a talk suspends every other running talk on this Mac, under the registry lock (`withRegistryLock`, `<WHY_WHY_HOME>/talks/.lock`): two resumes at once leave one active talk, and two `why-why-talk resume <id>` commands start a stopped talk once (the second exits 2).
- `suspend_talk` / 「ここで中断」「いったん中断」 (「止めよう」 stays a pause); a suspended talk refuses `answer`, Gemini's tools and tokens (409) but keeps Claude's board tools. `session.json` has `recordVersion: 2`; `TalkSession.fromRecord` refuses newer records and reads version-less ones.
- Measured 2026-11-18 (real interviewer + Irodori on an Apple Silicon Mac): `answer` 1.7–4.0 s, then speak first audio 1.6–2.9 s (longer first sentences synthesize slower), so answer → first audio about 3–7 s before Claude's own thinking time.

## Runtime limits

- No page within `WHY_WHY_FIRST_CONNECT_MS` (default 600000) → exit 1 `画面が開かれなかった`; a non-numeric value exits 2.
- Tab gone for 60 s → a Gemini-voice talk is suspended (no longer cancelled); an agent-voice talk continues without a page. SIGINT/SIGTERM → exit 3 (suspended, resumable). Unwritable `--out` → exit 2.
- Safari and Firefox audio paths are written but were only browser-tested in Chrome (2026-11-13).

## Gemini

- Model `gemini-3.8-live` (GA). Japanese works; language is set by the system instruction (`RESPOND IN JAPANESE…`). Default voice `Kore`; change it with `WHY_WHY_VOICE`.
- Voice trial 2026-11-14 (nowly-lab/why-why-talk#2): Gemini went silent for 5 minutes after its second question, with no transcription of the person and no tool call, then resumed by re-asking; the cause is not established. Auto language detection also turned quiet Japanese into Spanish/English fragments. Since then the input transcription is pinned with `inputAudioTranscription.languageCodes: ["ja-JP"]` (the Live API accepts it; whether it fixes mishearing needs a voice trial), the page reconnects when the person keeps talking but nothing comes back for 15 s (`createLinkWatch`), offers 「Gemini に呼びかけ直す」 after 15 s of Gemini silence, and logs diagnostics to `<out>/events.jsonl`. Read that file first when a talk stalls.
- Key: `GEMINI_API_KEY` from the environment (a Google AI Studio key; keep it in your secret manager, never in the repository). A free-tier key lets Google use the conversation: tell the person before their first talk.
- Google Search grounding works together with function declarations on `gemini-3.8-live` (checked 2026-11-14). `groundingMetadata` arrived with `webSearchQueries` but no `groundingChunks` (source pages), so the page shows the search words when no source page comes back.
- The model will invent a shallow-leaf reason unless told not to; the brief says the reason must be one the person gave (seen in live-smoke, 2026-11-14).
- Live trials 2026-11-16: Gemini drafted a finished question and then waited; `propose_direction` on a ready question now returns "call next_question now", after which it moved on in 3 of 4 runs (variable; 次の問いへ is the fallback). After answering a question put to it, Gemini sometimes kept interviewing without `switch_role(to=interviewer)`; the page switches back at the end of an answered turn and a successful tree tool counts as being back.
- Role switch (nowly-lab/why-why-talk#5, 2026-11-16): the system instruction is locked into the single-use token and stays with a resumed session, so switching roles by text in the same session left 「今の役割: 聞き手」 and Gemini kept asking why (reproduced in live-smoke). A switch the person asks for (button, or 交代して / 戻して by voice once Gemini's reply ends, 10 s cap) now starts a new Live session from a token minted with `roleSwitch: true`: the new role plus the whole conversation (`conversationSoFar`, `HISTORY_LIMIT` 100,000 chars, oldest part dropped with a note). A question-triggered switch (`by=question`) stays on the connection. A ~102k-char instruction minted, connected and answered from the carried talk.
- Live refuses to resume a session while the old client is still connected (close 1008 "session is already connected to an existing client"; six times in a row in a 2026-11-16 talk). `live-voice/web/live.ts` retires the old connection before opening the next one.
- Gemini Live told to "never reply" still returned a few seconds of audio every turn, and with automatic activity detection off returned no input transcription at all (2026-11-16); that is why free talk uses the text model instead of Live.
- The SDK (3.3.0) warns that ephemeral tokens are v1alpha-only; v1beta works, as the official docs say. A token with `liveConnectConstraints` ignores client config unless `lockAdditionalFields: []`; the page relies on that to pass its session-resumption handle.

## Release

- Release = merge to `main`; no npm publish (decided 2026-11-13). Users and agents run `npx -y -p github:nowly-lab/mcp why-why-talk`; `npm cache clean --force` forces a fresh fetch.
- The `why-why-talk` skill lives in the nowly-lab/skills repository (`skills/why-why-talk/`) and in the package (`packages/why-why-talk/skills/why-why-talk/`); keep them identical.

## Constraints

- Keep out of the repository (see `mcp-tips`): any secret, account id or customer data in code, tests, fixtures, docs or commits.
- The API key never reaches the browser; only single-use tokens do.
- A voice trial by the person is the actual-screen check; automated tests and the fake-mic E2E do not prove conversation quality.

## Demo video

PR demo videos follow `demo-nowly`. Flow: `.maestro/demo/talk-page.yaml`, against `node dist/cli.js --topic … --no-open`, the printed URL as `MAESTRO_WHY_URL`; record by a unique part of the topic, since the title is `深掘り: <topic>`. The flow's header has the exact local commands (verified 2026-11-16, nowly-lab/why-why-talk#3).
