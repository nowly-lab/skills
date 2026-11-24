---
name: demo-nowly
description: Use when a product's pull request is open after implementation-nowly and review-nowly and it changes a screen, so its demo video must be recorded and attached to the PR before the merge; also when asked for a デモ動画 or 動作動画 of a PR, a video for Apple App Review notes or a sprint review, or to find or download the videos already attached to a release's or sprint's PRs.
---

# Demo videos for pull requests

> **For nowly-lab members.** This skill uses the MCP servers in [nowly-lab/mcp](https://github.com/nowly-lab/mcp), a private repository: `npx -y -p github:nowly-lab/mcp ...` works only for a GitHub account with access to it.

A demo video here is a take driven by a Maestro flow, recorded on this Mac, edited in OpenScreen and attached to the pull request as a comment. The pull request is where the video is kept. App Review notes and sprint reviews reuse those videos and don't record them again.

It follows the chain planning-nowly → implementation-nowly → review-nowly → PR: implementation-nowly calls it once the PR exists, with the PR number and the product, for any app with a screen. It ends when the video is attached to the PR (or the PR says why there is none), and implementation-nowly then merges and releases.

This skill covers the route from start to finish. [openscreen-demo](../openscreen-demo/SKILL.md) holds the mechanics (OpenScreen tools, `demo_take.py`, sound through BlackHole, editing, `gh --attach`). If the project has its own tips skill (for example `<product>-tips`) or `AGENTS.md`/`CLAUDE.md`, it holds the product's demo stack: how to start it locally, sign in, seed data and build the app; follow it. Read the openscreen-demo section each step names.

In commands, `<scripts>` is `../openscreen-demo/scripts` resolved against this skill's folder (the scripts run by their path from any directory), `<scratchpad>` is the session scratchpad, `<assets>` is `~/Movies/nowly-assets/<repo>/<branch, with / as ->/` unless the project's tips skill names another folder (a folder that lasts; the scratchpad is cleared on reboot), and commands run from the product's worktree. `-R` is the product's repository, `<owner/repo>`.

## Pick the take type

| The feature… | Take | Recorder |
|---|---|---|
| shows on iOS screens, no sound needed | iOS silent | `demo_take.py ios` (simctl), openscreen-demo "A scripted take with Maestro" → iOS |
| listens or speaks (conversation, voice) | iOS with sound | OpenScreen window take + BlackHole, openscreen-demo "iOS with sound" |
| is a web page | Web | `demo_take.py web` + OpenScreen, openscreen-demo "Web" |
| works only on a device (camera, purchases, push) | none | Say so in the PR and explain why. |

## Steps

1. **Preflight.** `which maestro ffmpeg`, `gh --version` (2.99.0 or later), OpenScreen running with *MCP edits* on. iOS: the dedicated `demo-recorder` simulator (`xcrun simctl list devices | grep demo-recorder`), never the user's own. Sound: `system_profiler SPAudioDataType | grep -A6 "BlackHole 2ch:"` lists it with `Current SampleRate: 48000` (restarting coreaudiod resets other loopback devices' rates; check again after one).
2. **Flow.** Add or update `.maestro/demo/<feature>.yaml` in the product, in the same PR as the feature. Write `label:` (6 words or fewer, Japanese for Japanese apps) on each beat. Sign-in and seeding go in `setup.yaml`, which is never recorded. Wait for visible text before each action that depends on the app's state (`extendedWaitUntil`), never a fixed sleep.
3. **Stack.** Start the product's local real stack exactly as its tips skill or `AGENTS.md` says (or the header comment of its demo flow). Run its build steps from the PR's worktree, so the stack serves the PR's code. It uses a demo or test database (for example a Neon branch), never production. Secrets come from the project's secret manager as its tips skill says, are passed only to `--setup-secret`, and are never printed. If the port is taken by another worktree, use another `--port` and add `--replace 127.0.0.1:<old>=127.0.0.1:<new>`. Don't stop the other process.
4. **Build and install** the app for the simulator into a folder outside the checkout (the tips skill gives the command), then `xcrun simctl install <udid> <app>`.
5. **Record.**
   - iOS silent: `DEMO_TOKEN="$(cat <token file>)" python3 <scripts>/demo_take.py ios <udid> .maestro/demo/<feature>.yaml <out> --setup .maestro/demo/setup.yaml --setup-secret DEMO_TOKEN`. It writes `<out>/take.mp4` and `<out>/take.json`.
   - With sound: confirm the simulator window's title with `listSources` (the window title is the simulator's name, such as `demo-recorder`). Start `python3 <scripts>/cue_player.py --device "BlackHole 2ch" --log <out>/cues.jsonl` in the background, run `DEMO_TOKEN="$(cat <token file>)" python3 <scripts>/demo_take.py setup <udid> .maestro/demo/setup.yaml --setup-secret DEMO_TOKEN`, then `startRecording` (`window: "<title from listSources>"`, `systemAudio: true`), `maestro --udid <udid> test --debug-output <out>/maestro .maestro/demo/<feature>.yaml`, `stopRecording`. Keep the Mac silent while it records. `--debug-output` keeps Maestro's log, which holds the taps for step 7.
   - Run the flow 2 or more times before the recorded take. A flow that passes only some of the time makes a bad take.
