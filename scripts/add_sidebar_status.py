from pathlib import Path
p=Path('client/src/pages/Home.tsx')
s=p.read_text()
needle='</div><div className="sidebar-bottom"><button className="edge-tile edge-toggle"'
insert='</div><div className="sidebar-model-status"><div className="side-label">Model readiness</div><div className="sidebar-model-row"><span>Autoencoder</span><strong>BENCHMARK</strong></div><div className="sidebar-model-row"><span>KNN novelty</span><strong>BENCHMARK</strong></div><div className="sidebar-model-note">97% is a validation gate, not a hard-coded result. Calibrate with labelled factory audio.</div></div><div className="sidebar-bottom"><button className="edge-tile edge-toggle"'
if needle not in s: raise SystemExit('sidebar anchor not found')
s=s.replace(needle,insert,1)
p.write_text(s)
