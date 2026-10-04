"""Tiny Supabase (PostgREST) client using only the standard library.
Env vars (set in Vercel): SUPABASE_URL, SUPABASE_SERVICE_KEY (service_role JWT or sb_secret_... key; server-side ONLY)."""
import json, os, urllib.error, urllib.parse, urllib.request


def _cfg():
    url, key = os.getenv("SUPABASE_URL", "").rstrip("/"), os.getenv("SUPABASE_SERVICE_KEY", "")
    return (url, key) if url and key else (None, None)


def enabled() -> bool:
    return _cfg()[0] is not None


def _headers(key, extra=None):
    h = {"apikey": key, "Content-Type": "application/json"}
    if key.startswith("eyJ"):            # legacy JWT keys also go in Authorization; new sb_secret_ keys must not
        h["Authorization"] = f"Bearer {key}"
    h.update(extra or {})
    return h


def save_reading(row: dict):
    """Returns (saved: bool, error: str | None). Never raises: a DB problem must not break the analysis."""
    url, key = _cfg()
    if not url:
        return False, "database not configured"
    try:
        req = urllib.request.Request(f"{url}/rest/v1/readings", data=json.dumps(row).encode(), method="POST",
                                     headers=_headers(key, {"Prefer": "return=minimal"}))
        urllib.request.urlopen(req, timeout=5).read()
        return True, None
    except urllib.error.HTTPError as e:
        return False, f"database error {e.code}: {e.read().decode()[:200]}"
    except Exception as e:
        return False, f"database error: {e}"


def recent(limit: int = 100) -> dict:
    url, key = _cfg()
    if not url:
        return {"enabled": False, "total": 0, "rows": []}
    cols = "id,created_at,filename,machine,machine_id,score,threshold,ratio,decision,duration_s"
    q = urllib.parse.urlencode({"select": cols, "order": "created_at.desc", "limit": max(1, min(limit, 500))})
    req = urllib.request.Request(f"{url}/rest/v1/readings?{q}", headers=_headers(key, {"Prefer": "count=exact"}))
    with urllib.request.urlopen(req, timeout=8) as r:
        rows = json.loads(r.read().decode())
        cr = r.headers.get("Content-Range", "")
    total = int(cr.split("/")[-1]) if "/" in cr and cr.split("/")[-1].isdigit() else len(rows)
    return {"enabled": True, "total": total, "rows": rows}
