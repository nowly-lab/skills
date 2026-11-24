#!/usr/bin/env python3
"""Record one demo take driven by a Maestro YAML flow, and plan its OpenScreen edit.

iOS:  demo_take.py ios <udid> <flow.yaml> <out-dir> [--setup setup.yaml] [--points 402x874]
      Records the simulator screen with `simctl io recordVideo` while the flow runs.
      Writes <out-dir>/take.mp4 (constant 30 fps, last frame held 2 s) and <out-dir>/take.json:
      recordingStartedAt, taps [{at, x, y}], callouts [{at, end, text}], edit (in video seconds), ok.
Web:  demo_take.py web <flow.yaml> <out-dir> --points <viewport WxH> [--recorder openscreen|maestro]
      openscreen (default): writes <out-dir>/ready once a window titled --window-title can be recorded; OpenScreen
      records that window (startRecording / stopRecording), then
      demo_take.py pointer <out-dir>/take.json --window WxH --started <ms> --duration <s>
      gives the setPointerTrack events, the crop that hides Chrome's toolbar and the callouts.
      The flow must wait about 9 s after launchApp so recording starts before the first action.
      maestro: the flow records itself with startRecording / stopRecording (about 3 frames a second).

A command with `label:` in the flow becomes a callout. See the openscreen-demo skill (this script is
openscreen-demo/scripts/demo_take.py; run it by its path from any directory).
"""
import argparse
import contextlib
import datetime
import glob
import json
import os
import re
import shutil
import signal
import subprocess
import sys
import tempfile
import time

TRY_TAP = re.compile(r"^(\d\d:\d\d:\d\d\.\d+) .*Try tapping at \((\d+), (\d+)\)")
ELEMENT_TAP = re.compile(r"^(\d\d:\d\d:\d\d\.\d+) .*Tapping on element:.*?bounds=\[(\d+),(\d+)\]\[(\d+),(\d+)\]")
ZOOM_LEAD = 1.2      # a zoom starts this long before its tap
TRIM_MARGIN = 1.0    # keep this much still picture before the first zoom or callout
MIN_CALLOUT = 1500   # ms
CALLOUT_BOTTOM, CALLOUT_TOP = 88, 12


def epoch_ms(day, hms):
    t = datetime.datetime.strptime(hms, "%H:%M:%S.%f").time()
    return int(datetime.datetime.combine(day, t).timestamp() * 1000)


def parse_taps(lines, day, points):
    """Taps from maestro.log: the point Maestro tapped (iOS), else the element's centre (web)."""
    pw, ph = points
    taps = []
    for line in lines:
        m = ELEMENT_TAP.match(line)
        if m:
            x1, y1, x2, y2 = map(int, m.groups()[1:])
            taps.append({"at": epoch_ms(day, m[1]), "x": (x1 + x2) / 2 / pw, "y": (y1 + y2) / 2 / ph})
            continue
        m = TRY_TAP.match(line)
        if m and taps:  # refines the element tap just logged
            taps[-1].update(at=epoch_ms(day, m[1]), x=int(m[2]) / pw, y=int(m[3]) / ph)
    return taps


def parse_commands(commands, video_end):
    """Callouts from labelled commands in commands.json, and when text input first began."""
    callouts, keyboard_from = [], None
    for c in commands:
        body = next((v for v in c["command"].values() if v), {})
        at = c.get("metadata", {}).get("timestamp")
        if at is None:
            continue
        if keyboard_from is None and c["command"].get("inputTextCommand"):
            keyboard_from = at
        if body.get("label"):
            callouts.append({"at": at, "text": body["label"]})
    for i, c in enumerate(callouts):
        nxt = callouts[i + 1]["at"] if i + 1 < len(callouts) else video_end - 100
        c["end"] = max(c["at"] + MIN_CALLOUT, nxt)
    return callouts, keyboard_from


def edit_plan(started, taps, callouts, duration, keyboard_from=None):
    """The OpenScreen edit in the video's own seconds (= ruler seconds of a one-clip project)."""
    sec = lambda t: round((t - started) / 1000, 2)
    zooms = [{"startSec": max(0.0, round(sec(t["at"]) - ZOOM_LEAD, 2)), "endSec": sec(t["at"]),
              "focus": {"cx": round(t["x"], 3), "cy": round(t["y"], 3)}} for t in taps]
    texts = [{"startSec": sec(c["at"]), "endSec": min(sec(c["end"]), round(duration, 2)), "text": c["text"],
              "y": CALLOUT_TOP if keyboard_from is not None and c["at"] >= keyboard_from else CALLOUT_BOTTOM}
             for c in callouts]
    starts = [z["startSec"] for z in zooms] + [c["startSec"] for c in texts]
    cut = round(min(starts) - TRIM_MARGIN, 2) if starts else 0
    return {"trim": [0, cut] if cut > 0.5 else None, "zooms": zooms, "callouts": texts,
            "durationSec": round(duration, 2)}


