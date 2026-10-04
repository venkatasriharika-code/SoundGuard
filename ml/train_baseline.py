"""Train and evaluate a transparent industrial-audio anomaly baseline.

The script expects public DCASE/MIMII-derived embedding archives. It learns the
normal operating envelope from the training archive, scores samples by their
standardized embedding distance, and evaluates a threshold on a held-out test
archive when labels are available.
"""
from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from typing import Any

import numpy as np

LABEL_KEYS = ("label", "labels", "y", "target", "targets")
FEATURE_KEYS = ("X", "x", "embeddings", "features", "data")
PATH_KEYS = ("path", "paths", "filename", "filenames", "file_name", "file_names")


def unwrap(value: object) -> dict[str, object] | None:
    if isinstance(value, dict):
        return value
    if isinstance(value, np.ndarray) and value.shape == () and value.dtype == object:
        item = value.item()
        return item if isinstance(item, dict) else None
    return None


def first_matching(archive: Any, keys: tuple[str, ...], *, ndim: int | None = None) -> np.ndarray | None:
    for key in keys:
        if key not in archive.files:
            continue
        value = np.asarray(archive[key])
        if ndim is None or value.ndim == ndim:
            return value
    return None


def choose_features(archive: Any) -> tuple[str, np.ndarray, np.ndarray | None]:
    # The Renumics archive stores a mapping from audio path to embedding vector
    # inside a scalar object array. Preserve those paths for metadata joins.
    for key in archive.files:
        payload = unwrap(archive[key])
        if payload is not None and payload:
            paths = np.asarray(list(payload.keys()), dtype=str)
            values = [np.asarray(value, dtype=np.float64).reshape(-1) for value in payload.values()]
            dimensions = {len(value) for value in values}
            if len(dimensions) != 1:
                raise ValueError(f"Feature vectors in {key} have inconsistent dimensions: {dimensions}")
            return key, np.vstack(values), paths

    candidates: list[tuple[str, np.ndarray]] = []
    for key in archive.files:
        value = np.asarray(archive[key])
        if value.ndim == 2 and np.issubdtype(value.dtype, np.number):
            candidates.append((key, value.astype(np.float64)))
    for key in FEATURE_KEYS:
        for candidate_key, value in candidates:
            if candidate_key.lower() == key.lower():
                return candidate_key, value, first_matching(archive, PATH_KEYS, ndim=1)
    if not candidates:
        raise ValueError(f"No numeric 2-D feature matrix found. Keys: {archive.files}")
    feature_key, features = max(candidates, key=lambda item: item[1].shape[1])
    return feature_key, features, first_matching(archive, PATH_KEYS, ndim=1)


def load_archive(path: Path) -> dict[str, Any]:
    archive = np.load(path, allow_pickle=True)
    feature_key, features, paths = choose_features(archive)
    labels = first_matching(archive, LABEL_KEYS, ndim=1)
    return {
        "path": path,
        "archive": archive,
        "feature_key": feature_key,
        "features": features,
        "labels": None if labels is None else labels,
        "paths": None if paths is None else paths.astype(str),
    }


def read_metadata(path: Path | None) -> dict[str, int]:
    if path is None:
        return {}
    labels: dict[str, int] = {}
    with path.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            raw = str(row.get("label", row.get("anomaly", ""))).strip().lower()
            if raw in {"1", "true", "anomaly", "anomalous", "abnormal", "faulty"}:
                labels[str(row.get("path", ""))] = 1
            elif raw in {"0", "false", "normal", "healthy"}:
                labels[str(row.get("path", ""))] = 0
    return labels


def labels_for_paths(paths: np.ndarray | None, archive_labels: np.ndarray | None, metadata: dict[str, int]) -> np.ndarray | None:
    if archive_labels is not None:
        values = np.asarray(archive_labels).reshape(-1)
        normalized: list[int] = []
        for value in values:
            raw = str(value).strip().lower()
            normalized.append(1 if raw in {"1", "true", "anomaly", "anomalous", "abnormal", "faulty"} else 0)
        return np.asarray(normalized, dtype=int)
    if paths is None or not metadata:
        return None
    if not all(str(path) in metadata for path in paths):
        return None
    return np.asarray([metadata[str(path)] for path in paths], dtype=int)


def normal_mask(labels: np.ndarray | None, count: int) -> np.ndarray:
    if labels is None:
        return np.ones(count, dtype=bool)
    return labels == 0


