"""
H&P DrillSense -- FastAPI Backend (Port 8001)
Verbindet zu Mosquitto MQTT, verarbeitet Sensordaten, stellt REST-API bereit.
Optional: ENABLE_SIMULATOR=true publiziert Testdaten via MQTT.
"""
import asyncio, json, logging, math, random, time
from contextlib import asynccontextmanager
import paho.mqtt.client as mqtt
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s %(message)s")
log = logging.getLogger("main")

RIG = settings.RIG_ID
ROOT = f"hp/rig/{RIG}"

_state = {
    "standpipe": {"value": 218.0, "threshold": 345.0, "unit": "bar"},
    "pumps": {str(i): {} for i in range(1, 4)},
    "drawworks": {},
    "last_msg": None,
}
_alerts: list[dict] = []
_alert_n = 0

def _reading(val, thresh, unit):
    return {"value": round(float(val), 3), "threshold": thresh, "unit": unit}

def _pump_status(p: dict) -> str:
    suction = p.get("suction_bar", {}).get("value", 2.0)
    if suction < 0.3:
        return "suction"
    checks = [
        (p.get("inlet_temp", {}).get("value", 0), 65.0),
        (p.get("gear_oil_temp", {}).get("value", 0), 95.0),
        (p.get("wasserteile", {}).get("valve_seat_in", {}).get("value", 0), 6.0),
        (p.get("wasserteile", {}).get("valve_seat_out", {}).get("value", 0), 6.0),
        (p.get("wasserteile", {}).get("piston_rod", {}).get("value", 0), 7.0),
    ]
    r = [v/t for v, t in checks if t]
    mx = max(r) if r else 0
    if mx > 0.9: return "critical"
    if mx > 0.7 or suction < 0.8: return "warning"
    return "ok"

def _build_pump(pid: int) -> dict:
    p = _state["pumps"].get(str(pid), {})
    wt = p.get("wasserteile", {})
    wear = p.get("wear", {"valve_seat_in": 12, "valve_seat_out": 8, "piston": 15, "liner": 20})
    sv = p.get("suction_bar", {}).get("value", 2.0)
    return {
        "pump_id": pid,
        "name": f"Pump #{pid}",
        "status": _pump_status(p),
        "suction_blocked": sv < 0.3,
        "inlet_temp":     p.get("inlet_temp",    _reading(38.0, 65.0, "C")),
        "gear_oil_temp":  p.get("gear_oil_temp", _reading(62.0, 95.0, "C")),
        "suction_bar":    p.get("suction_bar",   _reading(1.8, 3.0, "bar")),
        "discharge_bar":  p.get("discharge_bar", _reading(218.0, 345.0, "bar")),
        "standpipe_bar":  _state["standpipe"],
        "spm":            p.get("spm", 112),
        "wasserteile": {
            "valve_seat_in":  wt.get("valve_seat_in",  _reading(1.5, 6.0, "mm/s")),
            "valve_seat_out": wt.get("valve_seat_out", _reading(1.3, 6.0, "mm/s")),
            "piston_rod":     wt.get("piston_rod",     _reading(2.1, 7.0, "mm/s")),
        },
        "wear": wear,
    }

def _build_drawworks() -> dict:
    dw = _state["drawworks"]
    def g(k, d, th, u):
        v = dw.get(k, {})
        return _reading(float(v.get("value", d)) if isinstance(v, dict) else d, th, u)
    return {
        "status": "ok",
        "brake1_temp":    g("brake/1/temp", 130, 350, "C"),
        "brake2_temp":    g("brake/2/temp", 125, 350, "C"),
        "brake_wear_percent": 22,
        "gear_oil_temp":  g("gear_oil_temp", 62, 95, "C"),
        "motor1_temp":    g("motor/1/temp", 58, 130, "C"),
        "motor2_temp":    g("motor/2/temp", 55, 130, "C"),
        "motor1_power":   g("motor/1/power_kw", 450, 1150, "kW"),
        "motor2_power":   g("motor/2/power_kw", 430, 1150, "kW"),
        "hook_load":      g("hook_load", 95, 500, "t"),
        "drum_rpm":       g("drum_rpm", 50, 120, "RPM"),
        "vibration":      g("vibration", 1.5, 6.0, "mm/s"),
        "drilling_line_wear": 18,
    }

def _on_connect(client, userdata, flags, rc, props=None):
    if rc == 0:
        log.info(f"MQTT connected to {settings.MQTT_BROKER}:{settings.MQTT_PORT}")
        client.subscribe(f"{ROOT}/#")
    else:
        log.error(f"MQTT failed rc={rc}")

