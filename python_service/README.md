# SoundGuard DCASE 2020 inference service

This service reproduces `soundguard.ipynb` exactly. It uses real uploaded DCASE 2020 Task 2 checkpoints.

## Exact preprocessing

- Audio is decoded as mono with its file sample rate preserved (the DCASE files are 16 kHz).
- `n_fft=1024`
- `hop_length=512`
- `n_mels=64`
- `power=2.0`
- Log scaling: `20.0 / power * log10(mel + finfo(float).eps)`
- Five consecutive frames are stacked into each 320-dimensional input vector.
- Each checkpoint's saved `mu` and `sd` are applied exactly as `(X - mu) / sd`.

## Model

The notebook's fully connected autoencoder is loaded from `{state, mu, sd}`. The score is the mean reconstruction MSE across all stacked frames in the uploaded file. A machine-ID-specific threshold is loaded from `calibration.json` and is the 95th percentile of scores on normal DCASE training files.

The service exposes `POST /analyze` and uses `x-soundguard-machine` and `x-soundguard-machine-id` headers. It returns raw score, threshold, score/threshold ratio, Normal/Anomaly verdict, and frame-level scores.

The model checkpoints and calibration inputs are real DCASE artifacts. No synthetic audio or placeholder inference is used.
