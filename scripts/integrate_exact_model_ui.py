from pathlib import Path
p = Path('client/src/pages/Home.tsx')
s = p.read_text()
old_type = 'type AudioAnalysis = { filename: string; sampleRate: number; channels: number; durationSeconds: number; features: { rms: number; peak: number; zeroCrossingRate: number; spectralCentroidHz: number }; models: { autoencoder: { score: number; status: "normal" | "review" | "high"; threshold: number }; knnNovelty: { score: number; status: "normal" | "review" | "high"; threshold: number } }; decision: "normal" | "review" | "high"; note: string };'
new_type = 'type AudioAnalysis = { filename: string; machine: string; machineId: string; sampleRate: number; channels: number; durationSeconds: number; featureConfig: { n_fft: number; hop_length: number; n_mels: number; power: number; log_scaling: string; stacked_frames: number }; model: { name: string; key: string; hidden: number; bottleneck: number }; score: number; threshold: number; scoreThresholdRatio: number; decision: "Normal" | "Anomaly"; frameScores: number[]; frameCount: number; reliability: string; auc: number | null; pauc: number | null; note: string };'
if old_type not in s: raise SystemExit('AudioAnalysis type not found')
s = s.replace(old_type, new_type, 1)
old_handler = '''  const runAnalysis = async () => {
    if (analyzing) return;
    const audio = activeAudio === "recorded" ? recordedAudioRef.current : activeAudio === "uploaded" ? uploadedAudioRef.current : null;
    if (!audio?.src) { setNotice("Upload a WAV file or record a clip before running the live backend analysis."); return; }
    setAnalyzing(true);
    try {
      const response = await fetch(`/api/analyze-audio?filename=${encodeURIComponent(uploadedName ?? "microphone-recording.wav")}`, { method: "POST", headers: { "Content-Type": "audio/wav" }, body: await fetch(audio.src).then((result) => result.blob()) });
      const payload = await response.json() as AudioAnalysis | { error?: string };
      if (!response.ok || "error" in payload) throw new Error((payload as { error?: string }).error ?? "The audio backend rejected this file.");
      const result = payload as AudioAnalysis;
      setAnalysisResult(result);
      setNotice(`Backend analysis complete: ${result.decision.toUpperCase()} decision from autoencoder and KNN novelty scores.`);
      if (result.decision === "high") raiseAlarm(current);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The audio backend could not analyze this clip.");
    } finally { setAnalyzing(false); }
  };'''
new_handler = '''  const runAnalysis = async () => {
    if (analyzing) return;
    const audio = activeAudio === "recorded" ? recordedAudioRef.current : activeAudio === "uploaded" ? uploadedAudioRef.current : null;
    if (!audio?.src) { setNotice("Upload a WAV file or record a clip before running the live backend analysis."); return; }
    if (current.id !== "pump-c") { setNotice("Exact live calibration is currently available for pump_id_04 only. The other uploaded DCASE checkpoints remain available in Model Lab, but their matching normal training archives are needed before live thresholds can be enabled."); return; }
    const modelKey = { machine: "pump", machineId: "04" };
    setAnalyzing(true);
    try {
      const response = await fetch(`/api/analyze-audio?filename=${encodeURIComponent(uploadedName ?? "microphone-recording.wav")}&machine=${modelKey.machine}&machineId=${modelKey.machineId}`, { method: "POST", headers: { "Content-Type": "audio/wav" }, body: await fetch(audio.src).then((result) => result.blob()) });
      const payload = await response.json() as AudioAnalysis | { error?: string };
      if (!response.ok || "error" in payload) throw new Error((payload as { error?: string }).error ?? "The exact Python model rejected this file.");
      const result = payload as AudioAnalysis;
      setAnalysisResult(result);
      setNotice(`DCASE ${result.model.key} complete: ${result.decision} at ${result.scoreThresholdRatio.toFixed(2)}× threshold.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The exact Python model could not analyze this clip.");
    } finally { setAnalyzing(false); }
  };'''
