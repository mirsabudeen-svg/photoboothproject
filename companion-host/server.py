#!/usr/bin/env python3
"""HTTP print server for DNP companion host (Raspberry Pi)."""
from __future__ import annotations

import json
import logging
import os
import subprocess
import tempfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from logging.handlers import RotatingFileHandler

PORT = int(os.environ.get("PRINT_PORT", "8181"))
PRINTER = os.environ.get("PRINT_PRINTER", "DNP_DS620A")
PRINT_TOKEN = os.environ.get("PRINT_TOKEN", "")

LOG_PATH = os.environ.get("PRINT_LOG", "/var/log/photobooth-printer.log")


def setup_logging() -> None:
    handlers: list[logging.Handler] = [logging.StreamHandler()]
    try:
        handlers.append(
            RotatingFileHandler(LOG_PATH, maxBytes=5 * 1024 * 1024, backupCount=3)
        )
    except OSError:
        pass
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        handlers=handlers,
    )


class PrintHandler(BaseHTTPRequestHandler):
    def _require_auth(self) -> bool:
        if not PRINT_TOKEN:
            return True
        token = self.headers.get("X-Print-Token", "")
        if token != PRINT_TOKEN:
            self._json(401, {"status": "error", "code": "UNAUTHORIZED", "message": "Invalid print token"})
            return False
        return True

    def _json(self, code: int, payload: dict) -> None:
        body = json.dumps(payload).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self) -> None:
        if self.path != "/print":
            self.send_response(404)
            self.end_headers()
            return
        if not self._require_auth():
            return

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as f:
            f.write(body)
            tmp_path = f.name

        try:
            result = subprocess.run(
                ["lp", "-d", PRINTER, "-o", "media=w288h432", tmp_path],
                capture_output=True,
                text=True,
                timeout=30,
            )
            if result.returncode == 0:
                job_id = result.stdout.strip() or "queued"
                self._json(200, {"status": "queued", "jobId": job_id})
                return

            stderr = (result.stderr or "").lower()
            if "unable to locate" in stderr or "not found" in stderr:
                self._json(503, {"status": "error", "code": "CUPS_ERROR", "message": result.stderr.strip()})
            elif "offline" in stderr or "unavailable" in stderr:
                self._json(503, {"status": "error", "code": "PRINTER_OFFLINE", "message": result.stderr.strip()})
            elif "busy" in stderr:
                self._json(503, {"status": "error", "code": "PRINTER_BUSY", "message": result.stderr.strip()})
            else:
                self._json(500, {"status": "error", "code": "CUPS_ERROR", "message": result.stderr.strip() or "Print failed"})
        except FileNotFoundError:
            self._json(503, {"status": "error", "code": "CUPS_ERROR", "message": "lp command not found"})
        except subprocess.TimeoutExpired:
            self._json(503, {"status": "error", "code": "PRINTER_BUSY", "message": "Print job timed out"})
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    def do_GET(self) -> None:
        if self.path != "/health":
            self.send_response(404)
            self.end_headers()
            return

        result = subprocess.run(["lpstat", "-p", PRINTER], capture_output=True, text=True)
        ready = "idle" in result.stdout.lower() or "printing" in result.stdout.lower()
        self._json(
            200,
            {
                "status": "ready" if ready else "not-ready",
                "printer": PRINTER,
                "authRequired": bool(PRINT_TOKEN),
            },
        )

    def log_message(self, format: str, *args) -> None:
        logging.info("%s - %s", self.address_string(), format % args)


if __name__ == "__main__":
    setup_logging()
    logging.info("Companion host listening on :%s (printer=%s)", PORT, PRINTER)
    ThreadingHTTPServer(("0.0.0.0", PORT), PrintHandler).serve_forever()
