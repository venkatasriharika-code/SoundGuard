from pathlib import Path
p = Path('client/src/pages/Home.tsx')
s = p.read_text()
s = s.replace('Detection studio / local demonstration', 'Detection studio / backend analysis')
s = s.replace('or capture a local clip with the browser microphone.', 'or capture a local clip. Uploaded PCM WAV files are sent to the SoundGuard internal analyzer; no third-party API is required.')
s = s.replace('The browser keeps the resulting clip local to this demo.', 'The browser prepares the clip locally; backend analysis is started explicitly by you.')
s = s.replace('Browser-only capture. No recording is uploaded to SoundGuard.', 'Recording stays local until you explicitly run backend analysis.')
s = s.replace('Ready for local playback and demo analysis', 'Ready for playback and backend analysis')
s = s.replace('<Sparkles size={12} /> Demonstration analysis', '<Sparkles size={12} /> Backend analysis')
s = s.replace('<div className="section-kicker">Illustrative inference panel</div>', '<div className="section-kicker">Live backend inference</div>')
s = s.replace('<strong>{activeAudio === "abnormal" ? "HIGH" : activeAudio === "normal" ? "LOW" : "REVIEW"}</strong>', '<strong>{analysisResult ? analysisResult.decision.toUpperCase() : "WAITING"}</strong>')
s = s.replace('<div className="meter-track"><i style={{ width: activeAudio === "abnormal" ? "78%" : activeAudio === "normal" ? "18%" : "46%" }} /></div>', '<div className="meter-track"><i style={{ width: `${analysisResult ? Math.min(100, Math.round(Math.max(analysisResult.models.autoencoder.score / analysisResult.models.autoencoder.threshold, analysisResult.models.knnNovelty.score / analysisResult.models.knnNovelty.threshold) * 50) : 0}%` }} /></div>')
s = s.replace('<Cpu size={15} /> Run demo analysis', '<Cpu size={15} /> Run backend analysis')
needle = '<div className="model-table"><div><span>Machine-wise envelope</span><strong>F1 4.1%</strong></div><div><span>Global false negatives</span><strong>692 / 700</strong></div><div><span>Interpretation</span><strong>Domain shift exposed</strong></div></div>'
replacement = '<div className="model-table"><div><span>Machine-wise envelope</span><strong>F1 4.1%</strong></div><div><span>Global false negatives</span><strong>692 / 700</strong></div><div><span>Autoencoder baseline</span><strong>reconstruction error</strong></div><div><span>KNN novelty baseline</span><strong>5-neighbour distance</strong></div><div><span>Interpretation</span><strong>Domain shift exposed</strong></div></div>'
s = s.replace(needle, replacement)
p.write_text(s)
