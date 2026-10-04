"""Vercel Python function: POST /api/analyze-audio?filename=&machine=&machineId=  (body = raw .wav bytes)."""
import json, os, sys
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

sys.path.insert(0, os.path.dirname(__file__))
import _core

MAX_BYTES = 4_000_000   # Vercel rejects request bodies above ~4.5 MB


class handler(BaseHTTPRequestHandler):
    def _send(self, status, payload):
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        self._send(200, {"status": "ok", "calibrated_models": sorted(_core.CAL.keys())})

    def do_POST(self):
        q = parse_qs(urlparse(self.path).query)
        g = lambda k, d: (q.get(k) or [d])[0]
        try:
            n = int(self.headers.get("Content-Length") or 0)
            if n == 0:
                return self._send(400, {"error": "Empty upload. Send a .wav file."})
            if n > MAX_BYTES:
                return self._send(413, {"error": "File too large for the web demo (max ~4 MB). Use a shorter clip."})
            data = self.rfile.read(n)
            self._send(200, _core.analyze(data, g("machine", "pump"), g("machineId", "04"), g("filename", "upload.wav")))
        except KeyError as e:
            self._send(404, {"error": str(e.args[0])})
        except Exception as e:
            self._send(400, {"error": f"Could not analyse audio: {e}"})

    def log_message(self, *a):
        pass