def window_pointer(taps, viewport, window):
    """setPointerTrack events and a cropRegion for a web take OpenScreen recorded as the Chrome window.

    taps are fractions of the page viewport; the window adds Chrome's toolbar above it. The window is
    as wide as the viewport, so its width gives the recording's scale."""
    vw, vh = viewport
    scale = window[0] / vw
    wh = window[1] / scale
    top = wh - vh
    events = []
    for t in taps:
        x, y = round(t["x"], 4), round((top + t["y"] * vh) / wh, 4)
        events.append({"at": t["at"] - 400, "x": x, "y": y})
        events.append({"at": t["at"], "x": x, "y": y, "click": True})
    crop = {"x": 0, "y": round(top / wh, 4), "width": 1, "height": round(vh / wh, 4)}
    return events, crop


# ---- recording -------------------------------------------------------------------------------

def maestro_env():
    env = dict(os.environ)
    if "JAVA_HOME" not in env:
        prefix = subprocess.run(["brew", "--prefix", "openjdk@17"], capture_output=True, text=True).stdout.strip()
        if prefix:
            env["JAVA_HOME"] = prefix + "/libexec/openjdk.jdk/Contents/Home"
    return env


def maestro_args(device, flow, debug_dir):
    """The maestro command line. Secrets never go here (see rendered_flow)."""
    return ["maestro", *device, "test", flow, "--debug-output", debug_dir]


def split_env(base, setup_secrets):
    """The setup secrets' values, and the recorded flow's environment without them."""
    values, flow_env = {}, dict(base)
    for name in setup_secrets:
        if name not in base:
            raise ValueError(f"{name} is not set in the environment")
        values[name] = flow_env.pop(name)
    return values, flow_env


@contextlib.contextmanager
def rendered_flow(path, values, replacements=()):
    """The setup flow with ${NAME} filled in, in a private temporary file removed afterwards: Maestro's
    -e would put the value on the command line, where any process can read it. replacements are literal
    (old, new) edits for the copy only, such as another port for the local stack."""
    text = open(path, encoding="utf-8").read()
    for old, new in replacements:  # before the secrets, so an edit never reaches a filled-in value
        text = text.replace(old, new)
    for name, value in values.items():
        text = text.replace("${" + name + "}", value)
    folder = tempfile.mkdtemp(prefix="demo-setup-")
    target = os.path.join(folder, os.path.basename(path))
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write(text)
        yield target
    finally:
        shutil.rmtree(folder, ignore_errors=True)


def parse_replacements(items):
    pairs = []
    for item in items:
        old, sep, new = item.partition("=")
        if not sep or not old:
            raise ValueError(f"--replace takes OLD=NEW, got {item!r}")
        pairs.append((old, new))
    return pairs


def run_setup(device, setup, secret_values, replacements, out, env):
    """Run the setup flow from a private rendered copy; its debug output is deleted (it records the
    evaluated launch arguments, secrets included)."""
    setup_dir = os.path.join(out, "maestro-setup")
    with rendered_flow(setup, secret_values, replacements) as setup_flow:
        result = run_maestro(device, setup_flow, setup_dir, env)
    shutil.rmtree(setup_dir, ignore_errors=True)
    if result.returncode:
        sys.exit("setup flow failed:\n" + redact(result.stdout[-1500:], list(secret_values.values())))


def redact(text, secrets):
    for value in secrets:
        if value:
            text = text.replace(value, "<redacted>")
    return text


def missing_taps_warning(commands, taps):
    """True when the flow tapped but no tap could be read from Maestro's log (its format may have changed)."""
    tapped = any(any(k.startswith("tapOn") and v for k, v in c["command"].items()) for c in commands)
    return tapped and not taps


def run_maestro(args, flow, debug_dir, env):
    return subprocess.run(maestro_args(args, flow, debug_dir), env=env, capture_output=True, text=True)


def normalize_video(src, dst):
    """simctl and Maestro write frames only when the screen changes; an editor needs one at every cut."""
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf",
                    "fps=30,tpad=stop_mode=clone:stop_duration=2", "-c:v", "libx264", "-pix_fmt", "yuv420p", dst],
                   check=True)


def duration_of(video):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video],
                         capture_output=True, text=True, check=True).stdout
    return float(out)


