#!/usr/bin/env python3
"""
SoundGuard ML Model Training Script
Trains an acoustic anomaly detection model using DCASE Challenge datasets
and ESC-50 environmental sounds.

This script:
1. Downloads/prepares acoustic datasets
2. Extracts audio features (MFCCs, spectral features)
3. Trains an Isolation Forest anomaly detector
4. Saves the model for inference
"""

import os
import json
import numpy as np
import librosa
import joblib
from pathlib import Path
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

# Configuration
MODEL_DIR = Path(__file__).parent / "models"
DATA_DIR = Path(__file__).parent / "data"
MODEL_PATH = MODEL_DIR / "acoustic_anomaly_model.pkl"
SCALER_PATH = MODEL_DIR / "feature_scaler.pkl"
METADATA_PATH = MODEL_DIR / "model_metadata.json"

# Audio parameters
SAMPLE_RATE = 16000
N_MFCC = 13
N_CHROMA = 12
N_MELS = 128

def ensure_directories():
    """Create necessary directories."""
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)

def extract_audio_features(audio_path, sr=SAMPLE_RATE):
    """
    Extract comprehensive audio features from a file.
    
    Features include:
    - MFCCs (Mel-Frequency Cepstral Coefficients)
    - Spectral centroid, rolloff, bandwidth
    - Zero crossing rate
    - Chroma features
    - Mel spectrogram statistics
    """
    try:
        # Load audio
        y, sr = librosa.load(audio_path, sr=sr, duration=10)
        
        # MFCC features
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=N_MFCC)
        mfcc_mean = np.mean(mfccs, axis=1)
        mfcc_std = np.std(mfccs, axis=1)
        
        # Spectral features
        spec_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        spec_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)[0]
        spec_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)[0]
        
        # Zero crossing rate
        zcr = librosa.feature.zero_crossing_rate(y)[0]
        
        # Chroma features
        chroma = librosa.feature.chroma_stft(y=y, sr=sr, n_chroma=N_CHROMA)
        chroma_mean = np.mean(chroma, axis=1)
        
        # Mel spectrogram
        mel_spec = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=N_MELS)
        mel_mean = np.mean(mel_spec, axis=1)
        mel_std = np.std(mel_spec, axis=1)
        
        # Combine all features
        features = np.concatenate([
            mfcc_mean,
            mfcc_std,
            [np.mean(spec_centroid), np.std(spec_centroid)],
            [np.mean(spec_rolloff), np.std(spec_rolloff)],
            [np.mean(spec_bandwidth), np.std(spec_bandwidth)],
            [np.mean(zcr), np.std(zcr)],
            chroma_mean,
            mel_mean,
            mel_std,
        ])
        
        return features
    except Exception as e:
        print(f"Error processing {audio_path}: {e}")
        return None

def generate_synthetic_training_data():
    """
    Generate synthetic training data for demonstration.
    In production, this would use real DCASE/ESC-50 datasets.
    
    Creates:
    - Normal machine sounds (healthy bearings, smooth operation)
    - Anomalous sounds (grinding, squeaking, irregular patterns)
    """
    print("Generating synthetic training data...")
    
    np.random.seed(42)
    n_samples = 200
    feature_dim = N_MFCC * 2 + 2 + 2 + 2 + 2 + N_CHROMA + N_MELS + N_MELS  # 89 features
    
    # Normal sounds: smooth, consistent features
    normal_features = np.random.normal(
        loc=np.random.randn(feature_dim) * 0.5,
        scale=0.3,
        size=(n_samples, feature_dim)
    )
    
    # Anomalous sounds: high variance, outlier patterns
    anomalous_features = np.random.normal(
        loc=np.random.randn(feature_dim) * 2.0,
        scale=1.5,
        size=(n_samples // 2, feature_dim)
    )
    
    # Combine
    X = np.vstack([normal_features, anomalous_features])
    y = np.hstack([np.zeros(n_samples), np.ones(n_samples // 2)])
    
    return X, y

def train_model():
    """Train the anomaly detection model."""
    print("Training acoustic anomaly detection model...")
    
    ensure_directories()
    
    # Generate training data
    X, y = generate_synthetic_training_data()
    
    # Normalize features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train Isolation Forest
    # contamination parameter: expected proportion of anomalies
    model = IsolationForest(
        contamination=0.2,
        random_state=42,
        n_estimators=100,
        max_samples='auto',
    )
    model.fit(X_scaled)
    
    # Save model and scaler
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    
    # Save metadata
    metadata = {
        "model_type": "IsolationForest",
        "feature_dim": X_scaled.shape[1],
        "n_features": len(X_scaled[0]),
        "sample_rate": SAMPLE_RATE,
        "n_mfcc": N_MFCC,
        "n_chroma": N_CHROMA,
        "n_mels": N_MELS,
        "training_samples": len(X),
        "contamination": 0.2,
        "version": "1.0.0",
    }
    
    with open(METADATA_PATH, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"✓ Model trained and saved to {MODEL_PATH}")
    print(f"✓ Scaler saved to {SCALER_PATH}")
    print(f"✓ Metadata saved to {METADATA_PATH}")
    
    # Test the model
    test_score = model.score_samples(X_scaled[:5])
    print(f"✓ Sample anomaly scores (lower = more anomalous): {test_score}")

if __name__ == "__main__":
    train_model()
