"""
H&P DrillSense — Relay Service (läuft auf Render, feste URL)
===============================================================
Pi pusht alle 5s per POST, Frontend liest per GET.
Kein Tunnel, keine wechselnden URLs.

Endpoints:
  POST /relay/push        ← Pi schickt Daten (auth via X-API-Key)
  GET  /api/v1/pumps/     ← Frontend liest
  GET  /api/v1/drawworks/ ← Frontend liest
  GET  /api/v1/alerts/    ← Frontend liest
  GET  /health            ← Datenalter + Status
"""
import os, time, logging
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO, format="%(asctime)s [relay] %(message)s")
log = logging.getLogger("relay")

RELAY_API_KEY = os.environ.get("RELAY_API_KEY", "")

app = FastAPI(title="DrillSense Relay", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET","POST","OPTIONS"],
                   allow_headers=["*"], allow_credentials=False)

_store = {"pumps": [], "drawworks": None, "alerts": [], "esp32": [], "pushed_at": None}

def _ck(k):
    if RELAY_API_KEY and k != RELAY_API_KEY:
        raise HTTPException(403, "Invalid API key")

@app.get("/health")
async def health():
    pa = _store["pushed_at"]
    age = round(time.time() - pa, 1) if pa else None
    return {"status": "ok" if (age is not None and age < 30) else "stale",
            "data_age_seconds": age, "pumps": len(_store["pumps"])}

@app.post("/relay/push")
async def push(request: Request, x_api_key: str | None = Header(None)):
    _ck(x_api_key)
    data = await request.json()
    for k in ("pumps", "drawworks", "alerts", "esp32"):
        if k in data: _store[k] = data[k]
    _store["pushed_at"] = time.time()
    log.info(f"Push: {len(_store['pumps'])} pumps, {len(_store['alerts'])} alerts")
    return {"ok": True}

@app.get("/api/v1/pumps/")
async def get_pumps(x_api_key: str | None = Header(None)):
    _ck(x_api_key); return _store["pumps"]

@app.get("/api/v1/drawworks/")
async def get_drawworks(x_api_key: str | None = Header(None)):
    _ck(x_api_key)
    if _store["drawworks"] is None: raise HTTPException(404, "No data yet")
    return _store["drawworks"]

@app.get("/api/v1/alerts/")
async def get_alerts(x_api_key: str | None = Header(None)):
    _ck(x_api_key); return _store["alerts"]

@app.get("/api/v1/esp32/")
async def get_esp32(x_api_key: str | None = Header(None)):
    _ck(x_api_key); return _store["esp32"]
