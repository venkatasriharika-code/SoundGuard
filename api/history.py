"""Vercel Python function: GET /api/history?limit=100 -> recent stored readings + totals."""
import json, os, sys
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

sys.path.insert(0, os.path.dirname(__file__))
import _db


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        q = parse_qs(urlparse(self.path).query)
        try:
            limit = int((q.get("limit") or ["100"])[0])
            data = _db.recent(limit)
            rows = data["rows"]
            data["anomalies"] = sum(1 for r in rows if r.get("decision") == "Anomaly")
            data["normals"] = sum(1 for r in rows if r.get("decision") == "Normal")
            status = 200
        except Exception as e:
            data, status = {"enabled": True, "error": f"Could not load history: {e}", "rows": [], "total": 0}, 502
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *a):
        pass
