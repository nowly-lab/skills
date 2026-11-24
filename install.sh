#!/usr/bin/env bash
# Link every skill in this repository into the global skill folders, so edits here
# take effect everywhere and stay under git.
#
#   ./install.sh              link skills into ~/.claude/skills and ~/.agents/skills
#   ./install.sh --dry-run    show what would change
#   ./install.sh --uninstall  remove only the links that point into this repository
#
# Set SKILL_DIRS to choose other targets, e.g. SKILL_DIRS="$HOME/.claude/skills".
# An existing folder or a link to somewhere else is never replaced: it is reported as a conflict.
set -euo pipefail

repo="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
targets=(${SKILL_DIRS:-"$HOME/.claude/skills" "$HOME/.agents/skills"})
mode=install
case "${1:-}" in
  --dry-run) mode=dry ;;
  --uninstall) mode=uninstall ;;
  "") ;;
  *) echo "usage: $0 [--dry-run|--uninstall]" >&2; exit 2 ;;
esac

run() { if [ "$mode" = dry ]; then echo "would: $*"; else "$@"; fi; }
conflicts=0

for target in "${targets[@]}"; do
  [ "$mode" = uninstall ] || run mkdir -p "$target"
  for skill in "$repo"/skills/*/; do
    skill="${skill%/}"; name="$(basename "$skill")"; link="$target/$name"
    if [ "$mode" = uninstall ]; then
      if [ -L "$link" ] && [ "$(readlink "$link")" = "$skill" ]; then rm "$link"; echo "removed $link"; fi
      continue
    fi
    if [ -L "$link" ]; then
      if [ "$(readlink "$link")" = "$skill" ]; then continue; fi
      echo "conflict: $link -> $(readlink "$link")"; conflicts=$((conflicts + 1)); continue
    fi
    if [ -e "$link" ]; then
      echo "conflict: $link already exists"; conflicts=$((conflicts + 1)); continue
    fi
    run ln -s "$skill" "$link"; [ "$mode" = dry ] || echo "linked $link"
  done
  if [ "$mode" != uninstall ] && [ -d "$target" ]; then
    # Links into this repository whose skill was removed or renamed.
    for link in "$target"/*; do
      [ -L "$link" ] || continue
      dest="$(readlink "$link")"
      case "$dest" in "$repo"/skills/*) [ -e "$dest" ] || { run rm "$link"; echo "removed stale $link"; } ;; esac
    done
  fi
done

if [ "$conflicts" -gt 0 ]; then
  echo "$conflicts conflict(s): remove or rename those entries, then run again." >&2
  exit 1
fi
