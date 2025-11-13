import configparser
import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import requests

BASE_DIR = Path(__file__).resolve().parent
CONFIG_PATH = BASE_DIR / "coinmarket.ini"
CMC_URL = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest"


def load_api_key():
    """Load API key either from env or coinmarket.ini."""
    env_key = os.getenv("CMC_API_KEY")
    if env_key:
        return env_key.strip()
    config = configparser.ConfigParser()
    config.read(CONFIG_PATH)
    try:
        return config["DEFAULT"]["API_KEY"].strip()
    except KeyError as exc:
        raise RuntimeError("API key missing. Set CMC_API_KEY or create coinmarket.ini.") from exc


API_KEY = load_api_key()
SESSION = requests.Session()
SESSION.headers.update(
    {
        "X-CMC_PRO_API_KEY": API_KEY,
        "Accepts": "application/json",
        "Accept": "application/json",
    }
)


class ProxyHandler(BaseHTTPRequestHandler):
    server_version = "CMCProxy/1.1"

    def log_message(self, fmt, *args):
        # cleaner console output
        print(f"[Proxy] {self.log_date_time_string()} {self.address_string()} {fmt % args}")

    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path != "/api/quotes":
            self._set_headers(404)
            self.wfile.write(json.dumps({"error": "Not found"}).encode())
            return

        query = parse_qs(parsed.query)
        symbols = query.get("symbols", [""])[0].upper()
        slug = query.get("slug", [""])[0]
        convert = query.get("convert", ["USD"])[0].upper() or "USD"
        if not symbols and not slug:
            self._set_headers(400)
            self.wfile.write(json.dumps({"error": "symbols or slug query param required"}).encode())
            return

        params = {"convert": convert}
        if symbols:
            params["symbol"] = symbols
        if slug:
            params["slug"] = slug

        try:
            response = SESSION.get(CMC_URL, params=params, timeout=10)
            response.raise_for_status()
            payload = response.json()
            status_block = payload.get("status", {})
            if status_block.get("error_code"):
                raise RuntimeError(status_block.get("error_message", "CoinMarketCap returned an error"))
        except Exception as exc:  # broad to catch runtime errors above
            self._set_headers(502)
            self.wfile.write(
                json.dumps(
                    {
                        "error": "CoinMarketCap request failed",
                        "details": str(exc),
                    }
                ).encode()
            )
            return

        self._set_headers()
        self.wfile.write(json.dumps(payload).encode())


def run(host="127.0.0.1", port=5050):
    server = HTTPServer((host, port), ProxyHandler)
    print(f"CMC proxy listening on http://{host}:{port}/api/quotes")
    server.serve_forever()


if __name__ == "__main__":
    run()
