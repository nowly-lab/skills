import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / 'skills/voice-router/SKILL.md'
SPEC = ROOT / 'skills/voice-router/references/worker-spec.md'


def read(path):
    return path.read_text() if path.exists() else ''


class VoiceRouterSkillTest(unittest.TestCase):
    def test_frontmatter_is_strict_yaml(self):
        text = read(SKILL)
        match = re.match(r'---\n(.*?)\n---\n', text, re.S)
        self.assertIsNotNone(match, 'SKILL.md must start with a --- frontmatter block')
        lines = dict(line.split(': ', 1) for line in match.group(1).splitlines() if ': ' in line)
        self.assertEqual(lines.get('name'), 'voice-router')
        description = lines.get('description', '')
        self.assertTrue(description, 'description is required')
        if ': ' in description:
            self.assertTrue(description.startswith('"') and description.endswith('"'),
                            'a description with a colon must be quoted')

    def test_event_loop_rules(self):
        text = read(SKILL)
        self.assertIn('one message per turn', text)
        self.assertIn('never plans, implements or reviews in this session', text)

    def test_orca_commands(self):
        text = read(SKILL)
        for command in ('worker-start --environment local', '--worktree new-top-level',
                        'send --to dispatch:', 'reply --id', 'orca repo list --json'):
            with self.subTest(command=command):
                self.assertIn(command, text)

    def test_worker_spec_template(self):
        text = read(SPEC)
        for word in ('planning-nowly', 'orchestration ask', 'Plannotator Inbox', 'worker_done'):
            with self.subTest(word=word):
                self.assertIn(word, text)

    def test_linked_from_meeting_hub_and_readme(self):
        self.assertIn('voice-router', read(ROOT / 'skills/meeting-hub/SKILL.md'))
        self.assertIn('voice-router', read(ROOT / 'README.md'))


if __name__ == '__main__':
    unittest.main()
