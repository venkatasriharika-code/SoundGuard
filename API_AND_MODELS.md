# SoundGuard API and stronger models

## Internal audio API

`POST /api/analyze-audio?filename=<name>` accepts a raw PCM WAV request body with `Content-Type: audio/wav`, `audio/x-wav`, or `application/octet-stream`. The endpoint returns duration, sample rate, channel count, RMS, peak, zero-crossing rate, spectral centroid, autoencoder reconstruction score, KNN novelty score, a combined `normal`/`review`/`high` decision, and a calibration note. No external API key is required. The first version intentionally supports PCM WAV so the service can remain dependency-light; MP3, OGG, and browser WebM clips should be converted to PCM WAV before analysis.

The service is designed for explicit user-triggered uploads from Detection Studio. It does not silently record, persist, or upload microphone audio. Thresholds are illustrative until calibrated with machine-specific factory data and validated against technician outcomes.

## Stronger benchmark models

Run the NumPy-only experiment with:

```bash
PYTHONPATH=ml python3 ml/train_stronger_models.py \
  --train ml/data/dev_train_embeddings.npz \
  --test ml/data/dev_test_embeddings.npz \
  --metadata ml/data/dev_metadata.csv \
  --output ml/artifacts/stronger
```

The shallow autoencoder learns a linear low-dimensional bottleneck using randomized power iteration and scores reconstruction error. The KNN detector samples bounded normal prototypes and scores the mean distance to the nearest five prototypes. Both models use the 99th percentile of normal training scores as their threshold. Their metrics and row-level scores are saved in `ml/artifacts/stronger/` and remain local because benchmark data is ignored by Git.

These are transparent research baselines, not deployment claims. The next experiment should use machine-wise calibration, sensor-placement metadata, temporal windows, and a held-out factory pilot with human-confirmed maintenance outcomes.