6. **Check the take** (openscreen-demo step 5). With sound, `transcribe` should show the spoken line and the app's answer, and nothing before the first line.
7. **Edit** (openscreen-demo step 6). A silent take starts with `createProject` on `<out>/take.mp4` and uses `take.json`'s `edit` (trim, zooms, callouts). A window take is already a project from `stopRecording`. Convert its taps from the Maestro log with `parse_taps` (in `demo_take.py`, screen fractions) to window fractions and pass them to `setPointerTrack`. The window adds a frame around the screen: measure the screen's offset and size in a frame from `getFrames`. With the demo-recorder window at its default size this was `x_win = (28 + x*400) / 456`, `y_win = (80 + y*870) / 972`. Trim Maestro's start-up wait and the tail, and add one callout per beat. Write a callout only for something the video actually shows on screen.
8. **Export** with `quality: "medium"` to `<assets>/<feature>.mp4`, then `getFrames` at each beat. It must stay under 10 MB for a free-plan repository.
9. **Attach to the PR** (openscreen-demo step 8). Push the flow change to the PR branch first. Write `<scratchpad>/pr-video.md` with one line `**Demo:** <what it shows>` (add `(with sound)` and "Turn the sound on." for a sound take), then a blank line and `![](<assets>/<feature>.mp4)` alone in its paragraph. Run `gh pr comment <n> -R <owner/repo> --body-file <scratchpad>/pr-video.md --attach <assets>/<feature>.mp4`. Put the comment URL in the PR body's verification section and in the report.
10. **Record it in marketing-mcp** (`marketing-mcp-tips`, "Assets"), so the video and its OpenScreen project can be listed and reopened for marketing and release posts. Run from the product's worktree:

    ```bash
    npx -y -p github:nowly-lab/mcp marketing-mcp asset add --kind video --title "<what it shows>" --path <assets>/<feature>.mp4 \
      --url <comment URL> --pr <owner/repo>#<n> --pr-title "<PR title>" --openscreen <projectId> --tag リリース告知 --by demo-nowly
    npx -y -p github:nowly-lab/mcp marketing-mcp asset add --kind openscreen --title "OpenScreen <feature>" --openscreen <projectId> \
      --pr <owner/repo>#<n> --pr-title "<PR title>" --by demo-nowly
    ```

    Recording again updates the same asset, so a re-take just runs it again. The page is `/p/<slug>/assets.html` on the live page (the command prints the URL).

Never commit the video. The OpenScreen project and the raw take stay in OpenScreen's project list, the exported file stays in `<assets>`, marketing-mcp records where all three are, and the attached copy on GitHub is the one to share.

## Find and download the videos later

Videos recorded with step 10 are on the product's marketing-mcp 素材 page with their OpenScreen projects (`npx -y -p github:nowly-lab/mcp marketing-mcp asset list --repo <checkout>`, or `list_assets`). Older ones can be imported there as links with `--json` below. The videos also live in the PRs, so for an App Review note, a sprint review or a release summary, collect them from there:

```bash
# list (Markdown) the videos in PRs merged in a sprint
python3 <scripts>/collect_videos.py <owner/repo> --since 2026-11-01 --until 2026-11-14
# also download them as pr<number>-<n>.mp4 with an index.md
python3 <scripts>/collect_videos.py <owner/repo> --since 2026-11-01 --out <folder>
```

`--json` prints them for `marketing-mcp asset import --repo <checkout> <file>`, which records each as a link. It reads each PR's body and comments. `--until` is inclusive and works together with `--out`. `--state all` includes open PRs and matches by creation date. It uses the signed-in `gh`. The attachment URLs of a private repository open only for signed-in members, so give App Review the downloaded file, not the URL.

## Common mistakes

