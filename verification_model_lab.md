# SoundGuard upgrade verification

## 2026-09-12

The existing WebDev-backed project loaded cleanly from the `main` branch. TypeScript and the production build both passed after the model-lab update.

The new Model lab navigation item was browser-verified. It renders the reproducible DCASE benchmark run with 7,000 normal training windows, 1,400 held-out evaluation windows, 2,976-dimensional baseline-AE embeddings, a P99 threshold label, global baseline metrics, the machine-wise comparison, and an explicit domain-shift interpretation. The page separates benchmark-only results from the proposed field-validation plan.

The automatic Pump Assembly C English-then-Hindi risk advisory also continued to trigger as designed during browser verification; it was closed before opening the Model lab. This confirms the new navigation did not remove the existing safety-critical demonstration path.

The first real-data baseline run used downloaded DCASE/MIMII-derived benchmark embeddings and metadata. The global standardized envelope produced precision 0.381, recall 0.011, F1 0.022, and accuracy 0.496 on the held-out development test. The machine-wise version produced precision 0.219, recall 0.023, F1 0.041, and accuracy 0.471. These results are retained as honest research evidence and are explicitly labelled as insufficient for production.
