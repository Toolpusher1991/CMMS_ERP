"""
H&P DrillSense — Data Pusher
==============================
Läuft auf dem Pi als Systemd-Service.
Holt Daten vom lokalen Backend (Port 8001) und pusht alle 5s zum Relay auf Render.

Umgebungsvariablen:
  RELAY_URL          — https://drillsense-relay.onrender.com (oder eigene URL)
  DRILLSENSE_API_KEY — API-Key (gleicher wie beim Backend)
  PUSH_INTERVAL      — Sekunden zwischen Pushes (default: 5)
"""
import os, sys, time, logging
import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s [pusher] %(message)s", stream=sys.stdout)
log = logging.getLogger("pusher")

LOCAL_API = os.environ.get("LOCAL_API", "http://localhost:8001")
RELAY_URL  = os.environ.get("RELAY_URL", "")
API_KEY    = os.environ.get("DRILLSENSE_API_KEY", "")
INTERVAL   = int(os.environ.get("PUSH_INTERVAL", "5"))

if not RELAY_URL:
    log.error("RELAY_URL ist nicht gesetzt! export RELAY_URL=https://drillsense-relay.onrender.com")
    sys.exit(1)

HEADERS = {"X-API-Key": API_KEY} if API_KEY else {}

def fetch(path):
    try:
        r = requests.get(f"{LOCAL_API}{path}", headers=HEADERS, timeout=5)
        r.raise_for_status(); return r.json()
    except requests.exceptions.ConnectionError:
        log.warning(f"Lokales Backend nicht erreichbar ({path})")
        return None
    except Exception as e:
        log.warning(f"fetch {path}: {e}"); return None

def push_once():
    pumps     = fetch("/api/v1/pumps/") or []
    drawworks = fetch("/api/v1/drawworks/")
    alerts    = fetch("/api/v1/alerts/") or []
    try:
        r = requests.post(f"{RELAY_URL}/relay/push",
                          json={"pumps": pumps, "drawworks": drawworks, "alerts": alerts},
                          headers=HEADERS, timeout=10)
        if r.ok: log.info(f"Push OK — {len(pumps)} Pumpen")
        else:    log.warning(f"Relay {r.status_code}: {r.text[:80]}")
    except requests.exceptions.Timeout:
        log.warning("Relay Timeout — Render schläft evtl. (cold start)")
    except Exception as e:
        log.error(f"Push fehlgeschlagen: {e}")

if __name__ == "__main__":
    log.info(f"Pusher gestartet | Backend: {LOCAL_API} | Relay: {RELAY_URL} | Intervall: {INTERVAL}s")
    time.sleep(3)  # Warten bis Backend hochgefahren
    while True:
        push_once()
        time.sleep(INTERVAL)
