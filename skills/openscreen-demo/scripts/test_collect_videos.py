import unittest

from collect_videos import collected_record, search_query, video_urls

A = "https://github.com/user-attachments/assets/6fa01ffe-f1f6-4790-90aa-134ba4cf235b"
B = "https://github.com/user-attachments/assets/a1ead7a2-2295-4eae-b32d-ef3134904681"


class VideoUrls(unittest.TestCase):
    def test_body_and_comments_in_order_without_repeats(self):
        texts = [f"**Demo:** body\n\n{A}\n", None, f"again {A} and ![]({B})"]
        self.assertEqual(video_urls(texts), [A, B])

    def test_ignores_other_links(self):
        self.assertEqual(video_urls(["https://github.com/example-org/example-app/pull/1 https://example.com/a.mp4"]), [])


class SearchQuery(unittest.TestCase):
    def test_merged_range(self):
        self.assertEqual(search_query("2026-11-01", "2026-11-15", "merged"), "merged:2026-11-01..2026-11-15")

    def test_all_uses_created_date(self):
        self.assertEqual(search_query("2026-11-14", None, "all"), "created:>=2026-11-14")


class CollectedRecord(unittest.TestCase):
    def test_json_record_shape(self):
        pr = {"number": 39, "title": "Release month", "url": "https://github.com/example-org/example-app/pull/39", "body": "", "comments": []}
        self.assertEqual(collected_record("example-org/example-app", pr, [A, B]), {
            "repo": "example-org/example-app", "number": 39, "title": "Release month",
            "url": "https://github.com/example-org/example-app/pull/39", "videos": [A, B],
        })


if __name__ == "__main__":
    unittest.main()
