#!/usr/bin/env python3
"""
SoundGuard ML Inference Service
Provides real-time acoustic anomaly detection for machine health monitoring.

Exposes a simple HTTP API for:
- Analyzing audio samples for anomalies
- Getting anomaly scores and confidence levels
- Predicting maintenance needs based on acoustic patterns
"""

import os
import json
import numpy as np
import librosa
import joblib
from pathlib import Path
from flask import Flask, request, jsonify
from datetime import datetime
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
MODEL_DIR = Path(__file__).parent / "models"
MODEL_PATH = MODEL_DIR / "acoustic_anomaly_model.pkl"
SCALER_PATH = MODEL_DIR / "feature_scaler.pkl"
METADATA_PATH = MODEL_DIR / "model_metadata.json"

# Audio parameters
SAMPLE_RATE = 16000
N_MFCC = 13
N_CHROMA = 12
N_MELS = 128

# Load model and scaler
try:
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)
    with open(METADATA_PATH, 'r') as f:
        metadata = json.load(f)
    logger.info("✓ ML model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load ML model: {e}")
    model = None
    scaler = None
    metadata = None

app = Flask(__name__)

def extract_audio_features(audio_data, sr=SAMPLE_RATE):
    """Extract audio features from raw audio data."""
    try:
        # Convert audio data to numpy array
        if isinstance(audio_data, bytes):
            audio_array = np.frombuffer(audio_data, dtype=np.float32)
        else:
            audio_array = np.array(audio_data, dtype=np.float32)
        
        # Resample if necessary
        if len(audio_array) > sr * 10:
            audio_array = audio_array[:sr * 10]
        
        # Extract features
        mfccs = librosa.feature.mfcc(y=audio_array, sr=sr, n_mfcc=N_MFCC)
        mfcc_mean = np.mean(mfccs, axis=1)
        mfcc_std = np.std(mfccs, axis=1)
        
        spec_centroid = librosa.feature.spectral_centroid(y=audio_array, sr=sr)[0]
        spec_rolloff = librosa.feature.spectral_rolloff(y=audio_array, sr=sr)[0]
        spec_bandwidth = librosa.feature.spectral_bandwidth(y=audio_array, sr=sr)[0]
        
        zcr = librosa.feature.zero_crossing_rate(audio_array)[0]
        
        chroma = librosa.feature.chroma_stft(y=audio_array, sr=sr, n_chroma=N_CHROMA)
        chroma_mean = np.mean(chroma, axis=1)
        
        mel_spec = librosa.feature.melspectrogram(y=audio_array, sr=sr, n_mels=N_MELS)
        mel_mean = np.mean(mel_spec, axis=1)
        mel_std = np.std(mel_spec, axis=1)
        
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
        logger.error(f"Error extracting features: {e}")
        return None

def predict_anomaly(features):
    """Predict if audio contains anomalies."""
    if model is None or scaler is None:
        return None
    
    try:
        # Normalize features
        features_scaled = scaler.transform([features])
        
        # Get anomaly score (-1 = anomaly, 1 = normal)
        prediction = model.predict(features_scaled)[0]
        anomaly_score = model.score_samples(features_scaled)[0]
        
        # Convert to confidence (0-100)
        # Normalize anomaly score to 0-100 range
        confidence = max(0, min(100, (1 - (anomaly_score + 1) / 2) * 100))
        
        is_anomaly = prediction == -1
        
        return {
            "is_anomaly": bool(is_anomaly),
            "anomaly_score": float(anomaly_score),
            "confidence": float(confidence),
            "prediction": int(prediction),
        }
    except Exception as e:
        logger.error(f"Error in prediction: {e}")
        return None

def diagnose_issue(anomaly_score, features):
    """Diagnose the type of issue based on anomaly patterns."""
    if anomaly_score > -0.3:
        return "bearing_wear"
    elif anomaly_score > -0.5:
        return "lubrication_needed"
    elif anomaly_score > -0.7:
        return "alignment_issue"
    else:
        return "severe_damage"

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "timestamp": datetime.utcnow().isoformat(),
    })

@app.route('/api/analyze', methods=['POST'])
def analyze_audio():
    """Analyze audio for anomalies."""
    try:
        # Get audio data from request
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
        
        audio_file = request.files['audio']
        audio_data = audio_file.read()
        
        # Extract features
        features = extract_audio_features(audio_data)
        if features is None:
            return jsonify({"error": "Failed to extract features"}), 400
        
        # Predict
        result = predict_anomaly(features)
        if result is None:
            return jsonify({"error": "Model not loaded"}), 500
        
        # Diagnose
        issue_type = diagnose_issue(result["anomaly_score"], features)
        
        return jsonify({
            "timestamp": datetime.utcnow().isoformat(),
            "is_anomaly": result["is_anomaly"],
            "anomaly_score": result["anomaly_score"],
            "confidence": result["confidence"],
            "issue_type": issue_type,
            "recommendation": get_recommendation(issue_type),
        })
    
    except Exception as e:
        logger.error(f"Error in analyze_audio: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    """Predict anomaly from feature vector."""
    try:
        data = request.get_json()
        if 'features' not in data:
            return jsonify({"error": "No features provided"}), 400
        
        features = np.array(data['features'])
        result = predict_anomaly(features)
        
        if result is None:
            return jsonify({"error": "Model not loaded"}), 500
        
        issue_type = diagnose_issue(result["anomaly_score"], features)
        
        return jsonify({
            "timestamp": datetime.utcnow().isoformat(),
            "is_anomaly": result["is_anomaly"],
            "anomaly_score": result["anomaly_score"],
            "confidence": result["confidence"],
            "issue_type": issue_type,
            "recommendation": get_recommendation(issue_type),
        })
    
    except Exception as e:
        logger.error(f"Error in predict: {e}")
        return jsonify({"error": str(e)}), 500

def get_recommendation(issue_type):
    """Get maintenance recommendation based on issue type."""
    recommendations = {
        "bearing_wear": {
            "severity": "high",
            "action": "Schedule bearing replacement within 24 hours",
            "cost_now": 800,
            "cost_later": 15000,
        },
        "lubrication_needed": {
            "severity": "medium",
            "action": "Apply lubricant to bearing immediately",
            "cost_now": 200,
            "cost_later": 5000,
        },
        "alignment_issue": {
            "severity": "medium",
            "action": "Check machine alignment and recalibrate",
            "cost_now": 500,
            "cost_later": 8000,
        },
        "severe_damage": {
            "severity": "critical",
            "action": "Stop machine immediately, call maintenance",
            "cost_now": 2000,
            "cost_later": 50000,
        },
    }
    return recommendations.get(issue_type, recommendations["bearing_wear"])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
