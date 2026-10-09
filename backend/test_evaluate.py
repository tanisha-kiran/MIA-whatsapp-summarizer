import unittest

from evaluate import CATEGORIES, calculate_metrics, score_predictions


class CalculateMetricsTests(unittest.TestCase):
    def test_calculates_precision_recall_and_f1(self) -> None:
        metrics = calculate_metrics(tp=3, fp=1, fn=1)

        self.assertAlmostEqual(metrics["precision"], 0.75)
        self.assertAlmostEqual(metrics["recall"], 0.75)
        self.assertAlmostEqual(metrics["f1"], 0.75)

    def test_zero_predictions_returns_zero_metrics(self) -> None:
        metrics = calculate_metrics(tp=0, fp=0, fn=0)

        self.assertEqual(metrics["precision"], 0)
        self.assertEqual(metrics["recall"], 0)
        self.assertEqual(metrics["f1"], 0)

    def test_rejects_mismatched_case_and_prediction_counts(self) -> None:
        with self.assertRaisesRegex(ValueError, "exactly one prediction"):
            score_predictions([{"expected": {}}], [])

    def test_micro_score_aggregates_category_decisions(self) -> None:
        case = {"expected": {category: False for category in CATEGORIES}}
        predictions = [{category: False for category in CATEGORIES}]

        scores = score_predictions([case], predictions)

        self.assertEqual(scores["micro overall"]["tp"], 0)
        self.assertEqual(scores["micro overall"]["fp"], 0)
        self.assertEqual(scores["micro overall"]["fn"], 0)


if __name__ == "__main__":
    unittest.main()