| Symptom | Fix |
|---|---|
| The AI never answers a spoken line | The loopback device is at 44.1 kHz (set it to 48 kHz and reboot the simulator), voice processing is on (pass the DEBUG launch argument that turns it off), or Audio Input isn't BlackHole. |
| The line plays but is half missing | The wrong loopback device was used: use BlackHole 2ch, not Speaker Audio Recorder. |
| Every session check returns 503 | The stack started with a new `--secret-file`. Use the same file every time. |
| Sign-in "could not be saved securely" | The app was built unsigned for the simulator. Sign it ad hoc (the product's `project.yml`). |
| The take opens on the launch screen | Move the launch into `setup.yaml`. |
| The callout claims something is saved or shown that the screen doesn't show | Remove the callout. A callout describes only what is on screen. |
| `unknown flag: --attach` | Upgrade `gh` to 2.99.0 or later. |
| OpenScreen records the wrong window (your own Chrome, an installed app) | `--window-title` and `startRecording`'s `window` match by substring. Use a part of the page title only the demo has, such as the topic or the headline, never a generic word like ホーム or 深掘り. Check `listSources` once if unsure, but quickly: the flow's lead-in is only 9 s. |
| `The recording did not start` and `listSources` shows no displays | The Mac's screen is locked or asleep, so window capture is impossible. Web: `demo_take.py web … --recorder maestro` with a scratch copy of the flow that adds `startRecording`/`stopRecording` (about 3 fps, no browser chrome), then `createProject` on `take.mp4`. iOS takes use simctl and still work. Desktop apps wait for the unlock. |
| The take is a few seconds long and starts after the flow's actions | `next dev` compiled the page during the 9 s lead-in. Wait for visible page text first (`extendedWaitUntil`, 60 s), then the 9 s lead-in. |
| The port changes on every start (sandboxes, CLIs) | Pass the URL as a `MAESTRO_*` environment variable (`url: ${MAESTRO_APP_URL}`); Maestro hands those to the flow. |
| A nav tap fails after the first one | The header is not sticky: after the first tap, use `scrollUntilVisible` instead of tapping the nav again. |
| A tap or wait matches the wrong element | Maestro matches the whole text as a regex: `保存.*` also matches 保存した項目はありません. Use the exact text (`保存\\s*` for a trailing space, written that way inside a double-quoted YAML string) and `index` only when the order is fixed. |
| A setup script is not found | `demo_take.py` runs the setup from a private temporary copy, so `runScript: file.js` breaks. Inline it with `evalScript: ${…}`. |
| The app needs a session but Maestro cannot set environment variables (iOS DEBUG fixtures) | Launch it first with `SIMCTL_CHILD_<NAME>=… xcrun simctl launch`, and leave `launchApp` out of the flow. |
| A Worker refuses sign-up with `INVALID_ORIGIN` | It trusts only its `APP_ORIGIN` (often the Worker port, not Vite's): open the app there. |
| `next dev` left `AGENTS.md` / `tsconfig.json` changes in the worktree | Next.js 16 writes them on start. Restore them before removing the worktree; never commit them with the flow. |

## Products set up

Each product records its demo setup in its own tips skill or `AGENTS.md`/`CLAUDE.md`, and in the header comment of each flow (the exact local commands). A record has: the flows in `.maestro/demo/` (and `setup.yaml` or seed scripts), the command that starts the local stack and its port, the environment variable that carries the URL to the flow (`MAESTRO_*`), and anything the take needs (window size, crop, a fictional seed). For example:

| Product | Flows | Stack |
|---|---|---|
| why-why-talk (`packages/why-why-talk` in nowly-lab/mcp) | `talk-page.yaml` | `node dist/cli.js --topic … --no-open`, URL as `MAESTRO_WHY_URL` |
| diagram-mcp (`packages/diagram-mcp` in nowly-lab/mcp) | `board.yaml` (+ `setup.sh`, `agent.mjs`), `cloudflare.yaml` (+ `cloudflare-setup.mjs`, fictional account) | `node dist/cli.js serve` with a temp `DIAGRAM_MCP_HOME`; slug and URL as `MAESTRO_DGM_PROJECT` / `MAESTRO_DGM_URL` |
| marketing-mcp (`packages/marketing-mcp` in nowly-lab/mcp) | `live-page.yaml` (+ `setup.mjs`, `agent.mjs`; fictional data) | `node dist/cli.js serve` with a temp `MARKETING_MCP_HOME` and port 47961; slug and URL as `MAESTRO_MK_PROJECT` / `MAESTRO_MK_URL`; the take window is 1200×1364, crop y 0.106 |
| meeting-voice-mcp (`packages/meeting-voice-mcp` in nowly-lab/mcp) | `live-and-history.yaml` | `node .maestro/demo/demo-server.ts <dataDir> <out>` (real server and page; capture and speech scripted, no Mac audio: a real Mac-audio take records whatever else plays on the Mac), URL as `MAESTRO_MV_URL`; the window is 1200×1364, so measure crop and taps from frames instead of `demo_take.py pointer` |
| An Electron desktop app | none | needs a real-mouse OpenScreen take (for example with `agent-desktop`) with the screen unlocked |

Products with no screen (libraries, CLIs, documentation) don't need a video.

A product with no `.maestro/demo/` or no local way to sign in: say so in the PR, open an issue in the product's repository for the setup and link it from the PR, and don't block the PR. When you set one up, record it in the product's tips skill or `AGENTS.md` as above.
