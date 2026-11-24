#!/usr/bin/env bash
# Fail when a tracked file holds something that must not be public.
# Generic patterns live here. Private names (products, repositories, hosts) live outside
# the repository, one extended regex per line, in ${PRIVATE_TERMS:-~/.config/nowly-skills/private-terms.txt}.
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

generic='/Users/[A-Za-z]|/home/[a-z]+/|\.ts\.net|op://|BEGIN [A-Z ]*PRIVATE KEY|(sk|pk)_(live|test)_[A-Za-z0-9]{8}|ghp_[A-Za-z0-9]{20}|xox[bp]-[0-9]|AKIA[0-9A-Z]{16}|\b(10\.[0-9]{1,3}|192\.168|172\.(1[6-9]|2[0-9]|3[01]))\.[0-9]{1,3}\.[0-9]{1,3}\b'
status=0

files=$( (git ls-files; git ls-files --others --exclude-standard) | grep -v '^scripts/check-public.sh$' | while read -r f; do [ -f "$f" ] && echo "$f"; done)
if grep -nIE "$generic" $files 2>/dev/null; then status=1; fi

terms="${PRIVATE_TERMS:-$HOME/.config/nowly-skills/private-terms.txt}"
if [ -f "$terms" ]; then
  pattern=$(grep -vE '^\s*(#|$)' "$terms" | paste -sd'|' -)
  if [ -n "$pattern" ] && grep -nIiE "$pattern" $files 2>/dev/null; then status=1; fi
else
  echo "note: $terms not found; checked generic patterns only" >&2
fi

[ $status -eq 0 ] && echo "check-public: ok"
exit $status
