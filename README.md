# SoundGuard

**SoundGuard** is an evidence-led acoustic condition-monitoring workbench for small and medium-sized manufacturers. It helps maintenance teams establish a machine-specific acoustic baseline, detect meaningful deviation, and connect an alert to a concrete next action instead of presenting an unexplained risk score.

The live product prototype is available at [soundguard-auwq4wca.manus.space](https://soundguard-auwq4wca.manus.space/).

> **Project status:** portfolio prototype with a reproducible benchmark baseline in progress. The interface is deliberately explicit about the difference between public benchmark evidence, simulated product flows, and future factory-pilot measurements.

## Why this project matters

Most predictive-maintenance demos jump from a sensor to a prediction without showing how a technician would trust or act on it. SoundGuard treats the maintenance workflow as part of the system: each machine has its own calibration record, alerts include an acoustic fingerprint and explanation, and the maintenance ledger records acknowledgement and follow-up action.

The current frontend demonstrates:

- machine-specific baseline and health monitoring;
- continuous edge-monitoring states with threshold-based escalation;
- normal and anomalous benchmark-audio playback;
- browser-local microphone capture and audio-file inspection;
- automatic English-then-Hindi risk advisories;
- machine onboarding with explicit calibration requirements; and
- a pilot-evidence view that labels proposed targets separately from measured results.

## Technical direction

The first reproducible ML experiment uses public DCASE 2023 Task 2 / MIMII-derived acoustic embeddings. It fits a simple unsupervised baseline using only normal training examples, computes standardized embedding deviation, and evaluates a threshold on the held-out development test set. This is intentionally a transparent baseline rather than a claim of production-ready performance.

The next research increments are:

1. compare embedding-distance, autoencoder, and one-class methods;
2. report machine-wise and domain-wise metrics rather than one aggregate score;
3. validate threshold stability under background-noise and operating-state shifts; and
4. replace benchmark evidence with consented, machine-specific factory recordings before making deployment or ROI claims.

## Repository layout

```text
client/                 React + Vite frontend for the SoundGuard workbench
ml/                     Reproducible benchmark training and evaluation scripts
  data/                 Downloaded benchmark data; ignored by Git
  artifacts/            Local model cards, metrics, and score files; ignored by Git
  train_baseline.py     Transparent embedding-distance baseline
  inspect_npz.py        Dataset-shape and key inspection helper
audio_sources.md        Dataset provenance and license notes
ideas.md                Product and visual design decisions
validation_notes.md     Browser verification and interaction evidence
todo.md                 Completed prototype work and next milestones
```

## Run the frontend

```bash
pnpm install
pnpm run dev
```

For a production build:

```bash
pnpm run check
pnpm run build
```

## Reproduce the ML baseline

The training data is not committed to the repository. Download the public DCASE 2023 Task 2 enriched repository's development metadata and baseline embeddings into `ml/data/`, then run:

```bash
python3 ml/train_baseline.py \
  --train ml/data/dev_train_embeddings.npz \
  --test ml/data/dev_test_embeddings.npz \
  --metadata ml/data/dev_metadata.csv \
  --output ml/artifacts
```

The command writes a portable JSON model card, evaluation metrics, and row-level scores to `ml/artifacts/`. It does not upload audio or send recordings to a server.

## Data provenance and responsible claims

The demo audio and benchmark features come from the public DCASE/MIMII ecosystem. MIMII was released by Hitachi under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), while the DCASE 2023 development dataset is described as [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). See [`audio_sources.md`](audio_sources.md) and the generated model card for the exact sources used in an experiment.

SoundGuard does **not** present benchmark recordings as factory-pilot recordings. Any metric displayed in the product must be labelled as benchmark, illustrative, proposed, or measured. A real deployment would require consented recordings, a documented sensor placement protocol, machine-wise splits, calibration monitoring, and a human review process for alerts.

## Git and public repository handoff

This project currently has a clean WebDev-backed Git history on `main`. To publish a copy to a personal GitHub repository, create an empty repository and add it as a separate remote rather than replacing the WebDev remote:

```bash
git remote add github https://github.com/<your-account>/<your-repository>.git
git push -u github main
```

Do not commit `.env` files, project credentials, downloaded datasets, or generated secrets. The existing `.gitignore` excludes the WebDev metadata, dependencies, build output, and local ML data/artifacts.

## License

The application code is intended to be released under the MIT License. Dataset files and benchmark-derived media remain subject to their original licenses and attribution requirements.
