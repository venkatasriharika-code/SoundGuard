"""Train shallow autoencoder and KNN novelty baselines without external ML packages.

The autoencoder is a linear bottleneck learned with randomized power iteration;
the KNN detector compares each sample with a bounded set of normal prototypes.
Both methods are intentionally transparent and suitable for benchmark iteration,
not production deployment.
"""
from __future__ import annotations
import argparse, json
from pathlib import Path
import numpy as np
from train_baseline import classification_metrics, labels_for_paths, load_archive, read_metadata, write_scores


def fit_autoencoder(x: np.ndarray, latent: int = 16, iterations: int = 3) -> dict[str, np.ndarray | float]:
    mean = x.mean(axis=0)
    centered = x - mean
    rng = np.random.default_rng(42)
    basis = rng.normal(size=(centered.shape[1], latent)).astype(np.float64)
    for _ in range(iterations):
        basis = centered.T @ (centered @ basis)
        basis, _ = np.linalg.qr(basis)
    reconstruction = (centered @ basis) @ basis.T + mean
    scores = np.sqrt(np.mean((x - reconstruction) ** 2, axis=1))
    return {"mean": mean, "basis": basis, "threshold": float(np.quantile(scores, 0.99))}


def autoencoder_score(x: np.ndarray, model: dict[str, np.ndarray | float]) -> np.ndarray:
    mean = np.asarray(model["mean"]); basis = np.asarray(model["basis"])
    reconstruction = ((x - mean) @ basis) @ basis.T + mean
    return np.sqrt(np.mean((x - reconstruction) ** 2, axis=1))


def fit_knn(x: np.ndarray, max_prototypes: int = 512, neighbors: int = 5) -> dict[str, np.ndarray | float | int]:
    rng = np.random.default_rng(42)
    indices = rng.choice(len(x), size=min(max_prototypes, len(x)), replace=False)
    prototypes = x[indices]
    scores = knn_score(x, prototypes, neighbors)
    return {"prototypes": prototypes, "neighbors": neighbors, "threshold": float(np.quantile(scores, 0.99))}


def knn_score(x: np.ndarray, prototypes: np.ndarray, neighbors: int) -> np.ndarray:
    output = np.empty(len(x), dtype=np.float64)
    for start in range(0, len(x), 256):
        batch = x[start:start + 256]
        distances = np.sqrt(np.maximum(0, ((batch[:, None, :] - prototypes[None, :, :]) ** 2).mean(axis=2)))
        output[start:start + len(batch)] = np.mean(np.partition(distances, min(neighbors, len(prototypes)) - 1, axis=1)[:, :neighbors], axis=1)
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--train", type=Path, required=True); parser.add_argument("--test", type=Path, required=True)
    parser.add_argument("--metadata", type=Path); parser.add_argument("--output", type=Path, default=Path("ml/artifacts/stronger"))
    parser.add_argument("--latent", type=int, default=16); parser.add_argument("--prototypes", type=int, default=512)
    args = parser.parse_args()
    train, test = load_archive(args.train), load_archive(args.test)
    metadata = read_metadata(args.metadata)
    train_labels = labels_for_paths(train["paths"], train["labels"], metadata)
    test_labels = labels_for_paths(test["paths"], test["labels"], metadata)
    normal = train["features"] if train_labels is None else train["features"][train_labels == 0]
    ae = fit_autoencoder(normal, args.latent)
    knn = fit_knn(normal, args.prototypes)
    ae_scores, knn_scores = autoencoder_score(test["features"], ae), knn_score(test["features"], np.asarray(knn["prototypes"]), int(knn["neighbors"]))
    args.output.mkdir(parents=True, exist_ok=True)
    results = {}
    for name, scores, threshold in (("autoencoder", ae_scores, float(ae["threshold"])), ("knn", knn_scores, float(knn["threshold"]))):
        metrics = classification_metrics(test_labels, scores, threshold)
        results[name] = {"threshold": threshold, "metrics": metrics}
        write_scores(args.output / f"{name}_test_scores.csv", test_labels, scores, threshold, test["paths"])
    card = {"experiment": "soundguard_stronger_models", "task": "unsupervised anomalous sound detection", "autoencoder": {"method": "linear bottleneck reconstruction error", "latent_dimensions": args.latent}, "knn": {"method": "mean distance to nearest normal prototypes", "prototypes": min(args.prototypes, len(normal)), "neighbors": int(knn["neighbors"])}, "results": results, "limitations": ["These are benchmark baselines, not production deployment models.", "Thresholds must be calibrated per machine and sensor location with factory audio."]}
    (args.output / "model_card.json").write_text(json.dumps(card, indent=2) + "\n", encoding="utf-8")
    (args.output / "metrics.json").write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(card, indent=2))

if __name__ == "__main__": main()
