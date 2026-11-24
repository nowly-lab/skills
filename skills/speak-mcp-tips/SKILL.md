---
name: speak-mcp-tips
description: Tips for speak-mcp (packages/speak-mcp in nowly-lab/mcp), the local read-aloud MCP that speaks Japanese on this Mac with Irodori-TTS (v4.1-Small-MF on the Mac GPU) through one daemon per Mac, falls back to macOS say, and reports each spoken sentence to meeting-voice-mcp as AI（読み上げ）; structure, setup, commands, measured latency, real checks and constraints. Use when working on it or when reading why-why-talk's questions aloud in a meeting.
---

# speak-mcp tips

> **For nowly-lab members.** This skill uses the MCP servers in [nowly-lab/mcp](https://github.com/nowly-lab/mcp), a private repository: `npx -y -p github:nowly-lab/mcp ...` works only for a GitHub account with access to it.

This is a tips skill: structure, commands and constraints. Repository-wide rules (npx from GitHub, root dependency union, release = merge to main) are in `mcp-tips`. How a meeting uses it is in `meeting-hub` and `why-why-talk`.

## Project and structure

Package `packages/speak-mcp` in the repository `nowly-lab/mcp`, added 2026-11-18. Paths below are relative to the package folder.

| Path | Role |
| --- | --- |
| `src/cli.ts` | `mcp`, `serve`, `setup`, `warm`, `say "<text>" [--out f.wav] [--wait]`, `status`, `stop` |
| `src/daemon.ts` | `startSpeakDaemon`: one per Mac (`server.lock`, `server.json` 0600 with port and token), 127.0.0.1, Host check, refuses `Origin`; FIFO queue (one voice per Mac); sentence pipeline (synthesize n+1 while n plays); `say` fallback while the engine is not installed / loading / failed; idle exit (`SPEAK_MCP_IDLE_MINUTES`, 30). Routes `/api/speak`, `/api/stop` (stop speaking), `/api/warm`, `/api/status`, `/api/shutdown` |
| `src/engine/setup.ts` | `ensureEngineInstalled`: clones Aratako/Irodori-TTS-Server at `ce06bebd0ed2` into `~/.speak-mcp/engine`, `uv sync --extra cpu --frozen` |
| `src/engine/irodori.ts`, `src/engine/control.ts` | Starts `uv run --no-sync python -m irodori_openai_tts` on a random port with a random API key, waits for `/health` `runtime.loaded`; `IRODORI_VOICES_DIR` = the package's `voices/`; `synthesize` posts `/v1/audio/speech` with `voice: "doukyuusei"`, `irodori: {caption, seed: 42}` (`DEFAULT_VOICE`) |
| `src/report.ts` | Reports each spoken sentence (Irodori or `say`) to meeting-voice-mcp `/api/bridge/ai-speech` `{source: "speak-mcp"}`; best effort |
| `src/mcp/server.ts`, `src/client.ts` | stdio MCP (`speak`, `stop_speaking`, `warm_up`, `speak_status`); starts the daemon detached when `server.json` is stale |
| `voices/doukyuusei.wav` | The fixed voice's reference clip (3.84 s, 369 KB, shipped in the package and in `files`) |
| `docs/domain-model/` | Domain model |

## Engine choice (measured 2026-11-18, Apple M5, 32 GB)

- **Irodori-TTS v4.1-Small-MF** (MeanFlow, 4 steps) fp32 on MPS: a 20–24 char question in 1.06–1.37 s warm (first after load 2.2 s; first through the daemon after load 5.2 s), audio 3.9–4.3 s. Load 12–32 s. Downloads: model 3.06 GB + codec 0.43 GB (Hugging Face cache), Python env 1.3 GB. Two steps instead of four is not faster.
- Rejected: Quantized int4 (`aten::_weight_int4pack_mm` has no CPU kernel on Mac), Quantized int8 on CPU (8–12 s; torchao cannot use MPS), bf16 (refused on MPS: "requires CUDA or XPU"), GGUF/CrispASR (only v3 500M, Metal unproven).
- Voice (changed 2026-11-19, nowly-lab/mcp#31; the fixed-clip mechanism is from nowly-lab/mcp#30): every sentence is synthesized against one reference clip, `voices/doukyuusei.wav`, by voice id `doukyuusei`, with the caption it was made from 「高校生くらいの若い女性の声。やわらかく落ち着いた自然な高さの声。丁寧でおっとりした話し方。仲のいい同級生に話すような、やさしい口調。」 and seed 42. The person picked it from four VoiceDesign candidates; it replaced the earlier voice `yasagure-se` (seed 11), whose clip was removed. Caption-only VoiceDesign (`no_ref`, used before #30) made a different voice every sentence: WavLM speaker similarity (`microsoft/wavlm-base-plus-sv`) between sentences was 0.871–0.959 (mean 0.908) with `no_ref` and 0.944–0.978 (mean 0.960) with the fixed clip. `SPEAK_MCP_CAPTION` still opts into `no_ref`. To change the voice, make candidates with VoiceDesign (`no_ref`, a caption and a seed, each saying 「候補Nです。」 first), let the person choose, and ship **the chosen candidate's own audio** with the 「候補Nです。」 label cut off at the silence after it: regenerating with the same caption and seed does not give the same voice, because `no_ref` also varies with the text (for doukyuusei, regenerated clips were 0.82–0.92 similar to the picked candidate and sentences read against the best of them only 0.86 on average; the cut candidate gave 0.96). Then replace the clip and `DEFAULT_VOICE`. The clip itself must come from VoiceDesign: never a recording of a real person (the model card's ethical restrictions). Weights and code: MIT.
- Gemini transcribed three synthesized questions back exactly, so the Japanese is intelligible.

## Commands

```sh
cd packages/speak-mcp && npm test && npm run typecheck   # fakes only: no Python, model or sound
node dist/cli.js setup && node dist/cli.js warm
node dist/cli.js say "なぜ、月末に注文が集中するのでしょうか。" --out <scratchpad>/q.wav   # firstAudioMs, no sound
```

Isolate a test daemon with `SPEAK_MCP_HOME=<scratchpad>/speak` (its `engine/` can be a symlink to an installed engine plus an `installed.json` with the pinned commit). Stop it with `speak-mcp stop`. The engine runs behind a stdin watchdog (`watchdogScript` in `src/engine/irodori.ts`): when the daemon dies, even by SIGKILL, the engine exits (checked 2026-11-18: gone within 1 s).

## Real checks

- Live label check (2026-11-18, nowly-lab/mcp leftovers PR): an isolated meeting-voice-mcp (`MEETING_VOICE_MCP_DATA_DIR` in the scratchpad with `models/` and `bin/` cloned from `~/.meeting-voice-mcp` by `cp -cR`, Parakeet, `sources: ["system"]`) recorded while an isolated speak daemon (`MEETING_VOICE_MCP_DATA_DIR` pointing at it) read 「なぜ、月末に注文が集中するのでしょうか。」: the utterance was stored as `speaker: "ai"`, `aiSource: "speak-mcp"` (delivered as `AI（読み上げ）`). Repeat it this way, never against a real meeting.

- Before playing sound, check `meeting_voice recording_status`: while a meeting records, use `--out` (or the `out` argument) and say so.
- First audio, not total time, is what matters in a meeting; `speak` returns at first audio by default.

## Constraints

- macOS on Apple Silicon for the GPU path; elsewhere it runs on CPU (slow) and plays nothing (`afplay` is macOS only).
- `uv` must be installed (its standalone installer puts it in `~/.local/bin/uv`).
- Keep the engine and models out of the repository; no secrets in code, tests or commits.
