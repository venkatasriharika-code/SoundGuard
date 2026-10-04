"""SoundGuard inference core: numpy + stdlib only (no librosa/scipy/torch), so it fits in a Vercel Python function.
Reproduces soundguard.ipynb: log-mel (n_fft=1024, hop=512, 64 mels, power 2, slaney mel, 20/power*log10(mel+eps)),
5 stacked frames, (x-mu)/sd, autoencoder with BatchNorm folded in, score = mean squared error."""
from __future__ import annotations
import io, json, wave
from functools import lru_cache
from pathlib import Path
import numpy as np

HERE = Path(__file__).parent / "_models"
N_FFT, HOP, N_MELS, POWER, FRAMES = 1024, 512, 64, 2.0, 5
MAX_SECONDS = 60


def read_wav(data: bytes):
    """PCM WAV only (8/16/24/32-bit). Returns mono float32 in [-1, 1] and the sample rate."""
    try:
        w = wave.open(io.BytesIO(data))
    except Exception as e:
        raise ValueError("Only uncompressed PCM WAV files are supported.") from e
    sr, ch, width, n = w.getframerate(), w.getnchannels(), w.getsampwidth(), w.getnframes()
    raw = w.readframes(n)
    if width == 1:
        x = (np.frombuffer(raw, np.uint8).astype(np.float32) - 128.0) / 128.0
    elif width == 2:
        x = np.frombuffer(raw, "<i2").astype(np.float32) / 32768.0
    elif width == 3:
        b = np.frombuffer(raw, np.uint8).reshape(-1, 3)
        v = (b[:, 0].astype(np.int32) | (b[:, 1].astype(np.int32) << 8) | (b[:, 2].astype(np.int32) << 16))
        v = np.where(v >= 1 << 23, v - (1 << 24), v)
        x = v.astype(np.float32) / (1 << 23)
    elif width == 4:
        x = np.frombuffer(raw, "<i4").astype(np.float32) / 2147483648.0
    else:
        raise ValueError("Unsupported WAV sample width.")
    if ch > 1:
        x = x[: len(x) // ch * ch].reshape(-1, ch).mean(axis=1)
    return x, sr


TARGET_SR = 16000


def resample_to_16k(y: np.ndarray, sr: int) -> np.ndarray:
    """FFT resampling (ideal low-pass, numpy only). 16 kHz input is returned untouched, so DCASE files score exactly as before."""
    if sr == TARGET_SR or len(y) == 0:
        return y
    n_out = max(1, int(round(len(y) * TARGET_SR / sr)))
    X = np.fft.rfft(y.astype(np.float64))
    Y = np.zeros(n_out // 2 + 1, dtype=np.complex128)
    k = min(len(Y), len(X))
    Y[:k] = X[:k]
    return (np.fft.irfft(Y, n=n_out) * (n_out / len(y))).astype(np.float32)


def _hz_to_mel(f):
    f = np.asarray(f, dtype=np.float64)
    f_sp, min_log_hz = 200.0 / 3, 1000.0
    min_log_mel, logstep = min_log_hz / f_sp, np.log(6.4) / 27.0
    return np.where(f >= min_log_hz, min_log_mel + np.log(np.maximum(f, 1e-10) / min_log_hz) / logstep, f / f_sp)


def _mel_to_hz(m):
    m = np.asarray(m, dtype=np.float64)
    f_sp, min_log_hz = 200.0 / 3, 1000.0
    min_log_mel, logstep = min_log_hz / f_sp, np.log(6.4) / 27.0
    return np.where(m >= min_log_mel, min_log_hz * np.exp(logstep * (m - min_log_mel)), f_sp * m)


@lru_cache(maxsize=8)
def mel_filterbank(sr: int) -> np.ndarray:
    fft_f = np.linspace(0, sr / 2.0, 1 + N_FFT // 2)
    mel_f = _mel_to_hz(np.linspace(_hz_to_mel(0.0), _hz_to_mel(sr / 2.0), N_MELS + 2))
    fdiff = np.diff(mel_f)
    ramps = np.subtract.outer(mel_f, fft_f)
    lower, upper = -ramps[:-2] / fdiff[:-1, None], ramps[2:] / fdiff[1:, None]
    w = np.maximum(0, np.minimum(lower, upper))
    return (w * (2.0 / (mel_f[2:N_MELS + 2] - mel_f[:N_MELS]))[:, None]).astype(np.float32)


def log_mel(y: np.ndarray, sr: int) -> np.ndarray:
    y = np.pad(y.astype(np.float32), N_FFT // 2)                   # center=True, zero padding (librosa >= 0.10)
    n_frames = 1 + (len(y) - N_FFT) // HOP
    if n_frames < 1:
        return np.empty((N_MELS, 0), dtype=np.float32)
    idx = np.arange(N_FFT)[None, :] + HOP * np.arange(n_frames)[:, None]
    win = (0.5 - 0.5 * np.cos(2 * np.pi * np.arange(N_FFT) / N_FFT)).astype(np.float32)   # periodic Hann
    spec = np.abs(np.fft.rfft(y[idx] * win, axis=1)) ** POWER       # (frames, bins)
    mel = mel_filterbank(sr) @ spec.T.astype(np.float32)             # (mels, frames)
    return 20.0 / POWER * np.log10(mel + np.finfo(float).eps)


def stack_frames(lm: np.ndarray) -> np.ndarray:
    n_vec = lm.shape[1] - FRAMES + 1
    if n_vec < 1:
        return np.empty((0, N_MELS * FRAMES), dtype=np.float32)
    vec = np.zeros((n_vec, N_MELS * FRAMES), dtype=np.float32)
    for t in range(FRAMES):
        vec[:, N_MELS * t: N_MELS * (t + 1)] = lm[:, t: t + n_vec].T
    return vec


class Model:
    def __init__(self, path: Path):
        z = np.load(path)
        self.mu, self.sd = z["mu"].reshape(1, -1), z["sd"].reshape(1, -1)
        self.layers = [(z[f"W{i}"], z[f"b{i}"]) for i in range(int(z["n_layers"]))]

    def frame_errors(self, v):
        z = ((v - self.mu) / self.sd).astype(np.float32)
        h = z
        for i, (W, b) in enumerate(self.layers):
            h = h @ W.T + b
            if i < len(self.layers) - 1:
                h = np.maximum(h, 0.0)
        return ((h - z) ** 2).mean(axis=1)


@lru_cache(maxsize=4)
def load_model(key: str) -> Model:
    p = HERE / f"{key}.npz"
    if not p.exists():
        raise FileNotFoundError(key)
    return Model(p)


CAL = json.loads((HERE / "calibration.json").read_text())
RESULTS = {}
for line in (HERE / "results.csv").read_text().splitlines()[1:]:
    m, i, auc, pauc = line.split(",")[:4]
    RESULTS[f"{m}_id_{i}"] = (float(auc), float(pauc))


def analyze(data: bytes, machine: str, machine_id: str, filename: str) -> dict:
    key = f"{machine}_id_{machine_id.zfill(2)}"
    try:
        model = load_model(key)
    except FileNotFoundError:
        raise KeyError(f"Unknown machine model '{key}'.")
    y, orig_sr = read_wav(data)
    if len(y) / orig_sr > MAX_SECONDS:
        raise ValueError(f"Audio is longer than {MAX_SECONDS} seconds.")
    y = resample_to_16k(y, orig_sr)
    sr = TARGET_SR
    v = stack_frames(log_mel(y, sr))
    if len(v) == 0:
        raise ValueError("Audio is too short to analyse (need at least ~0.2 s).")
    fs = model.frame_errors(v)
    score = float(fs.mean())
    cal = CAL.get(key)
    auc, pauc = RESULTS.get(key, (None, None))
    out = {"filename": filename, "machine": machine, "machineId": machine_id.zfill(2), "sampleRate": int(orig_sr), "analysedAtSampleRate": TARGET_SR, "channels": 1,
           "durationSeconds": round(len(y) / sr, 3),
           "featureConfig": {"n_fft": N_FFT, "hop_length": HOP, "n_mels": N_MELS, "power": POWER,
                             "log_scaling": "20/power*log10(mel+eps)", "stacked_frames": FRAMES},
           "model": {"name": "DCASE 2020 Task 2 autoencoder", "key": key, "hidden": 128, "bottleneck": 8},
           "score": score, "frameScores": [float(s) for s in fs], "frameCount": int(len(fs)), "auc": auc, "pauc": pauc}
    if cal:
        thr = float(cal["threshold"])
        out.update({"threshold": thr, "scoreThresholdRatio": score / thr, "decision": "Anomaly" if score > thr else "Normal",
                    "calibrated": True, "reliability": cal.get("reliability", "calibrated"),
                    "note": "Benchmark DCASE machine, not a textile machine. Threshold = max score over normal calibration files."})
    else:
        out.update({"threshold": None, "scoreThresholdRatio": None, "decision": "Uncalibrated", "calibrated": False,
                    "reliability": "lower reliability",
                    "note": "No calibrated threshold for this machine ID; score shown for reference only."})
    return out
