"""Train a machine-wise normal-envelope baseline on DCASE/MIMII embeddings."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np

from train_baseline import classification_metrics, labels_for_paths, load_archive, read_metadata, write_scores


def machine_type(path: str) -> str:
    name = Path(path).name
    return name.split("_section", 1)[0]


def fit_models(features: np.ndarray, paths: np.ndarray) -> dict[str, dict[str, object]]:
    models: dict[str, dict[str, object]] = {}
    for group in sorted({machine_type(path) for path in paths}):
        group_features = features[[machine_type(path) == group for path in paths]]
        mean = group_features.mean(axis=0)
        scale = group_features.std(axis=0)
        scale[scale < 1e-8] = 1.0
        train_scores = np.sqrt(np.mean(((group_features - mean) / scale) ** 2, axis=1))
        models[group] = {
            "mean": mean,
            "scale": scale,
            "threshold": float(np.quantile(train_scores, 0.99)),
            "normal_rows": int(len(group_features)),
        }
    return models


def score_models(features: np.ndarray, paths: np.ndarray, models: dict[str, dict[str, object]]) -> tuple[np.ndarray, np.ndarray]:
    scores = np.zeros(len(features), dtype=float)
    thresholds = np.zeros(len(features), dtype=float)
    fallback = next(iter(models.values()))
    for index, path in enumerate(paths):
        model = models.get(machine_type(path), fallback)
        mean = np.asarray(model["mean"])
        scale = np.asarray(model["scale"])
        scores[index] = float(np.sqrt(np.mean(((features[index] - mean) / scale) ** 2)))
        thresholds[index] = float(model["threshold"])
    return scores, thresholds


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train", type=Path, required=True)
    parser.add_argument("--test", type=Path, required=True)
    parser.add_argument("--metadata", type=Path)
    parser.add_argument("--output", type=Path, default=Path("ml/artifacts/machinewise"))
    args = parser.parse_args()

    train = load_archive(args.train)
    test = load_archive(args.test)
    if train["paths"] is None or test["paths"] is None:
        raise ValueError("Machine-wise training requires file paths in the embedding archives.")
    metadata = read_metadata(args.metadata)
    train_labels = labels_for_paths(train["paths"], train["labels"], metadata)
    test_labels = labels_for_paths(test["paths"], test["labels"], metadata)
    if train_labels is not None and np.any(train_labels != 0):
        train_mask = train_labels == 0
        train_features = train["features"][train_mask]
        train_paths = train["paths"][train_mask]
    else:
        train_features = train["features"]
        train_paths = train["paths"]
    models = fit_models(train_features, train_paths)
    test_scores, thresholds = score_models(test["features"], test["paths"], models)
    predictions = (test_scores > thresholds).astype(int)
    metrics = classification_metrics(test_labels, test_scores, float(np.median(thresholds)))
    if test_labels is not None:
        metrics = classification_metrics(test_labels, test_scores, float(np.median(thresholds)))
        # Recompute exact machine-wise confusion metrics because thresholds vary by machine.
        actual = test_labels == 1
        predicted = predictions == 1
        tp = int(np.sum(predicted & actual)); tn = int(np.sum(~predicted & ~actual))
        fp = int(np.sum(predicted & ~actual)); fn = int(np.sum(~predicted & actual))
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        metrics = {
            "samples": int(len(test_labels)), "normal_samples": int(np.sum(~actual)),
            "anomalous_samples": int(np.sum(actual)), "true_positive": tp, "true_negative": tn,
            "false_positive": fp, "false_negative": fn, "precision": round(precision, 6),
            "recall": round(recall, 6), "f1": round(f1, 6),
            "accuracy": round(float(np.mean(predicted == actual)), 6),
        }

    args.output.mkdir(parents=True, exist_ok=True)
    serializable_models = {
        group: {"threshold": round(float(model["threshold"]), 8), "normal_rows": model["normal_rows"]}
        for group, model in models.items()
    }
    card = {
        "experiment": "soundguard_machinewise_embedding_distance_baseline",
        "task": "unsupervised anomalous sound detection",
        "method": "one normal standardized embedding envelope and 99th-percentile threshold per machine type",
        "training_rows": int(len(train_features)), "evaluation_rows": int(len(test["features"])),
        "machine_models": serializable_models, "metrics": metrics,
        "limitations": [
            "This remains a transparent benchmark baseline, not a production deployment model.",
            "Machine-type groupings and public benchmark domains do not replace factory calibration.",
        ],
    }
    (args.output / "model_card.json").write_text(json.dumps(card, indent=2) + "\n", encoding="utf-8")
    (args.output / "metrics.json").write_text(json.dumps(metrics or {"status": "labels unavailable"}, indent=2) + "\n", encoding="utf-8")
    write_scores(args.output / "test_scores.csv", test_labels, test_scores, float(np.median(thresholds)), test["paths"])
    print(json.dumps(card, indent=2))


if __name__ == "__main__":
    main()
