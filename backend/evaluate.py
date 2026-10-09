import argparse
import asyncio
import json
from pathlib import Path
from typing import Any

import httpx

from main import MODEL, OLLAMA_URL, AnalyzeRequest, Message, build_prompt

CATEGORIES = ("mentions", "tasks", "important", "decisions", "deadlines")
CASES_PATH = Path(__file__).with_name("evaluation_cases.json")


def calculate_metrics(tp: int, fp: int, fn: int) -> dict[str, float | int]:
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    return {
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "tp": tp,
        "fp": fp,
        "fn": fn,
    }


def score_predictions(
    cases: list[dict[str, Any]],
    predictions: list[dict[str, bool]],
) -> dict[str, dict[str, float | int]]:
    if len(cases) != len(predictions):
        raise ValueError("Each evaluation case must have exactly one prediction.")

    scores: dict[str, dict[str, float | int]] = {}
    total_tp = total_fp = total_fn = 0

    for category in CATEGORIES:
        tp = fp = fn = 0
        for case, prediction in zip(cases, predictions):
            expected = bool(case["expected"][category])
            actual = bool(prediction[category])
            if expected and actual:
                tp += 1
            elif actual:
                fp += 1
            elif expected:
                fn += 1

        scores[category] = calculate_metrics(tp, fp, fn)
        total_tp += tp
        total_fp += fp
        total_fn += fn

    scores["micro overall"] = calculate_metrics(total_tp, total_fp, total_fn)
    return scores


async def predict(case: dict[str, Any], client: httpx.AsyncClient) -> dict[str, bool]:
    request = AnalyzeRequest(
        name=case["name"],
        mode="summary",
        messages=[Message(**message) for message in case["messages"]],
    )
    response = await client.post(
        OLLAMA_URL,
        json={
            "model": MODEL,
            "messages": [{"role": "user", "content": build_prompt(request)}],
            "stream": False,
            "format": "json",
            "options": {"temperature": 0.1},
        },
    )
    response.raise_for_status()
    content = response.json()["message"]["content"]
    result = json.loads(content)
    return {
        category: bool(result.get(category))
        for category in CATEGORIES
    }


async def run_evaluation() -> None:
    cases = json.loads(CASES_PATH.read_text(encoding="utf-8"))
    async with httpx.AsyncClient(timeout=120) as client:
        predictions = [await predict(case, client) for case in cases]

    scores = score_predictions(cases, predictions)
    print(f"Model: {MODEL}")
    print(f"Labeled chats: {len(cases)}")
    print(f"Binary category decisions: {len(cases) * len(CATEGORIES)}")
    print(f"{'Category':<22} {'Precision':>10} {'Recall':>10} {'F1':>10} {'TP':>5} {'FP':>5} {'FN':>5}")
    for category, score in scores.items():
        label = category.title()
        print(
            f"{label:<22} "
            f"{score['precision'] * 100:>9.1f}% "
            f"{score['recall'] * 100:>9.1f}% "
            f"{score['f1'] * 100:>9.1f}% "
            f"{score['tp']:>5} {score['fp']:>5} {score['fn']:>5}"
        )
    print("Mismatches:")
    for case, prediction in zip(cases, predictions):
        mismatches = [
            category
            for category in CATEGORIES
            if bool(case["expected"][category]) != prediction[category]
        ]
        if mismatches:
            print(f"- {case['id']}: {', '.join(mismatches)}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Evaluate the local MIA prompt against its small labeled pilot set."
    )
    parser.parse_args()
    asyncio.run(run_evaluation())


if __name__ == "__main__":
    main()
