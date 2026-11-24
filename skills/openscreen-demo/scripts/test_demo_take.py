#!/usr/bin/env python3
"""Tests for openscreen-demo/scripts/demo_take.py (log parsing and the OpenScreen edit plan).

Run from this folder: python3 -m unittest discover -p 'test_*.py'
"""

import datetime
import json
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import demo_take as dt  # noqa: E402

DAY = datetime.date(2026, 11, 14)
FIX = HERE / "fixtures"


def ms(hms):
    return dt.epoch_ms(DAY, hms)


class ParseTapsTest(unittest.TestCase):
    def test_ios_uses_the_point_maestro_tapped(self):
        lines = (FIX / "ios-maestro.log").read_text(encoding="utf-8").splitlines()
        taps = dt.parse_taps(lines, DAY, (402, 874))
        self.assertEqual(len(taps), 2)
        self.assertEqual(taps[0]["at"], ms("19:58:23.840"))
        self.assertAlmostEqual(taps[0]["x"], 201 / 402)
        self.assertAlmostEqual(taps[0]["y"], 306 / 874)
        self.assertAlmostEqual(taps[1]["y"], 359 / 874)

    def test_web_falls_back_to_the_element_centre(self):
        lines = (FIX / "web-maestro.log").read_text(encoding="utf-8").splitlines()
        taps = dt.parse_taps(lines, DAY, (1200, 1222))
        self.assertEqual(len(taps), 2)
        self.assertEqual(taps[0]["at"], ms("20:03:08.975"))
        self.assertAlmostEqual(taps[0]["x"], (40 + 247) / 2 / 1200)
        self.assertAlmostEqual(taps[0]["y"], (107 + 148) / 2 / 1222)
        self.assertAlmostEqual(taps[1]["x"], (247 + 315) / 2 / 1200)

    def test_no_taps_gives_an_empty_list(self):
        self.assertEqual(dt.parse_taps(["12:00:00.000 [ INFO] nothing"], DAY, (402, 874)), [])


class ParseCommandsTest(unittest.TestCase):
    def setUp(self):
        self.commands = json.loads((FIX / "ios-commands.json").read_text(encoding="utf-8"))

    def test_only_labelled_commands_become_callouts(self):
        callouts, _ = dt.parse_commands(self.commands, video_end=10**13)
        self.assertEqual([c["text"] for c in callouts], ["サービスのURLを入力", "Continue で接続"])

    def test_a_callout_lasts_until_the_next_one_and_the_last_stops_before_the_video_ends(self):
        end = 10**13
        callouts, _ = dt.parse_commands(self.commands, video_end=end)
        self.assertEqual(callouts[0]["end"], callouts[1]["at"])
        self.assertEqual(callouts[1]["end"], end - 100)

    def test_a_short_gap_still_shows_a_callout_for_1_5_seconds(self):
        cmds = [
            {"command": {"tapOnElement": {"label": "a"}}, "metadata": {"timestamp": 1000}},
            {"command": {"tapOnElement": {"label": "b"}}, "metadata": {"timestamp": 1200}},
        ]
        callouts, _ = dt.parse_commands(cmds, video_end=10_000)
        self.assertEqual(callouts[0]["end"], 2500)

    def test_the_first_text_input_is_reported(self):
        _, keyboard_from = dt.parse_commands(self.commands, video_end=10**13)
        typed = next(c for c in self.commands if c["command"].get("inputTextCommand"))
        self.assertEqual(keyboard_from, typed["metadata"]["timestamp"])


class EditPlanTest(unittest.TestCase):
    START = 1_000_000

    def plan(self, taps, callouts, keyboard_from=None, duration=20.0):
        return dt.edit_plan(self.START, taps, callouts, duration, keyboard_from)

    def test_cuts_the_wait_up_to_one_second_before_the_first_zoom_moves(self):
        p = self.plan([{"at": self.START + 6000, "x": 0.5, "y": 0.3}], [])
        zoom = p["zooms"][0]
        self.assertEqual(zoom["startSec"], 4.8)  # 1.2 s before the tap
        self.assertEqual(p["trim"], [0, 3.8])

    def test_no_trim_when_the_action_starts_early(self):
        p = self.plan([{"at": self.START + 1500, "x": 0.5, "y": 0.3}], [])
        self.assertIsNone(p["trim"])

    def test_a_zoom_ends_on_its_tap_and_aims_at_it(self):
        p = self.plan([{"at": self.START + 6000, "x": 0.25, "y": 0.75}], [])
        self.assertEqual(p["zooms"][0]["endSec"], 6.0)
        self.assertEqual(p["zooms"][0]["focus"], {"cx": 0.25, "cy": 0.75})

    def test_callouts_move_to_the_top_once_the_keyboard_is_up(self):
        callouts = [
            {"at": self.START + 5000, "end": self.START + 8000, "text": "before"},
            {"at": self.START + 8000, "end": self.START + 11000, "text": "after"},
        ]
        p = self.plan([], callouts, keyboard_from=self.START + 6000)
        self.assertEqual([c["y"] for c in p["callouts"]], [88, 12])
        self.assertEqual(p["callouts"][1]["startSec"], 8.0)

    def test_without_a_keyboard_callouts_stay_at_the_bottom(self):
        callouts = [{"at": self.START + 5000, "end": self.START + 8000, "text": "x"}]
        self.assertEqual(self.plan([], callouts)["callouts"][0]["y"], 88)

    def test_trim_also_respects_an_early_callout(self):
        callouts = [{"at": self.START + 3000, "end": self.START + 5000, "text": "x"}]
        p = self.plan([{"at": self.START + 9000, "x": 0.5, "y": 0.5}], callouts)
        self.assertEqual(p["trim"], [0, 2.0])


