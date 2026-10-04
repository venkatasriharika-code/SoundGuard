import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const PYTHON_PORT = Number(process.env.SOUNDGUARD_PYTHON_PORT ?? 8010);
let processRef: ChildProcess | null = null;
let startPromise: Promise<void> | null = null;

async function waitForHealth() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PYTHON_PORT}/health`);
      if (response.ok) return;
    } catch { /* service is still starting */ }
    await delay(250);
  }
  throw new Error("The SoundGuard Python inference service did not become healthy.");
}

export async function ensurePythonService() {
  if (startPromise) return startPromise;
  startPromise = (async () => {
    try {
      const existing = await fetch(`http://127.0.0.1:${PYTHON_PORT}/health`);
      if (existing.ok) return;
    } catch { /* start it below */ }
    const script = "python_service/app.py";
    if (!existsSync(script)) throw new Error(`Missing Python inference service at ${script}`);
    processRef = spawn("python3", ["-m", "uvicorn", "python_service.app:app", "--host", "127.0.0.1", "--port", String(PYTHON_PORT)], {
      stdio: "inherit",
      env: { ...process.env, PYTHONUNBUFFERED: "1" },
    });
    processRef.on("exit", (code) => {
      if (code !== 0) console.error(`[SoundGuard Python] exited with code ${code}`);
      processRef = null;
      startPromise = null;
    });
    await waitForHealth();
  })();
  return startPromise;
}

export async function analyzeWithPython(input: { body: Buffer; filename: string; machine: string; machineId: string }) {
  await ensurePythonService();
  const response = await fetch(`http://127.0.0.1:${PYTHON_PORT}/analyze`, {
    method: "POST",
    headers: {
      "content-type": "audio/wav",
      "x-filename": input.filename,
      "x-soundguard-machine": input.machine,
      "x-soundguard-machine-id": input.machineId,
    },
    body: input.body as unknown as BodyInit,
  });
  const payload = await response.json() as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "Python inference failed.");
  return payload;
}

export function stopPythonService() {
  processRef?.kill();
  processRef = null;
  startPromise = null;
}
