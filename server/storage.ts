import { ENV } from "./_core/env";

const BUCKET = "soundguard-files"; // create this bucket in Supabase Storage first

function getSupabaseConfig() {
  const supabaseUrl = ENV.supabaseUrl;
  const supabaseKey = ENV.supabaseServiceKey;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Storage config missing: set SUPABASE_URL and SUPABASE_SERVICE_KEY",
    );
  }

  return { supabaseUrl: supabaseUrl.replace(/\/+$/, ""), supabaseKey };
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();
  const key = appendHashSuffix(normalizeKey(relKey));

  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });

  const uploadUrl = `${supabaseUrl}/storage/v1/object/${BUCKET}/${key}`;

  const uploadResp = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${supabaseKey}`,
      apikey: supabaseKey,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: blob,
  });

  if (!uploadResp.ok) {
    const msg = await uploadResp.text().catch(() => uploadResp.statusText);
    throw new Error(`Storage upload failed (${uploadResp.status}): ${msg}`);
  }

  return { key, url: `/storage/${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/storage/${key}` };
}

export async function storageGetSignedUrl(
  relKey: string,
  expiresInSeconds = 3600,
): Promise<string> {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();
  const key = normalizeKey(relKey);

  const signUrl = `${supabaseUrl}/storage/v1/object/sign/${BUCKET}/${key}`;

  const resp = await fetch(signUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${supabaseKey}`,
      apikey: supabaseKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn: expiresInSeconds }),
  });

  if (!resp.ok) {
    const msg = await resp.text().catch(() => resp.statusText);
    throw new Error(`Storage signed URL failed (${resp.status}): ${msg}`);
  }

  const { signedURL } = (await resp.json()) as { signedURL: string };
  return `${supabaseUrl}/storage/v1${signedURL}`;
}
