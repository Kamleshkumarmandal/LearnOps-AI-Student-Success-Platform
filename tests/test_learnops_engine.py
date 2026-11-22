import unittest

from learnops_engine import LEARNING_PATH, SEED_STUDENTS, calculate_risk, order_learning_path, prioritize_students


class LearnOpsEngineTests(unittest.TestCase):
    def test_healthy_student_has_no_support_score(self):
        result = calculate_risk(SEED_STUDENTS[0])
        self.assertEqual(result["score"], 0)
        self.assertEqual(result["level"], "On track")

    def test_risk_score_is_explainable_and_bounded(self):
        result = calculate_risk(SEED_STUDENTS[2])
        self.assertGreater(result["score"], 50)
        self.assertEqual(result["level"], "Needs support")
        self.assertGreater(len(result["reasons"]), 2)
        self.assertLessEqual(result["score"], 100)

    def test_priority_order_is_highest_first(self):
        results = prioritize_students(SEED_STUDENTS)
        self.assertEqual(results, sorted(results, key=lambda item: (-item["score"], item["id"])))

    def test_learning_path_obeys_prerequisites(self):
        ordered = order_learning_path(LEARNING_PATH)
        self.assertLess(ordered.index("programming"), ordered.index("dsa"))
        self.assertLess(ordered.index("dsa"), ordered.index("apis"))
        self.assertLess(ordered.index("apis"), ordered.index("concurrency"))

    def test_learning_path_rejects_cycles(self):
        modules = [
            {"id": "a", "title": "A", "prerequisites": ["b"]},
            {"id": "b", "title": "B", "prerequisites": ["a"]},
        ]
        with self.assertRaisesRegex(ValueError, "cycle"):
            order_learning_path(modules)


if __name__ == "__main__":
    unittest.main()
