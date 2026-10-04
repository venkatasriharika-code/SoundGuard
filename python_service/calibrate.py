from __future__ import annotations

import argparse, csv, json, re
from pathlib import Path
import librosa, numpy as np, torch
from app import AutoEncoder, FRAMES, SR_MEL, load_model
from sklearn.metrics import roc_auc_score


def frames_for(path: Path):
    y, sr = librosa.load(path, sr=None, mono=True)
    mel = librosa.feature.melspectrogram(y=y, sr=sr, **SR_MEL)
    logmel = 20.0 / SR_MEL["power"] * np.log10(mel + np.finfo(float).eps)
    n_mels, time = logmel.shape; n_vec = time - FRAMES + 1
    vec = np.zeros((max(0, n_vec), n_mels * FRAMES), dtype=np.float32)
    for offset in range(FRAMES): vec[:, n_mels * offset:n_mels * (offset + 1)] = logmel[:, offset:offset + n_vec].T
    return vec, sr


def score(path: Path, key: str) -> float:
    model, mu, sd = load_model(key)
    x, _ = frames_for(path)
    with torch.no_grad():
        z = torch.tensor((x - mu) / sd, dtype=torch.float32)
        return float(np.mean((model(z).numpy() - z.numpy()) ** 2))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--data-root', type=Path, required=True)
    ap.add_argument('--output', type=Path, default=Path('python_service/calibration.json'))
    ap.add_argument('--validation-output', type=Path, default=Path('python_service/validation.json'))
    ap.add_argument('--machine', default='pump'); ap.add_argument('--machine-id', default='04')
    ap.add_argument('--limit', type=int, default=0)
    args = ap.parse_args()
    key = f'{args.machine}_id_{args.machine_id.zfill(2)}'
    train = sorted((args.data_root / args.machine / 'train').glob(f'normal_id_{args.machine_id.zfill(2)}_*.wav'))
    normal = sorted((args.data_root / args.machine / 'test').glob(f'normal_id_{args.machine_id.zfill(2)}_*.wav'))
    anomaly = sorted((args.data_root / args.machine / 'test').glob(f'anomaly_id_{args.machine_id.zfill(2)}_*.wav'))
    if args.limit: train, normal, anomaly = train[:args.limit], normal[:args.limit], anomaly[:args.limit]
    if not train or not normal or not anomaly: raise SystemExit(f'Missing files for {key}: train={len(train)} normal={len(normal)} anomaly={len(anomaly)}')
    train_scores = [score(p, key) for p in train]
    threshold = float(np.quantile(train_scores, .95))
    selected_normal, selected_anomaly = normal[:20], anomaly[:20]
    y = [0] * len(selected_normal) + [1] * len(selected_anomaly)
    scores = [score(p, key) for p in selected_normal + selected_anomaly]
    predicted = [s > threshold for s in scores]
    tp = sum(p and yv for p, yv in zip(predicted, y)); fn = sum((not p) and yv for p, yv in zip(predicted, y)); fp = sum(p and not yv for p, yv in zip(predicted, y)); tn = sum((not p) and not yv for p, yv in zip(predicted, y))
    result = {'key': key, 'machine': args.machine, 'id': args.machine_id.zfill(2), 'threshold95': threshold, 'normal_training_files': len(train), 'validation_normal_files': len(selected_normal), 'validation_anomaly_files': len(selected_anomaly), 'auc': float(roc_auc_score(y, scores)), 'recall': tp / (tp + fn) if tp + fn else 0, 'false_alarm_rate': fp / (fp + tn) if fp + tn else 0, 'confusion': {'tp': tp, 'tn': tn, 'fp': fp, 'fn': fn}}
    existing = {}
    if args.output.exists(): existing = json.loads(args.output.read_text())
    existing[key] = {**result, 'reliability': 'strongest live-demo ID' if key in {'pump_id_04','slider_id_00','ToyCar_id_04','ToyCar_id_02'} else 'lower reliability'}
    args.output.write_text(json.dumps(existing, indent=2) + '\n')
    args.validation_output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))

if __name__ == '__main__': main()
