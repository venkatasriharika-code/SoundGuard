/**
 * SIGNAL LEDGER DESIGN REMINDER
 * SoundGuard must read as an evidence-led industrial workbench, not a generic SaaS app.
 * Keep the rail persistent, make every acoustic visual trace actionable, and reserve lime
 * for healthy or confirmed states while oxide and brick red communicate intervention.
 */
import { useAuth } from "@/_core/hooks/useAuth";
import { RealHistory, SampleDataBanner } from "@/components/RealHistory";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  History as HistoryIcon,
  AlertTriangle,
  ArrowUpRight,
  AudioLines,
  BadgeCheck,
  BarChart3,
  BellRing,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  ClipboardCheck,
  Clock3,
  Cpu,
  Database,
  Factory,
  FileAudio,
  FlaskConical,
  GitBranch,
  Gauge,
  Layers3,
  LineChart,
  Mic,
  MoreHorizontal,
  PanelLeft,
  Pause,
  Play,
  Plus,
  Radio,
  Settings2,
  ShieldCheck,
  Sparkles,
  Square,
  Target,
  Upload,
  Volume2,
  Wifi,
  Wrench,
  X,
  Zap,
} from "lucide-react";

type ViewId = "overview" | "monitoring" | "detection" | "model" | "history" | "maintenance" | "pilot";
type MachineState = "stable" | "warning" | "attention";
type AudioKind = "normal" | "abnormal" | "uploaded" | "recorded" | null;
type AudioAnalysis = { filename: string; machine: string; machineId: string; sampleRate: number; channels: number; durationSeconds: number; featureConfig: { n_fft: number; hop_length: number; n_mels: number; power: number; log_scaling: string; stacked_frames: number }; model: { name: string; key: string; hidden: number; bottleneck: number }; score: number; threshold: number; scoreThresholdRatio: number; decision: "Normal" | "Anomaly"; frameScores: number[]; frameCount: number; reliability: string; auc: number | null; pauc: number | null; note: string };

type Machine = {
  id: string;
  name: string;
  code: string;
  type: string;
  health: number;
  state: MachineState;
  baseline: string;
  confidence: number;
  note: string;
  action: string;
  wave: string;
  ghost: string;
};

const machines: Machine[] = [
  {
    id: "loom-a", name: "Textile Loom A", code: "SG-01 / LOOM", type: "Loom drive", health: 91, state: "stable", baseline: "CALIBRATED · 31 days", confidence: 96,
    note: "Acoustic fingerprint remains inside the expected operating envelope.", action: "Continue scheduled inspection.",
    wave: "M0 42 C12 34 16 50 28 39 S46 30 56 43 S73 56 84 37 S103 27 114 43 S131 55 143 40 S158 27 172 40 S188 53 204 36 S226 29 242 43 S258 50 272 39 S290 28 306 42 S324 49 342 37",
    ghost: "M0 40 C15 31 20 48 32 38 S48 33 59 41 S76 51 88 36 S106 30 116 41 S134 52 145 39 S161 29 174 39 S191 51 206 38 S228 31 243 41 S260 49 274 38 S292 30 308 41 S326 50 342 38",
  },
  {
    id: "pump-c", name: "Pump Assembly C", code: "SG-07 / PUMP", type: "Transfer pump", health: 58, state: "attention", baseline: "CALIBRATED · 18 days", confidence: 88,
    note: "High-frequency energy is elevated against this machine's own baseline. The deviation is concentrated near the bearing-side listening point.", action: "Inspect lubrication and bearing seat within 24 hours.",
    wave: "M0 43 C11 20 20 62 30 36 S46 23 57 44 S70 69 83 31 S98 20 110 50 S123 75 139 35 S157 19 169 51 S182 66 196 31 S211 18 225 53 S241 72 253 29 S270 21 282 51 S301 67 315 33 S328 23 342 42",
    ghost: "M0 40 C15 31 20 48 32 38 S48 33 59 41 S76 51 88 36 S106 30 116 41 S134 52 145 39 S161 29 174 39 S191 51 206 38 S228 31 243 41 S260 49 274 38 S292 30 308 41 S326 50 342 38",
  },
  {
    id: "motor-b", name: "Spindle Motor B", code: "SG-04 / MOTOR", type: "Spindle motor", health: 72, state: "warning", baseline: "CALIBRATED · 26 days", confidence: 81,
    note: "A repeating cadence shift is present. It is observable but below the intervention threshold.", action: "Re-check alignment in the next planned service window.",
    wave: "M0 41 C12 31 18 49 31 39 S48 28 61 45 S77 59 91 36 S104 26 117 49 S132 61 147 38 S162 29 176 45 S192 56 209 37 S224 27 240 48 S256 58 271 39 S287 27 302 46 S319 55 342 39",
    ghost: "M0 40 C15 31 20 48 32 38 S48 33 59 41 S76 51 88 36 S106 30 116 41 S134 52 145 39 S161 29 174 39 S191 51 206 38 S228 31 243 41 S260 49 274 38 S292 30 308 41 S326 50 342 38",
  },
];

const navItems: { id: ViewId; label: string; icon: typeof PanelLeft; helper: string }[] = [
  { id: "overview", label: "Overview", icon: PanelLeft, helper: "Operational snapshot" },
  { id: "monitoring", label: "Live monitoring", icon: Activity, helper: "Fleet & 30-day health" },
  { id: "detection", label: "Detection studio", icon: AudioLines, helper: "Audio, recording & analysis" },
  { id: "model", label: "Model lab", icon: FlaskConical, helper: "Benchmark & experiments" },
  { id: "history", label: "History", icon: HistoryIcon, helper: "Real saved analyses" },
  { id: "maintenance", label: "Maintenance", icon: Wrench, helper: "Alerts & action ledger" },
  { id: "pilot", label: "Pilot evidence", icon: Layers3, helper: "Validation plan" },
];

const healthHistory: Record<string, number[]> = {
  "loom-a": [87, 88, 88, 87, 89, 90, 90, 89, 90, 91, 90, 91, 90, 89, 91, 91, 90, 91, 92, 90, 90, 91, 91, 90, 92, 91, 90, 91, 91, 91],
  "pump-c": [79, 78, 80, 77, 76, 74, 75, 73, 75, 72, 71, 69, 70, 68, 67, 64, 66, 64, 63, 62, 64, 61, 60, 61, 59, 60, 58, 59, 58, 58],
  "motor-b": [76, 76, 75, 77, 76, 74, 75, 74, 73, 75, 74, 73, 72, 74, 73, 72, 73, 71, 72, 72, 73, 71, 72, 73, 71, 72, 72, 71, 73, 72],
};

function healthClass(health: number) { return health >= 80 ? "good" : health >= 65 ? "warn" : "risk"; }