def load_run(debug_dir, res):
    runs = sorted(glob.glob(os.path.join(debug_dir, ".maestro/tests/*")))
    if not runs:
        sys.exit("maestro wrote no debug output:\n" + res.stdout[-1500:])
    run_dir = runs[-1]
    commands = json.load(open(glob.glob(os.path.join(run_dir, "*/commands.json"))[0], encoding="utf-8"))
    log = open(os.path.join(run_dir, "maestro.log"), encoding="utf-8").read().splitlines()
    return run_dir, commands, log


def write_take(out, take):
    if missing_taps_warning(take.get("commands") or take.get("_commands", []), take["taps"]):
        take.setdefault("warnings", []).append("the flow tapped but no tap was read from maestro.log: zooms are missing")
        print("warning: " + take["warnings"][-1], file=sys.stderr)
    take.pop("_commands", None)
    with open(os.path.join(out, "take.json"), "w", encoding="utf-8") as f:
        json.dump(take, f, ensure_ascii=False, indent=1)
    print(json.dumps({k: take[k] for k in ("ok", "video") if k in take} | {"taps": len(take["taps"])}))
    return 0 if take["ok"] else 1


OPENSCREEN = "/Applications/Openscreen.app/Contents/MacOS/Openscreen"


def window_titles():
    """Titles of the windows OpenScreen can record (its `sources --json` prints JSON lines)."""
    out = subprocess.run([OPENSCREEN, "sources", "--json"], capture_output=True, text=True).stdout
    for line in out.splitlines():
        try:
            event = json.loads(line)
        except ValueError:
            continue
        if event.get("event") == "done":
            return [w["name"] for w in event.get("sources", {}).get("windows", [])]
    return []


def wait_for_window(title, ready_file, proc, timeout=60):
    """Write ready_file once a window whose title contains `title` can be recorded."""
    since = time.time()
    while proc.poll() is None and time.time() - since < timeout:
        if any(title.lower() in t.lower() for t in window_titles()):
            with open(ready_file, "w") as f:
                f.write(str(int(time.time() * 1000)))
            return True
        time.sleep(0.5)
    return False


