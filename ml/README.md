# SoundGuard model baseline

This directory contains a reproducible, deliberately transparent anomaly-detection baseline for the SoundGuard portfolio project.

## Data used

The experiment uses the DCASE 2023 Task 2 development split mirrored in the public `renumics/dcase23-task2-enriched` dataset repository. The downloaded inputs are:

- `dev_train_embeddings.npz`: 7,000 normal training examples represented by the DCASE baseline-AE embedding vector;
- `dev_test_embeddings.npz`: 1,400 held-out development-test examples; and
- `dev_metadata.csv`: path, machine type, domain, section, and normal/anomaly labels.

The files are intentionally kept out of Git because the repository is a code and product portfolio, not a dataset mirror. The dataset card describes 10-second single-channel recordings from ToyCar, ToyTrain, Fan, Gearbox, Bearing, Slide rail, and Valve machines, and documents the DCASE/MIMII/ToyADMOS provenance and licensing.

## Baselines

`train_baseline.py` fits one standardized normal envelope over the training embeddings and sets an anomaly threshold at the 99th percentile of normal training scores. `train_machinewise_baseline.py` applies the same idea separately to each machine type, which mirrors SoundGuard's product principle that every listening point needs its own calibration record.

The current experiment is intentionally informative rather than flattering. On the held-out cross-domain development test, the global baseline produced precision **0.381**, recall **0.011**, F1 **0.022**, and accuracy **0.496**. The machine-wise version produced precision **0.219**, recall **0.023**, F1 **0.041**, and accuracy **0.471**. These results show that a simple standardized distance is not sufficient for robust anomaly detection under domain shift; they should not be presented as production performance.

The next modeling milestone is therefore not to hide this result but to improve it through controlled comparisons: machine-wise normalization, compact autoencoder reconstruction error, k-nearest-neighbour novelty scores, threshold calibration on a validation slice, and machine/domain-wise reporting. Every experiment should keep the public benchmark label separate from future consented factory data.

## Reproduce

```bash
python3 ml/inspect_npz.py ml/data/dev_train_embeddings.npz
python3 ml/inspect_npz.py ml/data/dev_test_embeddings.npz

python3 ml/train_baseline.py \
  --train ml/data/dev_train_embeddings.npz \
  --test ml/data/dev_test_embeddings.npz \
  --metadata ml/data/dev_metadata.csv \
  --output ml/artifacts

PYTHONPATH=ml python3 ml/train_machinewise_baseline.py \
  --train ml/data/dev_train_embeddings.npz \
  --test ml/data/dev_test_embeddings.npz \
  --metadata ml/data/dev_metadata.csv \
  --output ml/artifacts/machinewise
```

## Interpretation guardrails

Benchmark clips and benchmark embeddings are **not** SoundGuard factory-pilot measurements. A portfolio reader should be able to tell which numbers are measured benchmark results, which are proposed product targets, and which are illustrative UI states. A deployment claim requires a documented machine-wise data split, sensor placement, calibration period, alert-review protocol, and field outcome log.
