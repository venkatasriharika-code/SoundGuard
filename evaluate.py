"""Score DCASE test files through your DEPLOYED site and report AUC / recall / false-alarm rate.
Usage: python evaluate.py --url https://YOUR-APP.vercel.app --dir <path>/pump/test --machine pump --id 04 --limit 50
Needs: pip install requests scikit-learn   (files must be under ~4 MB; DCASE clips are ~0.3 MB)"""
import argparse, glob, os, requests
from sklearn.metrics import roc_auc_score
ap = argparse.ArgumentParser(); ap.add_argument('--url', required=True); ap.add_argument('--dir', required=True)
ap.add_argument('--machine', default='pump'); ap.add_argument('--id', default='04'); ap.add_argument('--limit', type=int, default=50)
a = ap.parse_args()
files = {k: sorted(glob.glob(os.path.join(a.dir, f'{k}_id_{a.id}_*.wav')))[:a.limit] for k in ('normal', 'anomaly')}
y, s, thr = [], [], None
for label, fs in files.items():
    for f in fs:
        r = requests.post(a.url.rstrip('/') + f'/api/analyze-audio?machine={a.machine}&machineId={a.id}',
                          data=open(f, 'rb').read(), headers={'Content-Type': 'audio/wav'}, timeout=120).json()
        if 'error' in r: raise SystemExit(f"{os.path.basename(f)}: {r['error']}")
        y.append(int(label == 'anomaly')); s.append(r['score']); thr = r.get('threshold')
print(f'files: {y.count(0)} normal, {y.count(1)} anomalous; threshold={thr}')
print(f'AUC = {roc_auc_score(y, s):.4f}')
if thr:
    tp = sum(1 for yy, ss in zip(y, s) if yy and ss > thr); fp = sum(1 for yy, ss in zip(y, s) if not yy and ss > thr)
    print(f'recall = {tp / max(1, y.count(1)):.2%}   false-alarm rate = {fp / max(1, y.count(0)):.2%}')
print('Compare AUC with results.csv for this machine ID; they should agree within a few points.')
