import pathlib
import unittest


ROOT = pathlib.Path(__file__).resolve().parents[1]
SKILLS = ROOT / 'skills'
POLICY = SKILLS / 'implementation-nowly/references/main-release-policy.md'


class ReleasePolicyTests(unittest.TestCase):
    def test_execution_uses_the_release_contract(self):
        text = (SKILLS / 'implementation-nowly/SKILL.md').read_text()
        self.assertIn('(references/main-release-policy.md)', text)

    def test_policy_preserves_delivery_gates_and_observability(self):
        text = POLICY.read_text()
        for requirement in ['main', 'independent review', 'QA',
                            'platform approval', 'credentials', 'production data',
                            'read back', 'incomplete', 'unrelated outgoing commits']:
            with self.subTest(requirement=requirement):
                self.assertIn(requirement, text)

    def test_push_only_does_not_silently_authorize_implementation(self):
        text = (SKILLS / 'orca-push-all-main/SKILL.md').read_text()
        self.assertIn('Never commit, switch branch, stash, reset, force push, or change a remote.', text)
        self.assertIn('../implementation-nowly/references/main-release-policy.md', text)
        self.assertIn('explicit implementation', text)

    def test_no_skill_points_to_the_removed_workflow(self):
        for path in SKILLS.rglob('*.md'):
            with self.subTest(path=path.relative_to(ROOT)):
                self.assertNotIn('implementation-workflow', path.read_text())


if __name__ == '__main__':
    unittest.main()
