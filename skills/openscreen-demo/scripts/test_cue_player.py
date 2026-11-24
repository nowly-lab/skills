import json, pathlib, tempfile, unittest
import cue_player


class CuePlayerTest(unittest.TestCase):
    def test_say_command_ends_options_before_the_text(self):
        self.assertEqual(cue_player.say_command("BlackHole 2ch", "Samantha", 170, "--output-file=/tmp/x"),
                         ["say", "-a", "BlackHole 2ch", "-v", "Samantha", "-r", "170", "--", "--output-file=/tmp/x"])

    def test_text_from_path_reads_query(self):
        self.assertEqual(cue_player.text_from_path("/say?text=Could%20you%20help%3F"), "Could you help?")
        self.assertEqual(cue_player.text_from_path("/say"), "")

    def test_play_logs_start_end_and_text_when_spoken(self):
        with tempfile.TemporaryDirectory() as d:
            log = pathlib.Path(d) / "cues.jsonl"
            ran = []
            clock = iter([1000.0, 1002.5])
            ok = cue_player.play("Hello", ["say", "Hello"], log, run=lambda c: ran.append(c) or 0, now=lambda: next(clock))
            self.assertTrue(ok)
            self.assertEqual(ran, [["say", "Hello"]])
            self.assertEqual(json.loads(log.read_text()), {"at": 1000000, "end": 1002500, "text": "Hello"})

    def test_play_reports_failure_and_logs_nothing(self):
        with tempfile.TemporaryDirectory() as d:
            log = pathlib.Path(d) / "cues.jsonl"
            self.assertFalse(cue_player.play("Hello", ["say"], log, run=lambda c: 1, now=lambda: 1.0))
            self.assertFalse(log.exists())

    def test_play_reports_a_missing_say_binary_as_failure(self):
        def missing(command):
            raise FileNotFoundError("say")
        with tempfile.TemporaryDirectory() as d:
            self.assertFalse(cue_player.play("Hi", ["say"], pathlib.Path(d) / "c.jsonl", run=missing, now=lambda: 1.0))

    def test_handle_refuses_browser_requests_and_empty_text(self):
        speak = lambda text: self.fail("must not speak")
        self.assertEqual(cue_player.handle("/say?text=Hi", "https://evil.example", speak)[0], 403)
        self.assertEqual(cue_player.handle("/say", None, speak)[0], 400)

    def test_handle_answers_500_when_the_line_was_not_spoken(self):
        self.assertEqual(cue_player.handle("/say?text=Hi", None, lambda text: False)[0], 500)
        self.assertEqual(cue_player.handle("/say?text=Hi", None, lambda text: True)[0], 200)


if __name__ == "__main__":
    unittest.main()