def cmd_pointer(a):
    take = json.load(open(a.take, encoding="utf-8"))
    window = tuple(map(int, a.window.lower().split("x")))
    viewport = tuple(take["viewport"])
    events, crop = window_pointer(take["taps"], viewport, window)
    end = a.started + int(a.duration * 1000)
    callouts, _ = parse_commands(take["commands"], end)
    plan = edit_plan(a.started, [], callouts, a.duration)  # no on-screen keyboard on the web
    plan["zooms"] = "setPointerTrack plans them on the clicks"
    print(json.dumps({"events": events, "cropRegion": crop, "edit": plan}, ensure_ascii=False, indent=1))
    return 0


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="platform", required=True)
    ios = sub.add_parser("ios", help="record the simulator screen with simctl")
    ios.add_argument("udid")
    only = sub.add_parser("setup", help="run only the setup flow (sign in) on a simulator, e.g. before an "
                                        "OpenScreen take with sound; nothing is recorded")
    only.add_argument("udid")
    only.add_argument("setup")
    only.add_argument("--setup-secret", action="append", default=[], metavar="NAME")
    web = sub.add_parser("web", help="run a web flow; OpenScreen records the Chrome window (or Maestro does)")
    for p in (ios, web):
        p.add_argument("flow")
        p.add_argument("out")
        p.add_argument("--setup", help="flow run before recording: launch, sign in, seed data")
        p.add_argument("--setup-secret", action="append", default=[], metavar="NAME",
                       help="an environment variable (e.g. a demo sign-in token) filled into ${NAME} of the setup "
                            "flow only, never put on a command line; the setup's debug output is deleted; repeatable")
    for p in (ios, web, only):
        p.add_argument("--replace", action="append", default=[], metavar="OLD=NEW",
                       help="a literal edit to the setup flow's private copy, e.g. "
                            "127.0.0.1:8787=127.0.0.1:8797 when the port is taken; repeatable")
    ios.add_argument("--points", default="402x874", help="screen size in points (default: iPhone 17 Pro)")
    web.add_argument("--points", required=True, help="viewport size in CSS pixels")
    web.add_argument("--recorder", choices=["openscreen", "maestro"], default="openscreen",
                     help="openscreen: write <out>/ready when Chrome is on screen, then call OpenScreen "
                          "startRecording; maestro: the flow records itself with startRecording/stopRecording")
    web.add_argument("--window-title", help="part of the page's <title>, to tell when Chrome is on screen")
    ptr = sub.add_parser("pointer", help="setPointerTrack events, crop and callouts for an OpenScreen web take")
    ptr.add_argument("take", help="take.json written by `web --recorder openscreen`")
    ptr.add_argument("--window", required=True, help="the OpenScreen take's video size, WxH")
    ptr.add_argument("--started", type=int, required=True, help="recordingStartedAt from stopRecording")
    ptr.add_argument("--duration", type=float, required=True, help="durationSec from stopRecording")
    a = ap.parse_args(argv)
    if a.platform == "pointer":
        return cmd_pointer(a)
    replacements = parse_replacements(a.replace)
    if a.platform == "setup":
        secret_values, env = split_env(maestro_env(), a.setup_secret)
        with tempfile.TemporaryDirectory(prefix="demo-setup-out-") as out:
            run_setup(["--udid", a.udid], a.setup, secret_values, replacements, out, env)
        print("setup done")
        return 0

    os.makedirs(a.out, exist_ok=True)
    points = tuple(map(int, a.points.lower().split("x")))
    secret_values, env = split_env(maestro_env(), a.setup_secret)
    secrets = list(secret_values.values())
    device = ["--udid", a.udid] if a.platform == "ios" else []
    debug_dir = os.path.join(a.out, "maestro")
    shutil.rmtree(debug_dir, ignore_errors=True)
    raw = os.path.join(a.out, "raw.mp4")
    video = os.path.join(a.out, "take.mp4")

    if a.setup:  # the setup screens and the home screen stay out of the take
        run_setup(device, a.setup, secret_values, replacements, a.out, env)

    if a.platform == "web" and a.recorder == "openscreen":
        if not a.window_title:
            sys.exit("--recorder openscreen needs --window-title")
        ready = os.path.join(a.out, "ready")
        if os.path.exists(ready):
            os.remove(ready)
        log_path = os.path.join(a.out, "maestro-stdout.txt")
        log_file = open(log_path, "w")  # a file, not a pipe: nobody reads while we wait for the window
        proc = subprocess.Popen(maestro_args([], a.flow, debug_dir), env=env, stdout=log_file, stderr=subprocess.STDOUT)
        if not wait_for_window(a.window_title, ready, proc):
            proc.kill()
            sys.exit(f'no window titled {a.window_title!r} appeared')
        proc.wait()
        log_file.close()
        stdout = open(log_path, encoding="utf-8", errors="replace").read()
        res = subprocess.CompletedProcess(proc.args, proc.returncode, stdout, "")
        _, commands, log = load_run(debug_dir, res)
        day = datetime.date.today()
        return write_take(a.out, {"platform": "web", "recorder": "openscreen", "viewport": list(points),
                                  "taps": parse_taps(log, day, points), "commands": commands,
                                  "ok": res.returncode == 0, "maestroTail": stdout[-1500:] if res.returncode else ""})

    started = None
    if a.platform == "ios":
        rec = subprocess.Popen(["xcrun", "simctl", "io", a.udid, "recordVideo", "--codec=h264", "--force", raw],
                               stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        for line in rec.stdout:
            if "Recording started" in line:
                break
        started = int(time.time() * 1000)
        time.sleep(1.0)
    res = run_maestro(device, a.flow, debug_dir, env)
    if a.platform == "ios":
        time.sleep(1.5)
        rec.send_signal(signal.SIGINT)
        rec.wait()

    run_dir, commands, log = load_run(debug_dir, res)
    if a.platform == "web":
        rec_cmd = next((c for c in commands if c["command"].get("startRecordingCommand")), None)
        clips = glob.glob(os.path.join(run_dir, "*/startRecording/*.mp4"))
        if rec_cmd is None or not clips:
            sys.exit("with --recorder maestro the flow must call startRecording and stopRecording")
        started = rec_cmd["metadata"]["timestamp"]
        raw = clips[0]

    normalize_video(raw, video)
    duration = duration_of(video)
    day = datetime.datetime.fromtimestamp(started / 1000).date()
    taps = parse_taps(log, day, points)
    callouts, keyboard_from = parse_commands(commands, started + int(duration * 1000))
    if a.platform == "web":
        keyboard_from = None  # no on-screen keyboard on the web
    return write_take(a.out, {"platform": a.platform, "recordingStartedAt": started, "video": os.path.abspath(video),
                              "taps": taps, "callouts": callouts, "_commands": commands,
                              "edit": edit_plan(started, taps, callouts, duration, keyboard_from),
                              "ok": res.returncode == 0, "maestroTail": res.stdout[-1500:] if res.returncode else ""})


if __name__ == "__main__":
    sys.exit(main())