def fit_normal_envelope(features: np.ndarray, labels: np.ndarray | None) -> dict[str, np.ndarray | float | int]:
    mask = normal_mask(labels, len(features))
    normal = features[mask]
    if len(normal) == 0:
        raise ValueError("The training archive contains no normal examples (label 0).")
    mean = normal.mean(axis=0)
    scale = normal.std(axis=0)
    scale[scale < 1e-8] = 1.0
    train_scores = np.sqrt(np.mean(((normal - mean) / scale) ** 2, axis=1))
    threshold = float(np.quantile(train_scores, 0.99))
    return {"mean": mean, "scale": scale, "threshold": threshold, "normal_count": len(normal)}


def score(features: np.ndarray, envelope: dict[str, np.ndarray | float | int]) -> np.ndarray:
    mean = np.asarray(envelope["mean"])
    scale = np.asarray(envelope["scale"])
    return np.sqrt(np.mean(((features - mean) / scale) ** 2, axis=1))


def classification_metrics(labels: np.ndarray | None, scores: np.ndarray, threshold: float) -> dict[str, float | int] | None:
    if labels is None or len(labels) != len(scores):
        return None
    predicted = scores > threshold
    actual = labels == 1
    tp = int(np.sum(predicted & actual))
    tn = int(np.sum(~predicted & ~actual))
    fp = int(np.sum(predicted & ~actual))
    fn = int(np.sum(~predicted & actual))
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if precision + recall else 0.0
    accuracy = (tp + tn) / len(labels) if len(labels) else 0.0
    return {
        "samples": int(len(labels)),
        "normal_samples": int(np.sum(~actual)),
        "anomalous_samples": int(np.sum(actual)),
        "true_positive": tp,
        "true_negative": tn,
        "false_positive": fp,
        "false_negative": fn,
        "precision": round(precision, 6),
        "recall": round(recall, 6),
        "f1": round(f1, 6),
        "accuracy": round(accuracy, 6),
    }


def write_scores(path: Path, labels: np.ndarray | None, scores: np.ndarray, threshold: float, paths: np.ndarray | None) -> None:
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(["row", "path", "label", "score", "predicted_anomaly"])
        for index, value in enumerate(scores):
            label = "" if labels is None else int(labels[index])
            name = "" if paths is None else paths[index]
            writer.writerow([index, name, label, f"{value:.8f}", int(value > threshold)])


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train", type=Path, required=True)
    parser.add_argument("--test", type=Path, required=True)
    parser.add_argument("--metadata", type=Path)
    parser.add_argument("--output", type=Path, default=Path("ml/artifacts"))
    args = parser.parse_args()

    train = load_archive(args.train)
    test = load_archive(args.test)
    metadata = read_metadata(args.metadata)
    train_labels = labels_for_paths(train["paths"], train["labels"], metadata)
    test_labels = labels_for_paths(test["paths"], test["labels"], metadata)
    envelope = fit_normal_envelope(train["features"], train_labels)
    test_scores = score(test["features"], envelope)
    metrics = classification_metrics(test_labels, test_scores, float(envelope["threshold"]))

    args.output.mkdir(parents=True, exist_ok=True)
    model_card = {
        "experiment": "soundguard_embedding_distance_baseline",
        "task": "unsupervised anomalous sound detection",
        "training_source": str(args.train),
        "evaluation_source": str(args.test),
        "feature_key": train["feature_key"],
        "feature_dimension": int(train["features"].shape[1]),
        "training_rows": int(len(train["features"])),
        "normal_training_rows": int(envelope["normal_count"]),
        "method": "standardized root-mean-square embedding deviation from the normal training centroid",
        "threshold_rule": "99th percentile of normal training scores",
        "threshold": round(float(envelope["threshold"]), 8),
        "metrics": metrics,
        "limitations": [
            "This is a transparent benchmark baseline, not a production deployment model.",
            "The public benchmark does not represent SoundGuard factory-pilot recordings.",
            "A real deployment needs machine-wise splits, sensor-placement controls, calibration monitoring, and human review.",
        ],
    }
    with (args.output / "model_card.json").open("w", encoding="utf-8") as handle:
        json.dump(model_card, handle, indent=2)
        handle.write("\n")
    write_scores(args.output / "test_scores.csv", test_labels, test_scores, float(envelope["threshold"]), test["paths"])
    with (args.output / "metrics.json").open("w", encoding="utf-8") as handle:
        json.dump(metrics or {"status": "labels unavailable"}, handle, indent=2)
        handle.write("\n")

    print(json.dumps(model_card, indent=2))


if __name__ == "__main__":
    main()
