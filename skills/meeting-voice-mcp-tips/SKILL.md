---
name: meeting-voice-mcp-tips
description: Tips for meeting-voice-mcp (packages/meeting-voice-mcp in nowly-lab/mcp, formerly nowly-lab/meeting-voice-mcp), the local server that records the meeting mic and Mac audio, transcribes them (Parakeet on the Mac or Gemini Live) and delivers silence-separated segments into the Claude Code session that started recording, through its own Claude Code plugin; structure, commands, data folder, real checks, release and constraints. Use when working on it or when using it with event-storming-mcp in a meeting.
---

# meeting-voice-mcp tips

> **For nowly-lab members.** This skill uses the MCP servers in [nowly-lab/mcp](https://github.com/nowly-lab/mcp), a private repository: `npx -y -p github:nowly-lab/mcp ...` works only for a GitHub account with access to it.

This is a tips skill: project structure, commands and operational constraints. It does not define the work process.

## Project and structure

Package `packages/meeting-voice-mcp` in the repository `nowly-lab/mcp` (see `mcp-tips`); moved there with its full history on 2026-11-17 from `nowly-lab/meeting-voice-mcp` (created 2026-11-16), which is being archived. Paths below are relative to the package folder in your checkout. Repository-wide structure, commands and release: `mcp-tips`. Never commit secrets, account IDs, meeting data or a real person's voice; tests use `say -v Kyoko` speech.

| Path | Role |
| --- | --- |
| `src/cli.ts` | `main`: serve (default), `mcp`, `status`, `stop`, `doctor`, `install-plugin`, `ensure` |
| `src/server.ts` | `startServer`: one server per data folder through `acquireServerLock` (an `O_EXLOCK` kernel lock on `server.lock`, freed when the process exits); 127.0.0.1 only, Host check; `/mcp` and `/api/bridge/*`, `/api/control/*` refuse `Origin` and need the `server.json` token; page APIs need the page nonce and only read |
| `src/mcp/tools.ts`, `src/mcp/stdio.ts` | The 10 MCP tools (Zod-parsed, results wrapped as `untrusted_meeting_data`); stdio relay that starts the server in the background |
| `src/meeting/recorder.ts` | `Recorder`: one meeting at a time, capture → engine → segmenter → delivery queue. One audio cursor per side: gaps are padded with silence, a side quiet for more than 300 ms is fed silence (process taps send nothing while no app plays), and a late chunk behind the cursor is trimmed or dropped and recorded in `audioGaps`, shown as 音声の欠け. The silence clock starts when capture is ready; an unexpected helper exit finishes the meeting as interrupted. WAV while recording, AAC after stop, `recoverInterrupted` at start |
| `src/segment/segmenter.ts` | Soniox defaults to `delivery: "utterance"` (each final utterance sent at once, `max_endpoint_delay_ms` 1500, batched while the session is busy; nowly-lab/mcp#17); `delivery: "silence"` (Parakeet/Gemini default): both sides silent `silence_seconds` (default 2, nowly-lab/mcp#14) → segment; 60 s forced; waits up to 5 s for text only while Soniox still owes it (`settled` ends the wait); drops the mic copy of speaker audio (≥80% same text within 3 s) |
| `src/bridge/bridge.ts` | `DeliveryBridge`: claim/ack/release, 30 s claim timeout → resend with `再送（届いていない可能性）`, fixed delivery wording (`formatDelivery`) |
| `src/capture/*`, `native/*.swift` | Swift helper ported from an earlier meeting-recorder app (mic + Core Audio process tap), built with `xcrun swiftc` into `<data>/bin/` on first use, keyed by source hash |
| `src/speech/*` | Parakeet worker thread (sherpa-onnx-node 2.0.1, one recognizer, one Silero VAD per side); Gemini Live (`gemini-3.8-live`, one connection per side, AUDIO + `maxOutputTokens: 1`, session resumption, reconnect with buffered audio) |
| `web/` | Live and history pages (esbuild bundle in `web/dist`) |
| `plugin/` | Claude Code plugin `meeting-voice` (hooks module): `meeting_voice` tool relayed with the session id, 1 s long poll, `$.prompt.submit` when idle, `$.session.append` while a turn runs |
| `src/bridge/bridge.ts` `AI_LABEL` / `TTS_LABEL` | The meeting AI's lines: `/api/bridge/ai-speech` from why-why-talk (Gemini Live) → `AI（Gemini・why-why）`; from speak-mcp (Claude's read-aloud voice, `aiSource: "speak-mcp"`, added 2026-11-18) → `AI（読み上げ）`. Both are `speaker: "ai"`; their mic copy is dropped |
| `docs/domain-model/` | Domain model (scrum-domain-modeling data + pages) |
| `docs/superpowers/specs/` | Design v1 and the UI reference images |

## Commands

```sh
npm install
npm run typecheck
npm test                                  # 81 tests; browser tests use the system Chrome
MEETING_VOICE_REAL_MODEL=1 MEETING_VOICE_MODEL_DIR="<folder with parakeet-tdt-ctc-0.6b-ja-int8>" npm test -- test/parakeet.test.ts
MEETING_VOICE_REAL_GEMINI=1 npm test -- test/gemini-live.test.ts   # GEMINI_API_KEY from the environment
claude plugin validate plugin
npx -y -p github:nowly-lab/mcp event-storming-mcp check docs/domain-model --repo .
```

For real-model tests, point `MEETING_VOICE_MODEL_DIR` at a copy of the pinned Parakeet files you already have (for example the one a first real run downloads into the data folder's `models/`), or copy it (`cp -c`) into an isolated data folder with a `verified.json`.

## Running it for real

- `npx -y -p github:nowly-lab/mcp meeting-voice-mcp` (or `node src/cli.ts` in a checkout) starts the server and opens the page; `doctor` checks macOS, the helper build, mic permission, the model, `GEMINI_API_KEY` and the plugin.
- Isolate test data with `MEETING_VOICE_MCP_DATA_DIR=<scratchpad>/e2e-data` and `MEETING_VOICE_BROWSER=none`. The default data folder is `~/.meeting-voice-mcp/`.
- To try the plugin in a session without installing it, copy `plugin/hooks/{register,delivery}.ts` into a dev mod folder, point `dataDir` and the start command at the isolated data folder, and let the session hot-reload it. The `meeting_voice` tool then appears as `mcp__<mod>__meeting_voice`.
- Permissions go to the terminal app that started the server: Microphone, and Screen & System Audio Recording for Mac audio. Without the latter, recording continues with the mic only (`sources.system: "denied"`).
- Some inputs (seen with a wireless USB mic, 2026-11-16) deliver only zero samples, also with the original helper. If the mic side stays silent, check with speech played through the speakers (Mac audio side), or pick another input.

## Use with event-storming-mcp in a meeting

Two separate tools, with Claude in between. Start recording with instructions such as 「届いた区切りから event-storming-mcp のプロジェクト X の全体像を直す」. Segments arrive as new messages; Claude reads them as data and edits the board through event-storming-mcp's MCP. Show the board on the shared screen. Its page, not this one, is what people look at.

## Verified behavior (2026-11-16, PR evidence)

- Real end-to-end on a Mac: speech played through the speakers was transcribed as 相手側 by Parakeet and delivered to the Claude Code session that started recording. Segment 1 arrived as a new prompt while idle; segment 2 was appended into the running turn. Audio was saved as m4a and played back on the history page.
- Gemini Live spike: with AUDIO responses the model answers at each turn end unless `maxOutputTokens: 1`. TEXT responses are refused (close 1007). Turning off automatic activity detection returns no transcript.
- `afconvert -d aac -b 64000` fails for 16 kHz mono; the default bitrate works.
- Real Gemini runs: 13 min (and 4 min after the review fixes) on one connection, no goAway, no errors, no text lost. Transcription lags, so the tail of one phrase can land in the next utterance (README says so). A real goAway/resumption has not been observed; reconnection is covered by fake-connection tests only. In isolation, `audioStreamEnd` made no difference (0.2 s either way).
- Independent review (Codex, 4 rounds) record: the PR description; findings F1–F7, R2-1, R2-2 and R3-1 were all fixed test-first.

## Release

No npm publish: a merge to `main` is the release (`npx -y -p github:nowly-lab/mcp meeting-voice-mcp`). After merging, check `npx -y -p github:nowly-lab/mcp#main meeting-voice-mcp --version` from a clean folder and `doctor`. The plugin is installed from the repository root's `.claude-plugin/marketplace.json` (marketplace `nowly-lab-mcp`): `/plugin marketplace add nowly-lab/mcp`, then `/plugin install meeting-voice@nowly-lab-mcp`.

## Constraints

- macOS 14.6+ on Apple Silicon (the process tap API), Node 22.18+, Xcode command line tools.
- Claude Code 2.1.287+ interactive for the plugin (hooks modules); `claude -p` has none: use `get_new_utterances`.
- With a free-tier Gemini key, Google may use the audio. Say so before using Gemini in a meeting with other people.
- Soniox (the default engine when `SONIOX_API_KEY` is set) needs that key in the server's environment: take it from your secret manager and restart the server with it, or recording falls back to Parakeet (`engineNote` says why).
