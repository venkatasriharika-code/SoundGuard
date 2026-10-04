# SoundGuard model card

## Model identity

**Name:** SoundGuard embedding-distance baseline  
**Task:** Unsupervised anomalous sound detection  
**Status:** Research baseline for portfolio demonstration; not production-ready.

## Intended use

This model is intended to make the SoundGuard approach reproducible and inspectable on a public industrial-audio benchmark. It is useful for comparing feature representations, normalization strategies, and thresholding methods while the project is still collecting consented machine-specific recordings.

It is not intended to certify machine safety, replace a technician, or make an irreversible maintenance decision without human review.

## Training and evaluation data

The baseline uses the DCASE 2023 Task 2 development embeddings and metadata mirrored by the public Renumics dataset repository. The training split contains normal examples; the development test split contains normal and anomalous examples across seven machine types and source/target domains.

- Dataset card: <https://huggingface.co/datasets/renumics/dcase23-task2-enriched>
- Original DCASE Task 2: <https://dcase.community/challenge2023/task-first-shot-unsupervised-anomalous-sound-detection-for-machine-condition-monitoring>
- MIMII dataset record: <https://zenodo.org/records/3384388>

## Method

The baseline standardizes each embedding dimension using the mean and standard deviation of normal training examples. It scores a sample with the root-mean-square standardized deviation from the normal centroid. The operating threshold is the 99th percentile of normal training scores. The machine-wise variant fits one envelope and threshold per machine type.

## Current measured benchmark results

| Experiment | Precision | Recall | F1 | Accuracy | Evaluation split |
|---|---:|---:|---:|---:|---|
| Global standardized envelope | 0.381 | 0.011 | 0.022 | 0.496 | DCASE development test |
| Machine-wise standardized envelope | 0.219 | 0.023 | 0.041 | 0.471 | DCASE development test |

These results are retained because they are the actual output of the reproducible run. They indicate that this simple distance rule does not handle the benchmark's domain shift well enough for deployment.

## Limitations and risks

The benchmark is not a substitute for factory data. Public machine categories, background noise, operating states, microphones, and anomaly types may not match a target MSME plant. The displayed score is an anomaly indicator, not a probability of failure. Thresholds must be calibrated per listening point and reviewed against false alarms, missed events, and technician outcomes.

## Next validation steps

The next experiments should compare machine-wise normalization, reconstruction-error models, nearest-neighbour novelty scores, and controlled threshold calibration. Results should be reported by machine type and domain, with a locked evaluation split. Before any operational claim, the project needs consented field recordings, sensor-placement documentation, a maintenance-event ledger, and human-in-the-loop alert review.