def _on_message(client, userdata, msg):
    t = msg.topic
    try:
        d = json.loads(msg.payload.decode())
    except Exception:
        return
    _state["last_msg"] = time.time()
    if f"{ROOT}/manifold/standpipe_bar" in t:
        _state["standpipe"] = {"value": float(d.get("value", 218)), "threshold": 345.0, "unit": "bar"}
    elif f"{ROOT}/mudpump/" in t:
        parts = t.split(f"{ROOT}/mudpump/")[1].split("/")
        pid = parts[0]
        if pid not in _state["pumps"]: _state["pumps"][pid] = {}
        p = _state["pumps"][pid]
        sp = parts[1:]
        if sp == ["inlet_temp"]:    p["inlet_temp"]   = _reading(d["value"], 65.0, "C")
        elif sp == ["gear_oil_temp"]: p["gear_oil_temp"] = _reading(d["value"], 95.0, "C")
        elif sp == ["suction_bar"]: p["suction_bar"]  = _reading(d["value"], 3.0, "bar")
        elif sp == ["discharge_bar"]: p["discharge_bar"] = _reading(d["value"], 345.0, "bar")
        elif sp == ["spm"]:         p["spm"] = int(d.get("value", 112))
        elif len(sp) >= 3 and sp[0] == "wasserteile":
            if "wasserteile" not in p: p["wasserteile"] = {}
            th = 7.0 if sp[1] == "piston_rod" else 6.0
            p["wasserteile"][sp[1]] = _reading(d["value"], th, "mm/s")
    elif f"{ROOT}/drawworks/" in t:
        k = t.split(f"{ROOT}/drawworks/")[1]
        _state["drawworks"][k] = d

_mqtt = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
_mqtt.on_connect = _on_connect
_mqtt.on_message = _on_message

async def _sim_loop():
    log.info("Simulator aktiv")
    t = 0
    while True:
        t += 1
        sp = 218 + math.sin(t*0.01)*5 + random.gauss(0,2)
        _mqtt.publish(f"{ROOT}/manifold/standpipe_bar", json.dumps({"value": round(sp,1), "unit":"bar"}))
        for pid in [1,2,3]:
            pp = f"{ROOT}/mudpump/{pid}"
            _mqtt.publish(f"{pp}/inlet_temp", json.dumps({"value": round(38+3*math.sin(t*0.005+pid)+random.gauss(0,0.3),1), "unit":"C"}))
            _mqtt.publish(f"{pp}/gear_oil_temp", json.dumps({"value": round(60+random.gauss(0,0.5)+0.0002*t,1), "unit":"C"}))
            _mqtt.publish(f"{pp}/suction_bar", json.dumps({"value": round(max(0.3,1.8+random.gauss(0,0.1)),2), "unit":"bar"}))
            _mqtt.publish(f"{pp}/discharge_bar", json.dumps({"value": round(sp+random.gauss(0,0.5),1), "unit":"bar"}))
            _mqtt.publish(f"{pp}/spm", json.dumps({"value": 112+random.randint(-3,3)}))
            for part,th in [("valve_seat_in",6.0),("valve_seat_out",6.0),("piston_rod",7.0)]:
                vib = max(0.3, 1.5+random.gauss(0,0.4)+0.0002*t)
                _mqtt.publish(f"{pp}/wasserteile/{part}/vibration", json.dumps({"value": round(vib,2), "unit":"mm/s"}))
        dw = f"{ROOT}/drawworks"
        for key,val,noise in [("brake/1/temp",130,8),("brake/2/temp",125,8),("gear_oil_temp",62,2),("motor/1/temp",58,5),("motor/2/temp",55,5),("motor/1/power_kw",450,20),("motor/2/power_kw",430,20),("hook_load",95,10),("drum_rpm",50,5),("vibration",1.5,0.3)]:
            _mqtt.publish(f"{dw}/{key}", json.dumps({"value": round(val+random.gauss(0,noise), 1)}))
        await asyncio.sleep(1.0)

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info(f"DrillSense Backend startet (Rig {RIG})")
    try:
        _mqtt.connect(settings.MQTT_BROKER, settings.MQTT_PORT, 30)
        _mqtt.loop_start()
    except Exception as e:
        log.error(f"MQTT Fehler: {e}")
    if settings.ENABLE_SIMULATOR:
        asyncio.create_task(_sim_loop())
    yield
    _mqtt.loop_stop(); _mqtt.disconnect()

app = FastAPI(title="H&P DrillSense API", version="2.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET","POST","OPTIONS"], allow_headers=["*"], allow_credentials=False)

def _ck(k):
    if settings.DRILLSENSE_API_KEY and k != settings.DRILLSENSE_API_KEY:
        raise HTTPException(403, "Invalid API key")

@app.get("/health")
async def health():
    last = _state["last_msg"]
    return {"status": "ok" if _mqtt.is_connected() else "degraded", "version": "2.0.0",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "rig_id": RIG,
            "components": {"mqtt": {"ok": _mqtt.is_connected(), "broker": f"{settings.MQTT_BROKER}:{settings.MQTT_PORT}"},
                           "simulator": {"ok": settings.ENABLE_SIMULATOR, "enabled": settings.ENABLE_SIMULATOR},
                           "store": {"pumps": len([p for p in _state["pumps"].values() if p]), "data_age_seconds": round(time.time()-last,1) if last else None}}}

@app.get("/api/v1/pumps/")
async def get_pumps(x_api_key: str | None = Header(None)):
    _ck(x_api_key); return [_build_pump(i) for i in range(1,4)]

@app.get("/api/v1/drawworks/")
async def get_drawworks(x_api_key: str | None = Header(None)):
    _ck(x_api_key); return _build_drawworks()

@app.get("/api/v1/alerts/")
async def get_alerts(x_api_key: str | None = Header(None)):
    _ck(x_api_key); return _alerts
