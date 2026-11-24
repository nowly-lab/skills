#!/usr/bin/env python3
"""List, and optionally download, the demo videos attached to a repository's pull requests.

    collect_videos.py <owner/repo> --since 2026-11-01 [--until 2026-11-15] [--state merged|all] [--out DIR] [--json]

Videos are found in each pull request's body and comments as GitHub attachment URLs
(https://github.com/user-attachments/assets/<id>). Without --out it prints a Markdown list;
with --out it also downloads each video as <out>/pr<number>-<n>.mp4 and writes <out>/index.md.
With --json it prints [{repo, number, title, url, videos}] instead, for
`marketing-mcp asset import --repo <checkout> <file>` (records the videos as links, never downloads).
Uses the signed-in `gh` (its token is passed in a header, never printed).
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ATTACHMENT = re.compile(r"https://github\.com/user-attachments/assets/[0-9a-f-]+")


def video_urls(texts):
    """Attachment URLs in order of first appearance, without repeats."""
    seen = []
    for text in texts:
        for url in ATTACHMENT.findall(text or ""):
            if url not in seen:
                seen.append(url)
    return seen


def search_query(since, until, state):
    field = "merged" if state == "merged" else "created"
    return f"{field}:{since}..{until}" if until else f"{field}:>={since}"


def gh_json(*args):
    return json.loads(subprocess.run(["gh", *args], check=True, capture_output=True, text=True).stdout)


def pull_requests(repo, since, until, state):
    found = gh_json("pr", "list", "-R", repo, "--state", state, "--limit", "200",
                    "--search", search_query(since, until, state), "--json", "number")
    for number in sorted(item["number"] for item in found):
        pr = gh_json("pr", "view", str(number), "-R", repo, "--json", "number,title,url,body,comments")
        urls = video_urls([pr["body"]] + [c["body"] for c in pr["comments"]])
        if urls:
            yield pr, urls


def collected_record(repo, pr, urls):
    """One pull request's videos in the shape marketing-mcp asset import reads."""
    return {"repo": repo, "number": pr["number"], "title": pr["title"], "url": pr["url"], "videos": list(urls)}


def download(url, path):
    token = subprocess.run(["gh", "auth", "token"], check=True, capture_output=True, text=True).stdout.strip()
    subprocess.run(["curl", "-sSfL", "-H", "@-", "-o", str(path), url],
                   input=f"Authorization: token {token}", text=True, check=True)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("repo")
    parser.add_argument("--since", required=True, help="YYYY-MM-DD")
    parser.add_argument("--until", help="YYYY-MM-DD (inclusive)")
    parser.add_argument("--state", choices=["merged", "all"], default="merged")
    parser.add_argument("--out", type=Path, help="download the videos here and write index.md")
    parser.add_argument("--json", action="store_true", help="print JSON for marketing-mcp asset import")
    args = parser.parse_args(argv)
    if args.json:
        records = [collected_record(args.repo, pr, urls) for pr, urls in pull_requests(args.repo, args.since, args.until, args.state)]
        sys.stdout.write(json.dumps(records, ensure_ascii=False, indent=2) + "\n")
        return
    if args.out:
        args.out.mkdir(parents=True, exist_ok=True)
    lines = [f"# Demo videos: {args.repo} ({search_query(args.since, args.until, args.state)})", ""]
    for pr, urls in pull_requests(args.repo, args.since, args.until, args.state):
        lines.append(f"- [#{pr['number']} {pr['title']}]({pr['url']})")
        for index, url in enumerate(urls, 1):
            entry = f"  - {url}"
            if args.out:
                name = f"pr{pr['number']}-{index}.mp4"
                download(url, args.out / name)
                entry += f" → {name}"
            lines.append(entry)
    text = "\n".join(lines) + "\n"
    if args.out:
        (args.out / "index.md").write_text(text)
    sys.stdout.write(text)


if __name__ == "__main__":
    main()