function chartPath(values: number[], width = 680, height = 214) {
  const min = 40;
  const max = 100;
  return values.map((value, index) => {
    const x = (index / (values.length - 1)) * width;
    const y = height - ((value - min) / (max - min)) * height;
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

function audioBufferToWav(buffer: AudioBuffer): Blob {
  const channels = buffer.numberOfChannels;
  const length = buffer.length * channels * 2 + 44;
  const output = new ArrayBuffer(length);
  const view = new DataView(output);
  const write = (offset: number, value: string) => Array.from(value).forEach((character, index) => view.setUint8(offset + index, character.charCodeAt(0)));
  write(0, "RIFF"); view.setUint32(4, length - 8, true); write(8, "WAVE"); write(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, channels, true); view.setUint32(24, buffer.sampleRate, true); view.setUint32(28, buffer.sampleRate * channels * 2, true); view.setUint16(32, channels * 2, true); view.setUint16(34, 16, true); write(36, "data"); view.setUint32(40, length - 44, true);
  const channelData = Array.from({ length: channels }, (_, channel) => buffer.getChannelData(channel));
  let offset = 44;
  for (let sample = 0; sample < buffer.length; sample++) for (let channel = 0; channel < channels; channel++) { const value = Math.max(-1, Math.min(1, channelData[channel]![sample]!)); view.setInt16(offset, value < 0 ? value * 0x8000 : value * 0x7fff, true); offset += 2; }
  return new Blob([output], { type: "audio/wav" });
}

function Wave({ machine, large = false, tone = "blue" }: { machine: Machine; large?: boolean; tone?: "blue" | "lime" | "oxide" }) {
  return <svg className={large ? "sg-wave sg-wave-large" : "sg-wave"} viewBox="0 0 342 80" preserveAspectRatio="none" aria-hidden="true"><path className="sg-wave-ghost" d={machine.ghost} /><path className={`sg-wave-line ${tone}`} d={machine.wave} /></svg>;
}

export default function Home() {
  // The useAuth hook provides authentication state.
  // To implement login/logout, call logout(), or start login from an event
  // handler: onClick={() => startLogin()} (imported from "@/const"). Never call
  // startLogin() during render (no href={startLogin()}) — it mints a one-time
  // nonce cookie and must run only at the moment of navigation.
  let { user, loading, error, isAuthenticated, logout } = useAuth();

  const [view, setView] = useState<ViewId>("overview");
  const [selectedId, setSelectedId] = useState("pump-c");
  const [machineList, setMachineList] = useState<Machine[]>(machines);
  const [edgeOnline, setEdgeOnline] = useState(true);
  const [alertHandled, setAlertHandled] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AudioAnalysis | null>(null);
  const [autoScanState, setAutoScanState] = useState<"listening" | "scanning">("listening");
  const [scanSeconds, setScanSeconds] = useState(12);
  const [lastScanAt, setLastScanAt] = useState(() => new Date());
  const [activeAudio, setActiveAudio] = useState<AudioKind>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [alarmOpen, setAlarmOpen] = useState(false);
  const [addMachineOpen, setAddMachineOpen] = useState(false);
  const [machineForm, setMachineForm] = useState({ name: "", category: "Motor", customCategory: "", location: "", baselineDays: "14" });
  const [notice, setNotice] = useState<string | null>(null);

  const normalAudioRef = useRef<HTMLAudioElement>(null);
  const abnormalAudioRef = useRef<HTMLAudioElement>(null);
  const uploadedAudioRef = useRef<HTMLAudioElement>(null);
  const recordedAudioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);
  const automaticAlarmRaisedRef = useRef(false);

  const current = useMemo(() => machineList.find((machine) => machine.id === selectedId) ?? machineList[0]!, [machineList, selectedId]);
  const history = healthHistory[current.id] ?? healthHistory["loom-a"];
  const path = useMemo(() => chartPath(history), [history]);
  const page = navItems.find((item) => item.id === view)!;
  const alarmMachine = machineList.find((machine) => machine.id === "pump-c") ?? current;
  const calibratedCount = machineList.filter((machine) => machine.baseline.startsWith("CALIBRATED")).length;
  const lastScanLabel = lastScanAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  useEffect(() => () => {
    if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
    recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
  }, []);

  const stopAllAudio = () => {
    [normalAudioRef.current, abnormalAudioRef.current, uploadedAudioRef.current, recordedAudioRef.current].forEach((audio) => {
      if (audio) { audio.pause(); audio.currentTime = 0; }
    });
  };

  const playAudio = async (kind: Exclude<AudioKind, null>, element: HTMLAudioElement | null) => {
    if (!element) return;
    if (activeAudio === kind && !element.paused) { element.pause(); setActiveAudio(null); return; }
    stopAllAudio();
    try { await element.play(); setActiveAudio(kind); } catch { setNotice("Audio playback is blocked until a browser interaction is allowed. Please try the play control once more."); }
  };

  const speakBilingualAdvisory = (machine: Machine) => {
    if (!("speechSynthesis" in window)) { setNotice("Voice advisory is not supported in this browser. The action guidance remains visible on screen."); return; }
    window.speechSynthesis.cancel();
    const english = new SpeechSynthesisUtterance(`Attention. ${machine.name} is at risk. ${machine.action} SoundGuard detected a pattern different from this machine's normal acoustic baseline.`);
    english.lang = "en-IN";
    english.rate = 0.96;
    const hindi = new SpeechSynthesisUtterance(`${machine.name} जोखिम में है। लुब्रिकेशन और बेयरिंग सीट की 24 घंटे के भीतर जांच करें। SoundGuard ने मशीन की सामान्य ध्वनि से अलग पैटर्न पहचाना है।`);
    hindi.lang = "hi-IN";
    hindi.rate = 0.88;
    english.onend = () => window.setTimeout(() => window.speechSynthesis.speak(hindi), 220);
    window.speechSynthesis.speak(english);
  };

  const soundAlarm = () => {
    try {
      const context = new AudioContext();
      [0, 0.34, 0.68].forEach((offset) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(740, context.currentTime + offset);
        gain.gain.setValueAtTime(0.0001, context.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + offset + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + offset + 0.24);
        oscillator.connect(gain); gain.connect(context.destination);
        oscillator.start(context.currentTime + offset); oscillator.stop(context.currentTime + offset + 0.25);
      });
    } catch { /* visual advisory still works when Web Audio is unavailable */ }
  };

  const raiseAlarm = (machine = alarmMachine) => {
    setSelectedId(machine.id);
    setAlarmOpen(true);
    soundAlarm();
    window.setTimeout(() => speakBilingualAdvisory(machine), 260);
  };

  const triggerBackgroundScan = () => {
    setAutoScanState("scanning");
    window.setTimeout(() => {
      setLastScanAt(new Date());
      setAutoScanState("listening");
      const criticalMachine = machineList.find((machine) => machine.state === "attention" && machine.health < 65 && machine.baseline.startsWith("CALIBRATED"));
      if (criticalMachine && !automaticAlarmRaisedRef.current) {
        automaticAlarmRaisedRef.current = true;
        raiseAlarm(criticalMachine);
      }
    }, 700);
  };

  useEffect(() => {
    if (!edgeOnline || alarmOpen) return;
    const initialScan = window.setTimeout(triggerBackgroundScan, 3200);
    const countdown = window.setInterval(() => {
      setScanSeconds((seconds) => {
        if (seconds <= 1) { triggerBackgroundScan(); return 12; }
        return seconds - 1;
      });
    }, 1000);
    return () => { window.clearTimeout(initialScan); window.clearInterval(countdown); };
  }, [edgeOnline, alarmOpen, machineList]);

  const runAnalysis = async () => {
    if (analyzing) return;
    const audio = activeAudio === "recorded" ? recordedAudioRef.current : activeAudio === "uploaded" ? uploadedAudioRef.current : null;
    if (!audio?.src) { setNotice("Upload a WAV file or record a clip before running the live backend analysis."); return; }
    if (current.id !== "pump-c") { setNotice("Exact live calibration is currently available for pump_id_04 only. The other uploaded DCASE checkpoints remain available in Model Lab, but their matching normal training archives are needed before live thresholds can be enabled."); return; }
    const modelKey = { machine: "pump", machineId: "04" };
    setAnalyzing(true);
    try {
      const inferenceBase = (import.meta.env.VITE_INFERENCE_URL as string | undefined)?.replace(/\/$/, "");
      const fileLabel = uploadedName ?? "microphone-recording.wav";
      const audioBlob = await fetch(audio.src).then((result) => result.blob());
      const response = inferenceBase
        ? await fetch(`${inferenceBase}/analyze?filename=${encodeURIComponent(fileLabel)}`, { method: "POST", headers: { "Content-Type": "audio/wav", "x-soundguard-machine": modelKey.machine, "x-soundguard-machine-id": modelKey.machineId }, body: audioBlob })
        : await fetch(`/api/analyze-audio?filename=${encodeURIComponent(fileLabel)}&machine=${modelKey.machine}&machineId=${modelKey.machineId}`, { method: "POST", headers: { "Content-Type": "audio/wav" }, body: audioBlob });
      const payload = await response.json() as AudioAnalysis | { error?: string };
      if (!response.ok || "error" in payload) throw new Error((payload as { error?: string }).error ?? "The exact Python model rejected this file.");
      const result = payload as AudioAnalysis;
      setAnalysisResult(result);
      setNotice(`DCASE ${result.model.key} complete: ${result.decision} at ${result.scoreThresholdRatio.toFixed(2)}× threshold.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The exact Python model could not analyze this clip.");
    } finally { setAnalyzing(false); }
  };

  const addMachine = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const category = machineForm.category === "Custom category" ? machineForm.customCategory.trim() : machineForm.category;
    if (!category) { setNotice("Enter a category name before adding the machine."); return; }
    const codeLabel = category.replace(/[^a-zA-Z0-9]/g, "").slice(0, 7).toUpperCase() || "MACHINE";
    const nextSequence = Math.max(0, ...machineList.map((machine) => Number(machine.code.match(/SG-(\d+)/)?.[1]) || 0)) + 1;
    const id = `${codeLabel.toLowerCase()}-${Date.now()}`;
    const newMachine: Machine = {
      id,
      name: machineForm.name.trim(),
      code: `SG-${String(nextSequence).padStart(2, "0")} / ${codeLabel}`,
      type: category,
      health: 100,
      state: "stable",
      baseline: `PENDING CALIBRATION · ${machineForm.baselineDays} days`,
      confidence: 0,
      note: `New ${category.toLowerCase()} added at ${machineForm.location || "the selected plant location"}. Begin baseline capture before relying on alert thresholds.`,
      action: `Capture a stable ${machineForm.baselineDays}-day acoustic baseline before enabling intervention alerts.`,
      wave: machines[0].wave,
      ghost: machines[0].ghost,
    };
    setMachineList((list) => [...list, newMachine]);
    setSelectedId(id);
    setView("monitoring");
    setAddMachineOpen(false);
    setMachineForm({ name: "", category: "Motor", customCategory: "", location: "", baselineDays: "14" });
    setNotice(`${newMachine.name} was added as ${category}. Its baseline is pending calibration.`);
  };

  const onUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) { setNotice("Please choose an audio file such as WAV, MP3, OGG, or FLAC."); return; }
    if (file.size > 10 * 1024 * 1024) { setNotice("For this browser demo, choose an audio file smaller than 10 MB."); return; }
    if (uploadedUrl) URL.revokeObjectURL(uploadedUrl);
    setUploadedUrl(URL.createObjectURL(file));
    setUploadedName(file.name);
    setActiveAudio("uploaded");
    setAnalysisResult(null);
    setNotice(`${file.name} is ready. Run backend analysis to upload this clip to SoundGuard's internal analyzer.`);
  };

  const toggleRecording = async () => {
    if (recording && recorderRef.current) { recorderRef.current.stop(); return; }
    if (!navigator.mediaDevices?.getUserMedia) { setNotice("Microphone recording is not available in this browser."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordChunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) recordChunksRef.current.push(event.data); };
      recorder.onstop = async () => {
        const sourceBlob = new Blob(recordChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        let blob = sourceBlob;
        try { const context = new AudioContext(); const decoded = await context.decodeAudioData(await sourceBlob.arrayBuffer()); blob = audioBufferToWav(decoded); await context.close(); } catch { setNotice("The browser recording was saved, but WAV conversion was unavailable. Upload a PCM WAV file for backend analysis."); }
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        setRecordedUrl(URL.createObjectURL(blob));
        setActiveAudio("recorded");
        stream.getTracks().forEach((track) => track.stop());
        if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
        setRecording(false);
        setAnalysisResult(null);
        setNotice(blob.type === "audio/wav" ? "Recording converted to PCM WAV. Run backend analysis to send it to SoundGuard." : "Recording saved locally. Upload a PCM WAV file if backend analysis is unavailable.");
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true); setRecordingSeconds(0);
      recordTimerRef.current = window.setInterval(() => setRecordingSeconds((seconds) => seconds + 1), 1000);
    } catch { setNotice("Microphone permission was not granted. You can still upload a machine-audio file."); }
  };

  const overview = <>
    <section className="hero-panel" aria-labelledby="hero-title">
      <img className="hero-image" src="/manus-storage/soundguard-hero-machine_b1fefbb3.jpg" alt="Industrial machine monitored by an acoustic sensor" />
      <div className="hero-content">
        <div className="eyebrow">Machine-adaptive acoustic intelligence</div>
        <h1 id="hero-title" className="hero-title">Listen for change.<br />Act before downtime.</h1>
        <p className="hero-copy">SoundGuard learns how each machine normally sounds, watches for meaningful deviation locally, and turns risk into a clear next maintenance action.</p>
        <div className="hero-actions"><button className="solid-button lime" onClick={() => { setView("detection"); setNotice("Detection Studio is ready with real benchmark valve audio, upload, and microphone controls."); }}><AudioLines size={15} /> Inspect acoustic evidence</button><button className="outline-button" onClick={() => setView("pilot")}>Open pilot ledger <ArrowUpRight size={14} /></button></div>
        <div className="hero-wave"><span>Live fingerprint / SG-07</span><Wave machine={machines[1]} tone="lime" /></div>
        <div className="hero-meta"><div className="hero-meta-item"><Radio size={13} /> Machine-specific baseline</div><div className="hero-meta-item"><Cpu size={13} /> Offline-ready edge inference</div><div className="hero-meta-item"><BadgeCheck size={13} /> Explainable alerts</div></div>
      </div>
    </section>
    <section className="metric-grid" aria-label="Operational metrics"><div className="metric-card emphasis"><div className="metric-label">Fleet health / verified record</div><div className="metric-value">74<span style={{ fontSize: 17 }}>%</span></div><div className="metric-delta"><ArrowUpRight size={11} /> +6 points this week</div><div className="metric-record"><span>PLANT 01 · 08:42</span><Wave machine={machines[0]} tone="lime" /></div></div><div className="metric-card"><div className="metric-label">Machine baselines / calibration</div><div className="metric-value">{String(calibratedCount).padStart(2, "0")}<span style={{ fontSize: 16 }}>/{String(machineList.length).padStart(2, "0")}</span></div><div className="metric-detail">Every monitored unit starts with a machine-specific calibration record.</div><div className="metric-record"><span>{machineList.length > calibratedCount ? "CALIBRATION QUEUED" : "ALL CALIBRATED"}</span><Wave machine={machines[0]} /></div></div><div className="metric-card intervention"><div className="metric-label">Open actions / intervention</div><div className="metric-value">{alertHandled ? "01" : "02"}</div><div className="metric-detail">Pump C needs a technician acknowledgement before 16:00.</div><div className="metric-record"><span>SG-07 · 08:21</span><Wave machine={machines[1]} tone="oxide" /></div></div><div className="metric-card"><div className="metric-label">Edge metric / node 01</div><div className="metric-value">&lt;10<span style={{ fontSize: 15 }}>s</span></div><div className="metric-detail">Proposed alert latency target during pilot validation.</div><div className="metric-record"><span>NODE 01 · LOCAL</span><Wave machine={machines[2]} /></div></div></section>
    <section className="overview-jump-grid"><button className="jump-surface" onClick={() => setView("monitoring")}><Activity size={19} /><span><small>CONTINUOUS MONITORING · 30D LEDGER</small><strong>Inspect the automatic health trail</strong></span><span className="jump-wave"><Wave machine={machines[1]} /></span><ChevronRight size={17} /></button><button className="jump-surface risk" onClick={() => raiseAlarm()}><AlertTriangle size={19} /><span><small>SUPERVISOR TEST · AUTO EN + HI</small><strong>Simulate a threshold-based Pump C escalation</strong></span><span className="jump-wave"><Wave machine={machines[1]} tone="oxide" /></span><ChevronRight size={17} /></button><button className="jump-surface maintenance" onClick={() => setView("maintenance")}><Wrench size={19} /><span><small>MAINTENANCE · 1 OPEN ACTION</small><strong>Keep repair evidence attached to alerts</strong></span><span className="jump-wave"><Wave machine={machines[2]} tone="oxide" /></span><ChevronRight size={17} /></button></section>
  </>;

  const monitoring = <div className="view-page">
    <section className="view-intro"><div><div className="eyebrow dark-ink">Continuous monitoring / edge synced</div><h1 className="view-title">Health trends that stay tied to the machine.</h1><p className="view-copy">SoundGuard listens continuously and escalates only when a calibrated machine crosses the intervention threshold. Workers do not need to run a check.</p></div><div className="view-intro-actions"><button className="outline-button" onClick={() => setAddMachineOpen(true)}><Plus size={14} /> Add machine</button><div className={`auto-scan-status ${autoScanState}`}><span className="scan-ring" /><div><small>{autoScanState === "scanning" ? "SCANNING EDGE AUDIO" : "AUTOMATIC MONITORING ACTIVE"}</small><strong>{autoScanState === "scanning" ? "Comparing against baselines" : `Next scan in ${scanSeconds}s · threshold below 65%`}</strong></div><em>LAST {lastScanLabel}</em></div></div></section>
    <section className="monitoring-layout"><div className="surface monitoring-ledger"><div className="surface-head"><div><div className="section-kicker">Fleet monitoring ledger</div><h2 className="section-title">{machineList.length} listening points, one clear queue.</h2></div><span className="stamp"><Wifi size={10} /> {edgeOnline ? "edge sync active" : "local-only mode"}</span></div><div className="machine-list">{machineList.map((machine) => <button key={machine.id} className={`machine-row ${machine.id === selectedId ? "selected" : ""}`} onClick={() => setSelectedId(machine.id)}><span className="machine-icon">{machine.type.includes("Loom") ? <Factory size={15} /> : machine.type.includes("Pump") ? <Gauge size={15} /> : <Zap size={15} />}</span><span><span className="machine-name">{machine.name}</span><span className="machine-meta">{machine.code} · {machine.type}</span></span><span className="wave-wrap"><Wave machine={machine} /></span><span className="machine-health">{machine.health}%<span className="health-label">HEALTH</span></span><span className={`status-chip ${machine.state}`}><CircleDot size={8} /> {machine.baseline.startsWith("PENDING") ? "calibrate" : machine.state}</span><ChevronRight size={16} color="#899087" /></button>)}</div></div>
      <aside className="surface selected-machine-card"><div className="surface-head"><div><div className="section-kicker">Selected fingerprint</div><h2 className="section-title">{current.name}</h2></div><div className={`detail-health ${healthClass(current.health)}`}>{current.health}%</div></div><div className="selected-body"><div className="big-wave"><Wave machine={current} large tone={current.state === "attention" ? "oxide" : "blue"} /></div><div className="baseline-readout"><div><div className="readout-label">Baseline state</div><div className="readout-value">{current.baseline}</div></div><div><div className="readout-label">Model confidence</div><div className="readout-value">{current.confidence}%</div></div></div><div className="explain-box"><div className="explain-title">What changed</div><p className="explain-copy">{current.note}</p></div></div></aside></section>
    <section className="surface health-chart-surface"><div className="surface-head"><div><div className="section-kicker">30-day health history</div><h2 className="section-title">{current.name} / daily health score</h2></div><div className="chart-legend"><span><i className="legend-line" /> Health score</span><span><i className="legend-dash" /> Intervention threshold 65%</span></div></div><div className="health-chart"><div className="y-label top">100</div><div className="y-label mid">70</div><div className="y-label bottom">40</div><svg viewBox="0 0 680 214" preserveAspectRatio="none" aria-label="30 day health line chart"><line x1="0" x2="680" y1="125" y2="125" className="chart-threshold" /><path d={path} className={`chart-path ${current.state}`} /><circle cx="680" cy={Number(path.split(" ").slice(-1)[1])} r="5" className={`chart-point ${current.state}`} /></svg><div className="chart-days"><span>Day 1</span><span>Day 10</span><span>Day 20</span><span>Today</span></div></div><div className="trend-annotation"><Activity size={15} /><span><strong>{current.state === "attention" ? "Health declined 21 points over 30 days." : "Health remains inside the selected review band."}</strong> {current.action}</span></div></section>
  </div>;

  const sampleControl = (kind: Exclude<AudioKind, null>, title: string, description: string, ref: React.RefObject<HTMLAudioElement | null>, tone: "normal" | "abnormal") => <div className={`audio-sample-card ${tone}`}><div className="audio-sample-top"><span className="sample-state"><CircleDot size={11} /> {tone === "normal" ? "Normal condition" : "Anomalous condition"}</span><span className="sample-source">MIMII / DCASE</span></div><h3>{title}</h3><p>{description}</p><div className="sample-wave"><Wave machine={tone === "normal" ? machines[0] : machines[1]} tone={tone === "normal" ? "lime" : "oxide"} /></div><button className="audio-play" onClick={() => playAudio(kind, ref.current)}>{activeAudio === kind ? <><Pause size={15} fill="currentColor" /> Pause sample</> : <><Play size={15} fill="currentColor" /> Play real sample</>}</button></div>;

  const meterWidth = analysisResult ? Math.min(100, Math.round(analysisResult.scoreThresholdRatio * 50)) : 0;

  const detection = <div className="view-page">
    <section className="view-intro"><div><div className="eyebrow dark-ink">Detection studio / backend analysis</div><h1 className="view-title">Listen, compare, record, then explain.</h1><p className="view-copy">Use real benchmark audio to demonstrate the difference between normal and anomalous machine operation, or capture a local clip. Uploaded PCM WAV files are sent to the SoundGuard internal analyzer; no third-party API is required.</p></div><button className="outline-button" onClick={() => setNotice("Benchmark demo audio: selected normal and anomalous valve recordings from the public MIMII/DCASE ecosystem. These are not SoundGuard factory-pilot recordings.")}>Audio source & attribution <ArrowUpRight size={14} /></button></section>
    <audio ref={normalAudioRef} src="/manus-storage/soundguard-normal-valve_83a7d08f.wav" onEnded={() => setActiveAudio(null)} /><audio ref={abnormalAudioRef} src="/manus-storage/soundguard-anomaly-valve_05dca96a.wav" onEnded={() => setActiveAudio(null)} /><audio ref={uploadedAudioRef} src={uploadedUrl ?? undefined} onEnded={() => setActiveAudio(null)} /><audio ref={recordedAudioRef} src={recordedUrl ?? undefined} onEnded={() => setActiveAudio(null)} />
    <section className="audio-compare-grid">{sampleControl("normal", "Healthy valve recording", "A real 16 kHz normal-condition benchmark recording. Use it to hear the stable operating cadence.", normalAudioRef, "normal")}{sampleControl("abnormal", "Faulty valve recording", "A real anomalous-condition benchmark recording. The demo flags it as a risk pattern for comparison.", abnormalAudioRef, "abnormal")}</section>
    <section className="studio-grid"><div className="surface studio-capture"><div className="surface-head"><div><div className="section-kicker">Capture live audio</div><h2 className="section-title">Record directly from the browser.</h2></div><Mic size={19} color="#5579d7" /></div><div className={`record-indicator ${recording ? "live" : ""}`}><span className="record-dot" />{recording ? `Recording · 00:${String(recordingSeconds).padStart(2, "0")}` : "Microphone ready"}</div><p>Place the microphone near a stable listening point on the machine. The browser prepares the clip locally; backend analysis is started explicitly by you.</p><div className="studio-actions"><button className={`solid-button ${recording ? "danger" : ""}`} onClick={toggleRecording}>{recording ? <><Square size={14} fill="currentColor" /> Stop recording</> : <><Mic size={14} /> Start recording</>}</button>{recordedUrl && <button className="outline-button" onClick={() => playAudio("recorded", recordedAudioRef.current)}><Play size={14} /> {activeAudio === "recorded" ? "Pause" : "Play recording"}</button>}</div><div className="capture-note"><ShieldCheck size={14} /> Recording stays local until you explicitly run backend analysis.</div></div>
      <div className="surface studio-upload"><div className="surface-head"><div><div className="section-kicker">Upload machine audio</div><h2 className="section-title">Test a clip from your monitor.</h2></div><Upload size={19} color="#5579d7" /></div><div className="upload-zone" onClick={() => fileInputRef.current?.click()}><FileAudio size={27} /><strong>{uploadedName ?? "Choose a WAV, MP3, OGG, or FLAC file"}</strong><span>{uploadedName ? "Ready for playback and backend analysis" : "Maximum 10 MB · kept in this browser session"}</span><button className="tiny-button"><Upload size={12} /> Browse file</button><input ref={fileInputRef} type="file" accept="audio/*,.wav,.mp3,.ogg,.flac" onChange={onUpload} hidden /></div>{uploadedUrl && <div className="uploaded-controls"><button className="tiny-button primary" onClick={() => playAudio("uploaded", uploadedAudioRef.current)}><Play size={12} /> {activeAudio === "uploaded" ? "Pause uploaded clip" : "Play uploaded clip"}</button><button className="tiny-button" onClick={runAnalysis}><Sparkles size={12} /> Backend analysis</button></div>}</div></section>
    <section className="surface analysis-result exact-analysis-panel"><div><div className="section-kicker">Exact FastAPI inference</div><h2 className="section-title">Selected source: {activeAudio === "abnormal" ? "faulty benchmark audio" : activeAudio === "normal" ? "healthy benchmark audio" : uploadedName ?? (recordedUrl ? "local microphone recording" : "select an audio source")}</h2>{analysisResult ? <div className="exact-score-grid"><div><span>MODEL</span><strong>{analysisResult.model.key}</strong></div><div><span>RAW SCORE</span><strong>{analysisResult.score.toFixed(5)}</strong></div><div><span>THRESHOLD · P95</span><strong>{analysisResult.threshold.toFixed(5)}</strong></div><div><span>RATIO</span><strong>{analysisResult.scoreThresholdRatio.toFixed(2)}×</strong></div></div> : <p className="analysis-waiting">Run the exact DCASE checkpoint against a WAV upload to see real inference evidence.</p>}</div><div className="analysis-meter"><span>Reconstruction error / verdict</span><div className="meter-track"><i style={{ width: `${meterWidth}%` }} /></div><strong className={analysisResult?.decision === "Anomaly" ? "danger-text" : ""}>{analysisResult ? analysisResult.decision.toUpperCase() : "WAITING"}</strong>{analysisResult && <small>{analysisResult.frameCount} stacked frames · {analysisResult.reliability}</small>}</div>{analysisResult && <div className="frame-score-strip" aria-label="Frame-level reconstruction score chart">{analysisResult.frameScores.filter((_, index) => index % Math.max(1, Math.floor(analysisResult.frameScores.length / 80)) === 0).map((score, index) => <i key={`${score}-${index}`} style={{ height: `${Math.min(100, Math.max(6, (score / analysisResult.threshold) * 42))}%` }} />)}</div>}<button className="solid-button" onClick={runAnalysis}>{analyzing ? <><Activity size={15} className="animate-pulse" /> Analysing</> : <><Cpu size={15} /> Run exact backend analysis</>}</button></section>
  </div>;

  const model = <div className="view-page"><section className="view-intro"><div><div className="eyebrow dark-ink">Model lab / DCASE 2020 Task 2</div><h1 className="view-title">Real checkpoints, real benchmark evidence.</h1><p className="view-copy">These results come from the uploaded DCASE 2020 autoencoder notebook and checkpoints. They are machine-ID-specific benchmark results, not textile-machine validation and not a single global accuracy claim.</p></div><div className="view-intro-actions"><span className="model-run-badge"><CheckCircle2 size={13} /> REAL CHECKPOINTS · 24 IDS</span><button className="outline-button" onClick={() => setNotice("Inference uses the exact Python FastAPI service, librosa log-mel preprocessing, uploaded checkpoint state, and 95th-percentile normal calibration.")}><GitBranch size={14} /> Exact pipeline</button></div></section><section className="model-summary-grid"><div className="model-summary-card"><div className="metric-label">Overall mean AUC</div><div className="model-summary-value">74.45%</div><div className="model-summary-note"><BarChart3 size={12} /> 24 DCASE machine IDs</div></div><div className="model-summary-card"><div className="metric-label">Overall mean pAUC</div><div className="model-summary-value">60.89%</div><div className="model-summary-note"><Target size={12} /> max FPR 0.1</div></div><div className="model-summary-card"><div className="metric-label">Feature pipeline</div><div className="model-summary-value">64×5</div><div className="model-summary-note"><LineChart size={12} /> log-mel frame stack</div></div><div className="model-summary-card accent"><div className="metric-label">Live demo IDs</div><div className="model-summary-value">04</div><div className="model-summary-note"><ShieldCheck size={12} /> strongest AUC IDs</div></div></section><section className="surface model-results exact-model-results"><div className="surface-head"><div><div className="section-kicker">Uploaded results.csv / per machine ID</div><h2 className="section-title">Benchmark scores by machine.</h2></div><span className="stamp"><FlaskConical size={10} /> DCASE benchmark only</span></div><div className="dcase-results-table"><div className="dcase-result-row header"><span>Machine ID</span><span>AUC</span><span>pAUC</span><span>Status</span></div>{[["ToyCar","01","80.67","68.35"],["ToyCar","02","87.59","77.85"],["ToyCar","03","69.95","57.91"],["ToyCar","04","88.60","73.41"],["ToyConveyor","01","74.89","60.22"],["ToyConveyor","02","64.67","56.10"],["ToyConveyor","03","72.75","58.65"],["fan","00","55.02","49.63"],["fan","02","77.28","60.77"],["fan","04","58.30","51.89"],["fan","06","84.97","66.16"],["pump","00","69.15","57.31"],["pump","02","62.63","60.83"],["pump","04","97.31","87.16"],["pump","06","74.98","60.78"],["slider","00","95.27","77.53"],["slider","02","78.90","60.65"],["slider","04","90.93","62.68"],["slider","06","63.16","48.91"],["valve","00","69.36","51.84"],["valve","02","63.54","51.40"],["valve","04","73.23","52.11"],["valve","06","59.27","48.29"]].map(([machine, id, auc, pauc]) => <div className="dcase-result-row" key={`${machine}-${id}`}><span><strong>{machine}</strong> <small>id_{id}</small></span><strong>{auc}%</strong><strong>{pauc}%</strong><span className={Number(auc) >= 90 ? "reliability strong" : "reliability"}>{Number(auc) >= 90 ? "STRONGER ID" : "LOWER RELIABILITY"}</span></div>)}</div><div className="model-callout"><AlertTriangle size={16} /><div><strong>No textile claim.</strong><span>DCASE 2020 covers ToyCar, ToyConveyor, fan, pump, slider, and valve machines. The benchmark is real, but it is not a textile-factory dataset.</span></div></div></section><section className="surface model-pipeline"><div className="surface-head"><div><div className="section-kicker">Exact inference trace</div><h2 className="section-title">Notebook parity, then action.</h2></div><span className="mono">SG-DCASE20</span></div><div className="model-pipeline-grid"><div className="model-pipeline-step"><span>01</span><Database size={17} /><strong>Log-mel</strong><p>n_fft 1024 · hop 512 · 64 mel · power 2.</p></div><div className="model-pipeline-step"><span>02</span><Gauge size={17} /><strong>Stack</strong><p>Five consecutive frames with checkpoint mu and sd.</p></div><div className="model-pipeline-step"><span>03</span><BarChart3 size={17} /><strong>Score</strong><p>Mean reconstruction error across all stacked frames.</p></div><div className="model-pipeline-step"><span>04</span><Wrench size={17} /><strong>Threshold</strong><p>95th percentile of normal training scores per machine ID.</p></div></div></section></div>;
  const maintenance = <div className="view-page"><section className="view-intro"><div><div className="eyebrow dark-ink">Maintenance action ledger</div><h1 className="view-title">A risk signal only counts when somebody can act on it.</h1><p className="view-copy">Keep acoustic evidence, technician response, and the repair outcome in the same operational flow.</p></div><button className="solid-button danger" onClick={() => raiseAlarm()}><BellRing size={15} /> Supervisor test alarm</button></section><section className="maintenance-layout"><div className="surface action-alert"><div className="surface-head"><div><div className="section-kicker">Automatic bilingual risk advisory</div><h2 className="section-title">Pump Assembly C needs attention.</h2></div><span className={`status-chip ${alertHandled ? "stable" : "attention"}`}><AlertTriangle size={10} /> {alertHandled ? "acknowledged" : "review within 24h"}</span></div><div className="action-alert-body"><div className="alarm-machine-row"><span className="machine-icon"><Gauge size={18} /></span><div><strong>Pump Assembly C</strong><span>SG-07 / transfer pump / health 58%</span></div><Wave machine={machines[1]} tone="oxide" /></div><div className="dual-advisory"><div><span>ENGLISH</span><p>Inspect lubrication and the bearing seat within 24 hours. Log the repair outcome against this alert.</p></div><div><span>हिन्दी</span><p>लुब्रिकेशन और बेयरिंग सीट की 24 घंटे के भीतर जांच करें।</p></div></div><div className="workflow-actions"><button className="tiny-button primary" onClick={() => { setAlertHandled(true); setNotice("Pump C alert acknowledged and assigned to the maintenance queue."); }}><BadgeCheck size={12} /> {alertHandled ? "Acknowledged" : "Acknowledge alert"}</button><button className="tiny-button" onClick={() => setNotice("Assigned to R. Patel — maintenance lead. The due time is today, 16:00 IST.")}><Wrench size={12} /> Assign technician</button><button className="tiny-button" onClick={() => { soundAlarm(); speakBilingualAdvisory(alarmMachine); }}><Volume2 size={12} /> Repeat EN + HI advisory</button></div></div></div><aside className="surface"><div className="surface-head"><div><div className="section-kicker">Evidence-linked queue</div><h2 className="section-title">Every action has a history.</h2></div><MoreHorizontal size={18} color="#7c837a" /></div><div className="workflow"><div className="workflow-item"><div className="workflow-icon open"><AlertTriangle size={14} /></div><div><div className="workflow-name">Pump C · lubrication review</div><div className="workflow-copy">High-frequency deviation compared with its 18-day baseline.</div><div className="workflow-time">OPEN · TODAY 08:21</div></div></div><div className="workflow-item"><div className="workflow-icon"><BadgeCheck size={14} /></div><div><div className="workflow-name">Loom A · baseline revalidated</div><div className="workflow-copy">Normal pattern retained after belt adjustment.</div><div className="workflow-time">CLOSED · YESTERDAY 16:40</div></div></div><div className="workflow-item"><div className="workflow-icon"><Clock3 size={14} /></div><div><div className="workflow-name">Motor B · alignment check</div><div className="workflow-copy">Scheduled with the next planned service window.</div><div className="workflow-time">PLANNED · FRI 10:00</div></div></div></div></aside></section></div>;

  const pilot = <div className="view-page"><section className="evidence-section"><div className="evidence-image"><img src="/manus-storage/soundguard-pilot-workshop_e5466a4b.jpg" alt="Technician attaching an acoustic sensor at an industrial pilot site" /></div><div className="evidence-content"><div className="section-kicker">Field-validation plan</div><h1 className="section-title">Make the innovation claim with evidence, not extra screens.</h1><p className="evidence-copy">The proposed pilot validates affordable acoustic monitoring on a loom, transfer pump, and spindle motor. Targets are intentionally marked as proposed until real factory measurements exist.</p><div className="evidence-signal"><span>Evidence fingerprint</span><Wave machine={machines[1]} /></div><div className="target-grid"><div className="target"><div className="target-value">≥85%</div><div className="target-label">recall on confirmed pilot fault events</div></div><div className="target"><div className="target-value">≤1/day</div><div className="target-label">non-actionable alert per machine after calibration</div></div><div className="target"><div className="target-value">24h</div><div className="target-label">local operation without internet connectivity</div></div><div className="target"><div className="target-value">8–12 wk</div><div className="target-label">logged field evidence before ROI conclusions</div></div></div></div></section><section className="pilot-steps"><div className="pilot-step"><span>01</span><div><strong>Calibrate each listening point</strong><p>Capture stable operation and document sensor placement per machine.</p></div></div><div className="pilot-step"><span>02</span><div><strong>Run the local alert workflow</strong><p>Verify alarm, spoken advisory, technician acknowledgement, and repair notes.</p></div></div><div className="pilot-step"><span>03</span><div><strong>Report verified outcomes</strong><p>Measure alert quality, warning lead time, downtime impact, and avoid unsupported savings claims.</p></div></div></section><section className="kit-section"><div className="surface kit-copy"><div className="section-kicker">Affordable field kit</div><h2 className="section-title">A practical add-on, not a factory replacement project.</h2><p>SoundGuard is designed to sit alongside technician rounds and maintenance schedules. The edge kit listens locally, synchronises when it can, and keeps every alert connected to a useful next action.</p><div className="feature-rows"><div className="feature-row"><Mic size={17} /><div><div className="feature-name">Acoustic sensor puck</div><div className="feature-note">Fixed near the machine casing for a repeatable listening point.</div></div><div className="feature-value">BASELINE INPUT</div></div><div className="feature-row"><Cpu size={17} /><div><div className="feature-name">Local edge gateway</div><div className="feature-note">Runs anomaly scoring without waiting for a cloud response.</div></div><div className="feature-value">OFFLINE READY</div></div><div className="feature-row"><ClipboardCheck size={17} /><div><div className="feature-name">Evidence-led maintenance</div><div className="feature-note">Every alert can be acknowledged, resolved, and tied to a repair outcome.</div></div><div className="feature-value">ROI TRACEABLE</div></div></div></div><div className="kit-image"><img src="/manus-storage/soundguard-sensor-kit_e461ba93.jpg" alt="SoundGuard acoustic sensor and edge gateway kit" /></div></section></div>;

  const content: Record<ViewId, ReactNode> = { overview, monitoring, detection, model, history: <RealHistory />, maintenance, pilot };

  return <div className="sg-shell">
    <aside className="sg-sidebar" aria-label="SoundGuard navigation"><div className="brand"><img src="/manus-storage/soundguard-mark_31cbabd3.png" alt="SoundGuard mark" /><div><div className="brand-name">SoundGuard</div><div className="brand-sub">Acoustic maintenance</div><div className="brand-stamp">FIELD INSTRUMENT / SG-01</div></div></div><div className="side-label">Operations console</div><nav className="nav-stack">{navItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={`nav-item ${view === item.id ? "active" : ""}`} onClick={() => setView(item.id)}><Icon size={16} strokeWidth={1.7} /><span>{item.label}</span></button>; })}</nav><div className="rail-context"><div className="side-label" style={{ padding: 0, margin: 0 }}>Monitoring scope</div><strong>Plant 01 / {machineList.length} machines</strong><span>BASELINE SET · {calibratedCount}/{machineList.length}<br />LAST EDGE SYNC · 08:42 IST</span></div><div className="rail-machine-index">{machineList.map((machine) => <div key={machine.id} className={`rail-machine ${machine.state}`}><i className="rail-state" /><b>{machine.code}</b><em>{machine.health}%</em></div>)}</div><div className="sidebar-model-status"><div className="side-label">Model readiness</div><div className="sidebar-model-row"><span>Autoencoder</span><strong>BENCHMARK</strong></div><div className="sidebar-model-row"><span>KNN novelty</span><strong>BENCHMARK</strong></div><div className="sidebar-model-note">97% is a validation gate, not a hard-coded result. Calibrate with labelled factory audio.</div></div><div className="sidebar-bottom"><button className="edge-tile edge-toggle" onClick={() => { setEdgeOnline((value) => !value); setNotice(edgeOnline ? "Edge gateway switched to local-only demonstration mode." : "Edge gateway reconnected. The next sync is due in 60 seconds."); }}><div className={edgeOnline ? "pulse-dot" : "offline-dot"} /><div><strong>{edgeOnline ? "EDGE GATEWAY ONLINE" : "LOCAL-ONLY MODE"}</strong>{edgeOnline ? "SoundGuard Node 01 is syncing every 60 seconds." : "Acoustic scoring continues locally until the next sync."}</div></button></div></aside>
    <main className="sg-main"><header className="topbar"><div className="top-identity"><img src="/manus-storage/soundguard-mark_31cbabd3.png" alt="SoundGuard mark" /><div><div className="top-brand">SoundGuard <span>{page.helper}</span></div><div className="crumb"><strong>Plant 01</strong> / Textile & mechanical workshop / 08:42 IST</div></div></div><div className="top-actions"><span className="auto-language"><Volume2 size={13} /> AUTO EN + HI</span><button className="outline-button top-add-machine" onClick={() => setAddMachineOpen(true)}><Plus size={14} /> Add machine</button><button className="icon-button" onClick={() => raiseAlarm()} aria-label="Supervisor test for automatic bilingual risk advisory"><BellRing size={16} /></button><button className="icon-button" onClick={() => setNotice("Settings are prepared for sensor calibration, alert thresholds, automatic bilingual alarms, and user access.")} aria-label="Open settings"><Settings2 size={16} /></button></div></header>{(view === "overview" || view === "monitoring" || view === "maintenance") && <SampleDataBanner />}{content[view]}<footer className="sg-footer"><span>SOUNDGUARD / MSME PREDICTIVE MAINTENANCE</span><span>CONTINUOUS MONITORING · AUTO ALARMS · ENGLISH THEN HINDI</span></footer></main>
    {alarmOpen && <div className="alarm-layer" role="dialog" aria-modal="true" aria-labelledby="alarm-title"><div className="alarm-dialog"><button className="alarm-close" onClick={() => setAlarmOpen(false)} aria-label="Close risk advisory"><X size={18} /></button><div className="alarm-kicker"><BellRing size={14} /> AUTOMATIC BILINGUAL MACHINE RISK ADVISORY</div><div className="alarm-machine"><span className="alarm-icon"><Gauge size={27} /></span><div><h2 id="alarm-title">{alarmMachine.name} is at risk.</h2><p>{alarmMachine.code} / {alarmMachine.type} / {alarmMachine.health}% health / {alarmMachine.confidence}% model confidence</p></div></div><div className="alarm-wave"><Wave machine={alarmMachine} large tone="oxide" /></div><div className="dual-advisory alarm-dual"><div><span>ENGLISH / WHAT TO DO</span><p>{alarmMachine.action} Record the result in the maintenance ledger.</p></div><div><span>हिन्दी / क्या करें</span><p>लुब्रिकेशन और बेयरिंग सीट की 24 घंटे के भीतर जांच करें।</p></div></div><div className="alarm-buttons"><button className="solid-button danger" onClick={() => { soundAlarm(); speakBilingualAdvisory(alarmMachine); }}><Volume2 size={15} /> Repeat automatic EN + HI alarm</button><button className="outline-button" onClick={() => { setAlertHandled(true); setAlarmOpen(false); setView("maintenance"); setNotice("Pump C alert acknowledged and opened in the maintenance ledger."); }}><BadgeCheck size={15} /> Acknowledge alert</button></div><div className="alarm-note">When a critical deviation is detected, SoundGuard plays the alarm, announces the English action, then announces the Hindi action automatically. Browser-installed voices are used.</div></div></div>}
    {addMachineOpen && <div className="alarm-layer" role="dialog" aria-modal="true" aria-labelledby="add-machine-title"><form className="machine-dialog" onSubmit={addMachine}><button className="alarm-close" type="button" onClick={() => setAddMachineOpen(false)} aria-label="Close add machine dialog"><X size={18} /></button><div className="alarm-kicker add-kicker"><Plus size={14} /> MACHINE ONBOARDING</div><h2 id="add-machine-title">Add a machine and choose its category.</h2><p className="machine-dialog-copy">The new record is added locally to this prototype&apos;s monitoring ledger. Capture a baseline before enabling automatic intervention alerts.</p><div className="machine-form-grid"><label><span>Machine name</span><input required value={machineForm.name} onChange={(event) => setMachineForm({ ...machineForm, name: event.target.value })} placeholder="e.g. Air Compressor D" /></label><label><span>Machine category</span><select value={machineForm.category} onChange={(event) => setMachineForm({ ...machineForm, category: event.target.value })}><option>Loom</option><option>Pump</option><option>Motor</option><option>Compressor</option><option>Fan</option><option>Conveyor</option><option>Valve</option><option>Custom category</option></select></label>{machineForm.category === "Custom category" && <label><span>Custom category</span><input required value={machineForm.customCategory} onChange={(event) => setMachineForm({ ...machineForm, customCategory: event.target.value })} placeholder="e.g. Hydraulic press" /></label>}<label><span>Plant location / line</span><input required value={machineForm.location} onChange={(event) => setMachineForm({ ...machineForm, location: event.target.value })} placeholder="e.g. Line 2 · Bay 4" /></label><label><span>Baseline capture window</span><select value={machineForm.baselineDays} onChange={(event) => setMachineForm({ ...machineForm, baselineDays: event.target.value })}><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select></label></div><div className="onboarding-note"><Radio size={14} /> A stable-state acoustic fingerprint will be required before the machine receives automatic anomaly alerts.</div><div className="alarm-buttons"><button className="solid-button" type="submit"><Plus size={15} /> Add to monitoring ledger</button><button className="outline-button" type="button" onClick={() => setAddMachineOpen(false)}>Cancel</button></div></form></div>}
    {notice && <div className="notice"><button aria-label="Close notice" onClick={() => setNotice(null)}><X size={15} /></button><strong>SoundGuard update</strong><br />{notice}</div>}
  </div>;
}
