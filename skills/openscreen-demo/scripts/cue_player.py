#!/usr/bin/env python3
"""Speak a scripted line into a loopback audio device when a Maestro flow asks.

The simulator's microphone (Simulator > I/O > Audio Input) listens to the same loopback device,
so the app hears the line as if a person said it. A flow calls `POST /say?text=...` (for example from a
`.maestro/demo/say.js` script in the product; see the openscreen-demo skill); each cue is logged as a JSON line {at, end, text} in
milliseconds, so the edit can place a caption on the spoken line.

It refuses requests that carry an Origin header, so a web page open in a browser cannot make it speak.
A line that could not be spoken (the device is missing, say failed) answers 500 and is not logged.

Usage: cue_player.py --device "BlackHole 2ch" --log cues.jsonl [--voice Samantha] [--rate 170] [--port 8799]
The loopback device must run at the simulator's sample rate (48 kHz); a 44.1 kHz device gives
the app chopped audio.
"""
import argparse, http.server, json, subprocess, time, urllib.parse


def say_command(device, voice, rate, text):
    # "--" ends say's options: a text such as "--output-file=..." stays text.
    return ["say", "-a", device, "-v", voice, "-r", str(rate), "--", text]


def text_from_path(path):
    return urllib.parse.parse_qs(urllib.parse.urlparse(path).query).get("text", [""])[0]


def play(text, command, log, run=lambda c: subprocess.run(c, check=False).returncode, now=time.time):
    """Speak the line; log it and return True only when say succeeded."""
    at = int(now() * 1000)
    try:
        code = run(command)
    except OSError:  # no say binary
        return False
    end = int(now() * 1000)
    if code != 0:
        return False
    with open(log, "a") as f:
        f.write(json.dumps({"at": at, "end": end, "text": text}) + "\n")
    return True


def handle(path, origin, speak):
    """(status, body) for a POST: speak(text) returns whether the line was spoken."""
    if origin is not None:
        return 403, b"browser requests are refused"
    text = text_from_path(path)
    if not text:
        return 400, b"text is required"
    return (200, b"ok") if speak(text) else (500, b"the line could not be spoken; check the device name")


def main():
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--device", required=True)
    p.add_argument("--log", required=True)
    p.add_argument("--voice", default="Samantha")
    p.add_argument("--rate", type=int, default=170)
    p.add_argument("--port", type=int, default=8799)
    a = p.parse_args()

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_POST(self):
            speak = lambda text: play(text, say_command(a.device, a.voice, a.rate, text), a.log)
            status, body = handle(self.path, self.headers.get("Origin"), speak)
            self.send_response(status); self.end_headers(); self.wfile.write(body)

        def log_message(self, *args):
            pass

    http.server.HTTPServer(("127.0.0.1", a.port), Handler).serve_forever()


if __name__ == "__main__":
    main()