class MaestroArgsTest(unittest.TestCase):
    def test_no_secret_reaches_the_command_line(self):
        self.assertEqual(dt.maestro_args(["--udid", "U"], "flow.yaml", "dbg"),
                         ["maestro", "--udid", "U", "test", "flow.yaml", "--debug-output", "dbg"])


class SetupSecretTest(unittest.TestCase):
    BASE = {"PATH": "/bin", "DEMO_TOKEN": "f" * 64, "OTHER": "x"}

    def test_a_setup_secret_is_removed_from_the_recorded_flow_environment(self):
        values, flow_env = dt.split_env(self.BASE, ["DEMO_TOKEN"])
        self.assertEqual(values, {"DEMO_TOKEN": "f" * 64})
        self.assertNotIn("DEMO_TOKEN", flow_env)
        self.assertEqual(flow_env["OTHER"], "x")

    def test_a_missing_secret_is_refused(self):
        with self.assertRaises(ValueError):
            dt.split_env(self.BASE, ["MISSING"])

    def test_the_setup_flow_is_rendered_into_a_private_file_and_removed(self):
        import os, stat, tempfile
        with tempfile.TemporaryDirectory() as d:
            src = os.path.join(d, "setup.yaml")
            with open(src, "w") as f:
                f.write('token: "${DEMO_TOKEN}"\nother: "${KEEP}"\n')
            with dt.rendered_flow(src, {"DEMO_TOKEN": "f" * 64}) as path:
                self.assertEqual(stat.S_IMODE(os.stat(path).st_mode), 0o600)
                self.assertEqual(open(path).read(), 'token: "' + "f" * 64 + '"\nother: "${KEEP}"\n')
                self.assertNotEqual(os.path.dirname(path), d)
            self.assertFalse(os.path.exists(path))
            self.assertIn("${DEMO_TOKEN}", open(src).read())  # the source stays a template

    def test_replacements_change_the_rendered_copy_only(self):
        import os, tempfile
        with tempfile.TemporaryDirectory() as d:
            src = os.path.join(d, "setup.yaml")
            with open(src, "w") as f:
                f.write('server: "http://127.0.0.1:8787"\n')
            with dt.rendered_flow(src, {}, [("127.0.0.1:8787", "127.0.0.1:8797")]) as path:
                self.assertEqual(open(path).read(), 'server: "http://127.0.0.1:8797"\n')
            self.assertIn("8787", open(src).read())

    def test_replacements_never_touch_a_filled_in_secret(self):
        import os, tempfile
        with tempfile.TemporaryDirectory() as d:
            src = os.path.join(d, "setup.yaml")
            with open(src, "w") as f:
                f.write('token: "${T}"\n')
            with dt.rendered_flow(src, {"T": "abc8787"}, [("8787", "8797")]) as path:
                self.assertEqual(open(path).read(), 'token: "abc8787"\n')

    def test_parse_replacements_splits_on_the_first_equals_sign(self):
        self.assertEqual(dt.parse_replacements(["127.0.0.1:8787=127.0.0.1:8797", "a=b=c"]),
                         [("127.0.0.1:8787", "127.0.0.1:8797"), ("a", "b=c")])
        with self.assertRaises(ValueError):
            dt.parse_replacements(["no-equals"])

    def test_secret_values_are_redacted_from_output(self):
        text = "launch arguments: {-APP_FIXTURE_SESSION_TOKEN=" + "f" * 64 + "}"
        self.assertEqual(dt.redact(text, ["f" * 64]), "launch arguments: {-APP_FIXTURE_SESSION_TOKEN=<redacted>}")
        self.assertEqual(dt.redact("nothing", []), "nothing")


class NoTapWarningTest(unittest.TestCase):
    def test_a_flow_that_taps_but_yields_no_taps_is_flagged(self):
        commands = [{"command": {"tapOnElement": {"selector": {}}}, "metadata": {"timestamp": 1}}]
        self.assertTrue(dt.missing_taps_warning(commands, []))
        self.assertFalse(dt.missing_taps_warning(commands, [{"at": 1, "x": 0, "y": 0}]))
        self.assertFalse(dt.missing_taps_warning([{"command": {"inputTextCommand": {"text": "a"}}}], []))


class WindowPointerTest(unittest.TestCase):
    """A web take recorded by OpenScreen shows the whole Chrome window: page points sit below its toolbar."""

    def test_page_points_map_into_the_window_below_the_toolbar(self):
        taps = [{"at": 5000, "x": 143.5 / 1200, "y": 127.5 / 1222}]
        events, crop = dt.window_pointer(taps, viewport=(1200, 1222), window=(1200, 1364))
        click = events[-1]
        self.assertEqual(click, {"at": 5000, "x": round(143.5 / 1200, 4), "y": round((142 + 127.5) / 1364, 4),
                                 "click": True})
        self.assertEqual(events[-2]["at"], 4600)  # the pointer glides in before the click
        self.assertNotIn("click", events[-2])
        self.assertEqual(crop, {"x": 0, "y": round(142 / 1364, 4), "width": 1, "height": round(1222 / 1364, 4)})

    def test_a_window_recorded_at_another_scale_keeps_the_same_fractions(self):
        taps = [{"at": 5000, "x": 0.5, "y": 0.5}]
        a, _ = dt.window_pointer(taps, viewport=(1200, 1222), window=(1200, 1364))
        b, _ = dt.window_pointer(taps, viewport=(1200, 1222), window=(2400, 2728))
        self.assertEqual(a, b)


if __name__ == "__main__":
    unittest.main()
