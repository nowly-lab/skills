import re
import unittest

import yaml
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
        meta = yaml.safe_load(match.group(1))
        self.assertEqual(meta.get('name'), 'voice-router')
        self.assertTrue(meta.get('description'))

    def test_event_loop_rules(self):
        text = read(SKILL)
        self.assertIn('one message per turn', text)
        self.assertIn('never plans, implements or reviews in this session', text)

    def test_orca_commands(self):
        text = read(SKILL)
        for command in ('worker-start --environment local', '--worktree new-top-level',
                        'send --to dispatch:', 'reply --id', 'orca repo list --json',
                        '--task-title', 'orca project setups'):
            with self.subTest(command=command):
                self.assertIn(command, text)

    def test_worker_spec_template(self):
        text = read(SPEC)
        for word in ('planning-nowly', 'orchestration ask', 'Plannotator Inbox', 'worker_done',
                     '--type status', 'set up on this machine'):
            with self.subTest(word=word):
                self.assertIn(word, text)

    def test_inbox_notice_is_status_not_question(self):
        self.assertNotIn('orchestration ask with one line', read(SPEC))
        self.assertIn('| A worker `status`', read(SKILL))

    def test_close_hands_questions_to_inbox(self):
        close = read(SKILL).split('## Close', 1)[1].split('## ', 1)[0]
        self.assertIn('send further questions to the Plannotator Inbox', close)

    def test_no_product_names(self):
        self.assertNotIn('ebay', read(SKILL).lower())
        self.assertNotIn('the user named it', read(SPEC))

    def test_meeting_hub_handles_worker_mail(self):
        self.assertIn('worker mail', read(ROOT / 'skills/meeting-hub/SKILL.md'))

    def test_linked_from_meeting_hub_and_readme(self):
        self.assertIn('voice-router', read(ROOT / 'skills/meeting-hub/SKILL.md'))
        self.assertIn('voice-router', read(ROOT / 'README.md'))


if __name__ == '__main__':
    unittest.main()
