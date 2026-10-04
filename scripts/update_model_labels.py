from pathlib import Path
p=Path('client/src/pages/Home.tsx')
s=p.read_text()
s=s.replace('RUN COMPLETE · 12 SEP 2026','RUN COMPLETE · 13 SEP 2026')
s=s.replace('<div className="metric-label">Threshold rule</div><div className="model-summary-value">P99</div><div className="model-summary-note"><BarChart3 size={12} /> normal-score envelope</div>','<div className="metric-label">Stronger models</div><div className="model-summary-value">2</div><div className="model-summary-note"><BarChart3 size={12} /> AE + 5-NN novelty</div>')
s=s.replace('<div><span>Autoencoder baseline</span><strong>reconstruction error</strong></div>','<div><span>Autoencoder baseline</span><strong>F1 1.12%</strong></div>')
s=s.replace('<div><span>KNN novelty baseline</span><strong>5-neighbour distance</strong></div>','<div><span>KNN novelty baseline</span><strong>F1 2.23%</strong></div>')
p.write_text(s)
