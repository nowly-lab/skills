# Worker spec template

Fill in the angle brackets and write it to a file for `worker-start --spec-file`; pass the short title as `--task-title`. Keep the person's words as they said them.

```text
Request (the person's words, spoken): <the transcript, as said>
Repository: <displayName> (<path>)

How to work: run the planning-nowly → implementation-nowly → review-nowly chain in this
repository's worktree, with its own tips skill (or AGENTS.md / CLAUDE.md) if it has one.
The person gave this request by voice to a coordinator; you never talk to them in a chat.

Questions:
- A short question the person can answer by voice (at most three choices, no picture or
  file needed): orchestration ask to the coordinator, then end your turn. The coordinator
  reads it aloud and replies with the person's words. The coordinator is usually idle,
  waiting for the person's voice, so Orca may answer at once that your coordinator stopped
  without answering and to decide it yourself: do not decide and do not send worker_done.
  End your turn and wait; the person's answer still reaches you, usually within minutes.
- A question that needs pictures, a plan or several decisions: send it to the
  Plannotator Inbox as planning-nowly says, then tell the coordinator with a status message
  (nothing comes back): orca orchestration send --type status --to <your coordinator, as
  your preamble names it> --subject "Inbox" --body "Inbox に質問を送りました: <gist>".
  Continue work that does not depend on it; the answer comes from the Inbox.
- Plans go to the Plannotator Inbox, not through the coordinator.
- If the coordinator tells you it has closed, send every further question to the
  Plannotator Inbox instead of orchestration ask.

Done: worker_done with the PR URL (or why there is none) and a one-sentence result in
plain Japanese the coordinator can read aloud.

Placement: this machine (local), set up on this machine.
```