if old_handler not in s: raise SystemExit('runAnalysis block not found')
s = s.replace(old_handler, new_handler, 1)
# Replace the old meter calculation with exact score ratio.
start = s.find('  const meterWidth =')
end = s.find('\n  const detection =', start)
if start < 0 or end < 0: raise SystemExit('meter/detection boundary not found')
s = s[:start] + '  const meterWidth = analysisResult ? Math.min(100, Math.round(analysisResult.scoreThresholdRatio * 50)) : 0;\n' + s[end:]
# Replace model section only.
start = s.find('  const model =')
end = s.find('  const maintenance =', start)
if start < 0 or end < 0: raise SystemExit('model boundaries not found')
model = '''  const model = <div className="view-page"><section className="view-intro"><div><div className="eyebrow dark-ink">Model lab / DCASE 2020 Task 2</div><h1 className="view-title">Real checkpoints, real benchmark evidence.</h1><p className="view-copy">These results come from the uploaded DCASE 2020 autoencoder notebook and checkpoints. They are machine-ID-specific benchmark results, not textile-machine validation and not a single global accuracy claim.</p></div><div className="view-intro-actions"><span className="model-run-badge"><CheckCircle2 size={13} /> REAL CHECKPOINTS · 23 IDS</span><button className="outline-button" onClick={() => setNotice("Inference uses the exact Python FastAPI service, librosa log-mel preprocessing, uploaded checkpoint state, and 95th-percentile normal calibration.")}><GitBranch size={14} /> Exact pipeline</button></div></section><section className="model-summary-grid"><div className="model-summary-card"><div className="metric-label">Overall mean AUC</div><div className="model-summary-value">74.45%</div><div className="model-summary-note"><BarChart3 size={12} /> 23 DCASE machine IDs</div></div><div className="model-summary-card"><div className="metric-label">Overall mean pAUC</div><div className="model-summary-value">60.89%</div><div className="model-summary-note"><Target size={12} /> max FPR 0.1</div></div><div className="model-summary-card"><div className="metric-label">Feature pipeline</div><div className="model-summary-value">64×5</div><div className="model-summary-note"><LineChart size={12} /> log-mel frame stack</div></div><div className="model-summary-card accent"><div className="metric-label">Live demo IDs</div><div className="model-summary-value">04</div><div className="model-summary-note"><ShieldCheck size={12} /> strongest AUC IDs</div></div></section><section className="surface model-results exact-model-results"><div className="surface-head"><div><div className="section-kicker">Uploaded results.csv / per machine ID</div><h2 className="section-title">Benchmark scores by machine.</h2></div><span className="stamp"><FlaskConical size={10} /> DCASE benchmark only</span></div><div className="dcase-results-table"><div className="dcase-result-row header"><span>Machine ID</span><span>AUC</span><span>pAUC</span><span>Status</span></div>{[["ToyCar","01","80.67","68.35"],["ToyCar","02","87.59","77.85"],["ToyCar","03","69.95","57.91"],["ToyCar","04","88.60","73.41"],["ToyConveyor","01","74.89","60.22"],["ToyConveyor","02","64.67","56.10"],["ToyConveyor","03","72.75","58.65"],["fan","00","55.02","49.63"],["fan","02","77.28","60.77"],["fan","04","58.30","51.89"],["fan","06","84.97","66.16"],["pump","00","69.15","57.31"],["pump","02","62.63","60.83"],["pump","04","97.31","87.16"],["pump","06","74.98","60.78"],["slider","00","95.27","77.53"],["slider","02","78.90","60.65"],["slider","04","90.93","62.68"],["slider","06","63.16","48.91"],["valve","00","69.36","51.84"],["valve","02","63.54","51.40"],["valve","04","73.23","52.11"],["valve","06","59.27","48.29"]].map(([machine, id, auc, pauc]) => <div className="dcase-result-row" key={`${machine}-${id}`}><span><strong>{machine}</strong> <small>id_{id}</small></span><strong>{auc}%</strong><strong>{pauc}%</strong><span className={Number(auc) >= 90 ? "reliability strong" : "reliability"}>{Number(auc) >= 90 ? "STRONGER ID" : "LOWER RELIABILITY"}</span></div>)}</div><div className="model-callout"><AlertTriangle size={16} /><div><strong>No textile claim.</strong><span>DCASE 2020 covers ToyCar, ToyConveyor, fan, pump, slider, and valve machines. The benchmark is real, but it is not a textile-factory dataset.</span></div></div></section><section className="surface model-pipeline"><div className="surface-head"><div><div className="section-kicker">Exact inference trace</div><h2 className="section-title">Notebook parity, then action.</h2></div><span className="mono">SG-DCASE20</span></div><div className="model-pipeline-grid"><div className="model-pipeline-step"><span>01</span><Database size={17} /><strong>Log-mel</strong><p>n_fft 1024 · hop 512 · 64 mel · power 2.</p></div><div className="model-pipeline-step"><span>02</span><Gauge size={17} /><strong>Stack</strong><p>Five consecutive frames with checkpoint mu and sd.</p></div><div className="model-pipeline-step"><span>03</span><BarChart3 size={17} /><strong>Score</strong><p>Mean reconstruction error across all stacked frames.</p></div><div className="model-pipeline-step"><span>04</span><Wrench size={17} /><strong>Threshold</strong><p>95th percentile of normal training scores per machine ID.</p></div></div></section></div>;
'''
s = s[:start] + model + s[end:]
p.write_text(s)
