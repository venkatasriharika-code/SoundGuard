import { TRPCError } from "@trpc/server";
import { ENV } from "./env";

export type HeartbeatJob = {
  name: string;
  /**
   * 6-field cron with seconds is NOT supported here — cron-job.org uses
   * standard 5-field cron (`min hour dom mon dow`), UTC, min interval 60s
   * (actually 1 minute granularity on the free tier).
   * e.g. `"0 9 * * *"` is daily 09:00 UTC.
   */
  cron: string;
  /** Full callback URL. MUST start with your deployed origin + /api/scheduled/. */
  url: string;
  method?: "POST" | "PUT";
  payload?: unknown;
  description?: string;
};

export type HeartbeatJobUpdate = Partial<Omit<HeartbeatJob, "name">> & {
  enable?: boolean;
};

export type HeartbeatJobInfo = {
  jobId: number;
  title: string;
  url: string;
  schedule: Record<string, unknown>;
  enabled: boolean;
  lastExecution?: number | null;
  nextExecution?: number | null;
};

const API_BASE = "https://api.cron-job.org";

function getApiKey(): string {
  if (!ENV.cronJobApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Heartbeat service API key is not configured (CRON_JOB_API_KEY).",
    });
  }
  return ENV.cronJobApiKey;
}

async function callCronJobApi<T>(
  method: "GET" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const apiKey = getApiKey();

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Heartbeat ${method} ${path} network error: ${String(error)}`,
    });
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw mapApiError(response, detail, path);
  }

  if (response.status === 204) return {} as T;
  return (await response.json()) as T;
}

function mapApiError(response: Response, detail: string, path: string): TRPCError {
  const status = response.status;
  let code: TRPCError["code"] = "INTERNAL_SERVER_ERROR";
  if (status === 401) code = "UNAUTHORIZED";
  else if (status === 403) code = "FORBIDDEN";
  else if (status === 404) code = "NOT_FOUND";
  else if (status === 400 || status === 422) code = "BAD_REQUEST";
  else if (status === 409) code = "CONFLICT";
  else if (status === 429) code = "TOO_MANY_REQUESTS";
  return new TRPCError({
    code,
    message: `Heartbeat ${path} failed (${status})${detail ? `: ${detail}` : ""}`,
  });
}

/** Parses a 5-field cron string into cron-job.org's schedule object (UTC). */
function parseCron(cron: string) {
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Expected 5-field cron (min hour dom mon dow), got: "${cron}"`,
    });
  }
  const [minutes, hours, mdays, months, wdays] = parts;
  const expand = (field: string, max: number): number[] =>
    field === "*" ? Array.from({ length: max }, (_, i) => i) : field.split(",").map(Number);
  return {
    timezone: "UTC",
    minutes: expand(minutes, 60),
    hours: expand(hours, 24),
    mdays: expand(mdays, 31),
    months: expand(months, 12),
    wdays: expand(wdays, 7),
  };
}

function validateCallbackUrl(url: string): void {
  if (!url || !/\/api\/scheduled\//.test(url)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "callback url must contain /api/scheduled/",
    });
  }
}

/** Create a new HTTP cron job. Returns the assigned jobId to persist. */
export async function createHeartbeatJob(
  job: HeartbeatJob,
): Promise<{ jobId: number }> {
  validateCallbackUrl(job.url);
  const res = await callCronJobApi<{ jobId: number }>("PUT", "/jobs", {
    job: {
      title: job.name,
      url: job.url,
      enabled: true,
      saveResponses: false,
      requestMethod: job.method === "PUT" ? 2 : 1, // 1=POST, 2=PUT per their API
      schedule: parseCron(job.cron),
      extendedData: job.payload
        ? { body: JSON.stringify(job.payload), headers: ["Content-Type: application/json"] }
        : undefined,
    },
  });
  return res;
}

/** Update an existing job located by jobId. Only passed fields are changed. */
export async function updateHeartbeatJob(
  jobId: number,
  patch: HeartbeatJobUpdate,
): Promise<void> {
  if (patch.url !== undefined) validateCallbackUrl(patch.url);
  const job: Record<string, unknown> = {};
  if (patch.name !== undefined) job.title = patch.name;
  if (patch.url !== undefined) job.url = patch.url;
  if (patch.cron !== undefined) job.schedule = parseCron(patch.cron);
  if (patch.method !== undefined) job.requestMethod = patch.method === "PUT" ? 2 : 1;
  if (patch.enable !== undefined) job.enabled = patch.enable;
  if (patch.payload !== undefined) {
    job.extendedData = {
      body: JSON.stringify(patch.payload),
      headers: ["Content-Type: application/json"],
    };
  }
  await callCronJobApi("PATCH", `/jobs/${jobId}`, { job });
}

/** Delete a job by jobId. */
export async function deleteHeartbeatJob(jobId: number): Promise<void> {
  await callCronJobApi("DELETE", `/jobs/${jobId}`);
}

/** List all jobs under this account's API key. */
export async function listHeartbeatJobs(): Promise<{ jobs: HeartbeatJobInfo[] }> {
  const res = await callCronJobApi<{ jobs: any[] }>("GET", "/jobs");
  return {
    jobs: res.jobs.map((j) => ({
      jobId: j.jobId,
      title: j.title,
      url: j.url,
      schedule: j.schedule,
      enabled: j.enabled,
      lastExecution: j.lastExecution ?? null,
      nextExecution: j.nextExecution ?? null,
    })),
  };
}
