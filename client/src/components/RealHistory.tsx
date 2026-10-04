import { useCallback, useEffect, useState } from "react";
import "./RealHistory.css";

type Row = {
  id: number; created_at: string; filename: string | null; machine: string; machine_id: string;
  score: number; threshold: number | null; ratio: number | null; decision: "Anomaly" | "Normal" | "Uncalibrated"; duration_s: number | null;
};
type Payload = { enabled: boolean; total: number; anomalies?: number; normals?: number; rows: Row[]; error?: string };

/** Orange banner for pages whose data is illustrative only. */
export function SampleDataBanner() {
  return (
    <div className="rh-banner" role="note">
      <b>SAMPLE DATA</b> · The plant, machines, health curves, sync times and alerts on this page are an illustrative prototype, not live
      measurements. Real results are in <b>Detection studio</b> (live model) and <b>History</b> (saved analyses).
    </div>
  );
}

function RatioChart({ rows }: { rows: Row[] }) {
  const pts = [...rows].reverse().filter((r) => r.ratio !== null);
  if (pts.length < 2) return <div className="rh-empty">Upload at least two clips of a calibrated machine (pump 04) to see the trend.</div>;
  const W = 800, H = 220, pad = 36;
  const ymax = Math.max(2, Math.min(10, Math.max(...pts.map((r) => r.ratio as number)) * 1.1));
  const x = (i: number) => pad + (i / (pts.length - 1)) * (W - 2 * pad);
  const y = (v: number) => H - pad - (Math.min(v, ymax) / ymax) * (H - 2 * pad);
  return (
    <svg className="rh-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Score-to-threshold ratio over time">
      <line x1={pad} x2={W - pad} y1={y(1)} y2={y(1)} stroke="#c67b32" strokeWidth={2} />
      <text x={W - pad} y={y(1) - 6} textAnchor="end" fontSize={12} fill="#c67b32">threshold (1.0)</text>
      <polyline fill="none" stroke="#5579d7" strokeWidth={1.5} points={pts.map((r, i) => `${x(i)},${y(r.ratio as number)}`).join(" ")} />
      {pts.map((r, i) => <circle key={r.id} cx={x(i)} cy={y(r.ratio as number)} r={4} fill={r.decision === "Anomaly" ? "#b84036" : "#4f9a2c"} />)}
      <text x={pad} y={H - 8} fontSize={11} fill="#687067">oldest</text>
      <text x={W - pad} y={H - 8} textAnchor="end" fontSize={11} fill="#687067">newest</text>
    </svg>
  );
}

export function RealHistory() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const res = await fetch("/api/history?limit=100");
      const json = (await res.json()) as Payload;
      if (!res.ok || json.error) throw new Error(json.error ?? `HTTP ${res.status}`);
      setData(json);
    } catch (e) { setErr(e instanceof Error ? e.message : "Could not load history"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const rows = data?.rows ?? [];
  return (
    <div className="view-page">
      <section className="view-intro">
        <div>
          <div className="eyebrow dark-ink">Stored in a database</div>
          <h1 className="view-title">Real analysis history</h1>
          <p className="view-copy">Every clip analysed in Detection studio is saved here with its score, threshold and verdict. Audio itself is not stored. History is shared by everyone using this demo.</p>
        </div>
        <button className="rh-btn" onClick={() => void load()} disabled={loading}>{loading ? "Loading…" : "Refresh"}</button>
      </section>

      {err && <div className="rh-banner">Could not load history: {err}</div>}
      {data && !data.enabled && (
        <div className="rh-banner"><b>DATABASE NOT CONNECTED</b> · Add SUPABASE_URL and SUPABASE_SERVICE_KEY in the Vercel project settings, then redeploy. Analyses still work, they just aren&apos;t saved.</div>
      )}

      <div className="rh-stats">
        <div className="rh-stat"><small>Total analyses</small><strong>{data?.total ?? "–"}</strong></div>
        <div className="rh-stat"><small>Flagged anomaly (last {rows.length})</small><strong>{data?.anomalies ?? "–"}</strong></div>
        <div className="rh-stat"><small>Normal (last {rows.length})</small><strong>{data?.normals ?? "–"}</strong></div>
        <div className="rh-stat"><small>Latest</small><strong style={{ fontSize: 14 }}>{rows[0] ? new Date(rows[0].created_at).toLocaleString() : "–"}</strong></div>
      </div>

      <div className="rh-card">
        <h2>Score vs threshold over time</h2>
        <p>Above the orange line (1.0) = flagged. Only calibrated models appear here (currently pump 04).</p>
        <RatioChart rows={rows} />
      </div>

      <div className="rh-card">
        <h2>Recent analyses</h2>
        {rows.length === 0 ? <div className="rh-empty">{loading ? "Loading…" : "Nothing saved yet. Analyse a clip in Detection studio."}</div> : (
          <div className="rh-scroll">
            <table className="rh-table">
              <thead><tr><th>Time</th><th>File</th><th>Model</th><th>Score</th><th>× threshold</th><th>Verdict</th></tr></thead>
              <tbody>{rows.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td>{r.filename ?? "–"}</td>
                  <td>{r.machine}_{r.machine_id}</td>
                  <td>{r.score.toFixed(3)}</td>
                  <td>{r.ratio === null ? "–" : r.ratio.toFixed(2)}</td>
                  <td><span className={`rh-chip ${r.decision}`}>{r.decision}</span></td>
                </tr>))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
