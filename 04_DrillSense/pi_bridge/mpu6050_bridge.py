"""
MPU-6050 Bridge for Raspberry Pi
Reads accelerometer data via I2C and publishes to DrillSense MQTT broker
in the same format as the ESP32 vibration sensor.

Topic: hp/rig/{RIG_ID}/esp32/{DEVICE_ID}/vibration
       hp/rig/{RIG_ID}/esp32/{DEVICE_ID}/status
"""
from __future__ import annotations

import json
import logging
import math
import random
import time
from collections import deque

import numpy as np
import paho.mqtt.client as mqtt

try:
    import smbus2
    _SMBUS_AVAILABLE = True
except ImportError:
    _SMBUS_AVAILABLE = False

from config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("mpu6050-bridge")

# ──────────────────────────────────────────────
# MPU-6050 Register Map
# ──────────────────────────────────────────────
# AD0 low (default); use 0x69 if AD0 is pulled high
MPU6050_ADDR = 0x68
PWR_MGMT_1 = 0x6B
ACCEL_CONFIG = 0x1C
ACCEL_XOUT_H = 0x3B

# Accelerometer full-scale range → sensitivity (LSB/g)
_FS_SEL = {
    "2g":  (0b00 << 3, 16384.0),
    "4g":  (0b01 << 3,  8192.0),
    "8g":  (0b10 << 3,  4096.0),
    "16g": (0b11 << 3,  2048.0),
}


class MPU6050:
    """Thin driver for the MPU-6050 accelerometer."""

    def __init__(self, bus_num: int = 1, address: int = MPU6050_ADDR,
                 full_scale: str = "4g") -> None:
        self._bus = smbus2.SMBus(bus_num)
        self._addr = address
        reg, self._sensitivity = _FS_SEL[full_scale]

        # Wake device (clear sleep bit)
        self._bus.write_byte_data(self._addr, PWR_MGMT_1, 0x00)
        time.sleep(0.1)

        # Set full-scale range
        self._bus.write_byte_data(self._addr, ACCEL_CONFIG, reg)
        time.sleep(0.05)
        logger.info("MPU-6050 initialised at 0x%02X, range=%s, sensitivity=%.0f LSB/g",
                    address, full_scale, self._sensitivity)

    def _read_word_signed(self, reg: int) -> int:
        high = self._bus.read_byte_data(self._addr, reg)
        low = self._bus.read_byte_data(self._addr, reg + 1)
        val = (high << 8) | low
        return val - 65536 if val > 32767 else val

    def read_accel_g(self) -> tuple[float, float, float]:
        """Return (x, y, z) in g."""
        x = self._read_word_signed(ACCEL_XOUT_H) / self._sensitivity
        y = self._read_word_signed(ACCEL_XOUT_H + 2) / self._sensitivity
        z = self._read_word_signed(ACCEL_XOUT_H + 4) / self._sensitivity
        return x, y, z

    def close(self) -> None:
        self._bus.close()


class MockMPU6050:
    """Software sensor that generates realistic sine-wave vibration data.
    Used when MOCK_SENSOR=true in .env or when no physical MPU-6050 is found.
    """

    def __init__(self) -> None:
        self._t = 0.0
        logger.warning(
            "MockMPU6050 active – generating synthetic vibration data. "
            "Set MOCK_SENSOR=false and wire a real MPU-6050 for live data."
        )

    def read_accel_g(self) -> tuple[float, float, float]:
        self._t += 0.01
        # Simulate ~15 Hz dominant vibration + noise
        x = 0.03 * math.sin(2 * math.pi * 15 * self._t) + \
            random.gauss(0, 0.005)
        y = 0.02 * math.sin(2 * math.pi * 15 * self._t +
                            1.0) + random.gauss(0, 0.004)
        z = 1.0 + 0.01 * math.sin(2 * math.pi * 8 *
                                  self._t) + random.gauss(0, 0.003)
        return x, y, z

    def close(self) -> None:
        pass


# ──────────────────────────────────────────────
# Vibration Metrics
# ──────────────────────────────────────────────

def compute_vibration_metrics(
    samples_x: list[float],
    samples_y: list[float],
    samples_z: list[float],
    sample_rate_hz: float,
    noise_floor_g: float | None = None,
) -> dict:
    """
    Compute vibration KPIs from a window of raw accelerometer samples.
    Returns a dict compatible with the DrillSense ESP32 payload format.
    """
    ax = np.array(samples_x, dtype=np.float64)
    ay = np.array(samples_y, dtype=np.float64)
    az = np.array(samples_z, dtype=np.float64)

    # Remove DC component (static tilt + gravity) from ALL axes.
    # This isolates the dynamic (vibration) signal regardless of sensor orientation.
    ax_dyn = ax - np.mean(ax)
    ay_dyn = ay - np.mean(ay)
    az_dyn = az - np.mean(az)

    # Combine axes: vector magnitude of AC components only
    mag = np.sqrt(ax_dyn**2 + ay_dyn**2 + az_dyn**2)

    # RMS in g per axis
    x_rms_g = float(np.sqrt(np.mean(ax_dyn**2)))
    y_rms_g = float(np.sqrt(np.mean(ay_dyn**2)))
    z_rms_g = float(np.sqrt(np.mean(az_dyn**2)))

    # Overall metrics (combined magnitude)
    rms_g = float(np.sqrt(np.mean(mag**2)))
    peak_g = float(np.max(np.abs(mag)))
    peak2peak_g = float(np.max(mag) - np.min(mag))
    crest_factor = float(peak_g / rms_g) if rms_g > 1e-9 else 0.0

    # FFT → dominant frequency (exclude DC bin 0)
    n = len(mag)
    fft = np.abs(np.fft.rfft(mag))
    freqs = np.fft.rfftfreq(n, d=1.0 / sample_rate_hz)
    fft[0] = 0.0          # zero out DC
    dom_idx = int(np.argmax(fft))
    dominant_hz = float(freqs[dom_idx]) if dom_idx > 0 else 0.0

    # Convert peak g → mm/s at dominant frequency  (v = a / (2π·f))
    # Using peak acceleration in m/s² = peak_g * 9.81
    if dominant_hz > 0.5 and rms_g > (noise_floor_g if noise_floor_g is not None else settings.NOISE_FLOOR_G):
        peak_mms = (peak_g * 9810.0) / (2.0 * math.pi * dominant_hz)
        rms_mms = peak_mms / math.sqrt(2.0)
        p2p_mms = peak_mms * 2.0
    else:
        peak_mms = rms_mms = p2p_mms = 0.0

    return {
        "accel": {
            "x_rms_g": round(x_rms_g, 4),
            "y_rms_g": round(y_rms_g, 4),
            "z_rms_g": round(z_rms_g, 4),
        },
        "vibration": {
            "rms_mms":       round(rms_mms,       3),
            "peak_mms":      round(peak_mms,       3),
            "peak2peak_mms": round(p2p_mms,        3),
            "crest_factor":  round(crest_factor,   3),
            "dominant_hz":   round(dominant_hz,    2),
        },
    }


# ──────────────────────────────────────────────
# MQTT Publisher
# ──────────────────────────────────────────────

class Bridge:
    def __init__(self) -> None:
        # Choose sensor: mock mode, or auto-detect real hardware
        if settings.MOCK_SENSOR or not _SMBUS_AVAILABLE:
            self._mpu = MockMPU6050()
        else:
            try:
                self._mpu = MPU6050(
                    bus_num=settings.I2C_BUS,
                    address=settings.MPU6050_ADDR,
                    full_scale=settings.FULL_SCALE,
                )
            except Exception as exc:
                logger.warning(
                    "MPU-6050 not found (%s) — falling back to MockMPU6050. "
                    "Set MOCK_SENSOR=true in .env to suppress this warning.",
                    exc,
                )
                self._mpu = MockMPU6050()
        self._client = mqtt.Client(
            callback_api_version=mqtt.CallbackAPIVersion.VERSION1,
            client_id=f"pi-bridge-{settings.DEVICE_ID}",
        )
        self._connected = False
        self._client.on_connect = self._on_connect
        self._client.on_disconnect = self._on_disconnect
        self._client.on_message = self._on_message

        self._vib_topic = (
            f"hp/rig/{settings.RIG_ID}/esp32/{settings.DEVICE_ID}/vibration"
        )
        self._status_topic = (
            f"hp/rig/{settings.RIG_ID}/esp32/{settings.DEVICE_ID}/status"
        )
        self._config_topic = (
            f"hp/rig/{settings.RIG_ID}/esp32/{settings.DEVICE_ID}/config"
        )

        # Runtime-tunable filter parameters (can be overridden via MQTT config)
        self.noise_floor_g: float = settings.NOISE_FLOOR_G
        self.smoothing_alpha: float = settings.SMOOTHING_ALPHA

    def _on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            self._connected = True
            logger.info("MQTT connected to %s:%s",
                        settings.MQTT_BROKER, settings.MQTT_PORT)
            # Subscribe to config commands from the backend
            client.subscribe(self._config_topic)
            logger.info("Subscribed to config topic: %s", self._config_topic)
            self._publish_status()
        else:
            logger.error("MQTT connection failed rc=%s", rc)

    def _on_disconnect(self, client, userdata, rc):
        self._connected = False
        logger.warning("MQTT disconnected rc=%s – will retry", rc)

    def _on_message(self, client, userdata, msg):
        """Handle incoming config commands from the DrillSense backend."""
        try:
            cmd = json.loads(msg.payload.decode())
        except Exception:
            logger.warning("Ignoring malformed config message")
            return
        if cmd.get("cmd") not in ("config", "calibrate"):
            return
        if "noise_floor_g" in cmd:
            self.noise_floor_g = float(cmd["noise_floor_g"])
            logger.info("noise_floor_g updated → %.4f g", self.noise_floor_g)
        if "smoothing_alpha" in cmd:
            self.smoothing_alpha = float(cmd["smoothing_alpha"])
            logger.info("smoothing_alpha updated → %.2f", self.smoothing_alpha)

    def _publish_status(self) -> None:
        payload = {
            "device_id":   settings.DEVICE_ID,
            "name":        f"Pi MPU-6050 ({settings.DEVICE_ID})",
            "firmware":    "pi-bridge-1.0",
            "wifi_rssi": -40,
            "sample_rate": settings.SAMPLE_RATE_HZ,
            "assigned_to": settings.ASSIGNED_TO,
            "calibration_offset": {"x": 0, "y": 0, "z": 0},
        }
        self._client.publish(self._status_topic,
                             json.dumps(payload), retain=True)

    def _publish_vibration(self, metrics: dict) -> None:
        payload = {
            "device_id":   settings.DEVICE_ID,
            "assigned_to": settings.ASSIGNED_TO,
            "firmware":    "pi-bridge-1.0",
            "wifi_rssi": -40,
            "sample_rate": settings.SAMPLE_RATE_HZ,
            **metrics,
        }
        self._client.publish(self._vib_topic, json.dumps(payload))
        logger.debug("Published vibration: %s", payload["vibration"])

    def connect(self) -> None:
        self._client.connect(settings.MQTT_BROKER,
                             settings.MQTT_PORT, keepalive=60)
        self._client.loop_start()

    def run(self) -> None:
        self.connect()
        logger.info(
            "Bridge running – RIG=%s DEVICE=%s → %s:%s",
            settings.RIG_ID, settings.DEVICE_ID,
            settings.MQTT_BROKER, settings.MQTT_PORT,
        )

        buf_x: deque[float] = deque(maxlen=settings.WINDOW_SAMPLES)
        buf_y: deque[float] = deque(maxlen=settings.WINDOW_SAMPLES)
        buf_z: deque[float] = deque(maxlen=settings.WINDOW_SAMPLES)

        interval = 1.0 / settings.SAMPLE_RATE_HZ
        last_publish = time.monotonic()
        # Exponential moving average state (reset when alpha changes significantly)
        ema_rms: float | None = None
        ema_peak: float | None = None
        ema_p2p: float | None = None

        while True:
            t0 = time.monotonic()

            try:
                x, y, z = self._mpu.read_accel_g()
                buf_x.append(x)
                buf_y.append(y)
                buf_z.append(z)
            except OSError as exc:
                logger.error(
                    "I2C read error: %s — switching to MockMPU6050", exc)
                self._mpu = MockMPU6050()
                continue

            now = time.monotonic()
            if (now - last_publish) >= settings.PUBLISH_INTERVAL_S and \
               len(buf_x) >= settings.WINDOW_SAMPLES:
                metrics = compute_vibration_metrics(
                    list(buf_x), list(buf_y), list(buf_z),
                    settings.SAMPLE_RATE_HZ,
                    noise_floor_g=self.noise_floor_g,
                )
                # Apply EMA smoothing — alpha is read live so UI changes take effect instantly
                alpha = self.smoothing_alpha
                raw_rms = metrics["vibration"]["rms_mms"]
                raw_peak = metrics["vibration"]["peak_mms"]
                raw_p2p = metrics["vibration"]["peak2peak_mms"]
                if ema_rms is None:
                    ema_rms, ema_peak, ema_p2p = raw_rms, raw_peak, raw_p2p
                else:
                    ema_rms = alpha * raw_rms + (1 - alpha) * ema_rms
                    ema_peak = alpha * raw_peak + (1 - alpha) * ema_peak
                    ema_p2p = alpha * raw_p2p + (1 - alpha) * ema_p2p
                metrics["vibration"]["rms_mms"] = round(ema_rms,  3)
                metrics["vibration"]["peak_mms"] = round(ema_peak, 3)
                metrics["vibration"]["peak2peak_mms"] = round(ema_p2p,  3)
                if self._connected:
                    self._publish_vibration(metrics)
                last_publish = now

            elapsed = time.monotonic() - t0
            sleep_s = max(0.0, interval - elapsed)
            time.sleep(sleep_s)

    def stop(self) -> None:
        self._client.loop_stop()
        self._client.disconnect()
        self._mpu.close()


if __name__ == "__main__":
    # ── Startup health check ─────────────────────────────────────────────
    logger.info("=" * 60)
    logger.info("DrillSense Pi Bridge — Startup Diagnostics")
    logger.info("=" * 60)
    logger.info("  RIG_ID        : %s", settings.RIG_ID)
    logger.info("  DEVICE_ID     : %s", settings.DEVICE_ID)
    logger.info("  ASSIGNED_TO   : %s", settings.ASSIGNED_TO)
    logger.info("  MOCK_SENSOR   : %s", settings.MOCK_SENSOR)
    logger.info("  MQTT_BROKER   : %s:%s",
                settings.MQTT_BROKER, settings.MQTT_PORT)
    logger.info("  SAMPLE_RATE   : %s Hz", settings.SAMPLE_RATE_HZ)
    logger.info("  PUBLISH_EVERY : %s s", settings.PUBLISH_INTERVAL_S)
    logger.info("  WINDOW_SAMPLES: %s", settings.WINDOW_SAMPLES)

    # Check smbus2
    if _SMBUS_AVAILABLE:
        logger.info("  smbus2        : OK (installed)")
    else:
        logger.warning(
            "  smbus2        : NOT installed — mock sensor will be used")
        logger.warning("    → install with: pip install smbus2")

    # Check I2C bus (only if not in mock mode)
    if not settings.MOCK_SENSOR and _SMBUS_AVAILABLE:
        try:
            import smbus2 as _smbus2
            _bus = _smbus2.SMBus(settings.I2C_BUS)
            # Try reading WHO_AM_I register (0x75) — MPU-6050 returns 0x68
            _who = _bus.read_byte_data(settings.MPU6050_ADDR, 0x75)
            _bus.close()
            if _who == 0x68:
                logger.info("  I2C / MPU-6050: OK (WHO_AM_I=0x68 at bus %d addr 0x%02X)",
                            settings.I2C_BUS, settings.MPU6050_ADDR)
            else:
                logger.warning(
                    "  I2C / MPU-6050: Unexpected WHO_AM_I=0x%02X — may not be MPU-6050", _who)
        except Exception as _e:
            logger.error("  I2C / MPU-6050: FAILED (%s)", _e)
            logger.error(
                "    → Check wiring, enable I2C: sudo raspi-config → Interface Options → I2C")
            logger.warning("    → Falling back to mock sensor")
    elif settings.MOCK_SENSOR:
        logger.info("  I2C / MPU-6050: SKIPPED (MOCK_SENSOR=true)")

    # Test MQTT reachability
    import socket as _socket
    try:
        _sock = _socket.create_connection(
            (settings.MQTT_BROKER, settings.MQTT_PORT), timeout=3)
        _sock.close()
        logger.info("  MQTT port     : OK (%s:%s reachable)",
                    settings.MQTT_BROKER, settings.MQTT_PORT)
    except Exception as _e:
        logger.error("  MQTT port     : FAILED — %s", _e)
        logger.error(
            "    → Is Mosquitto running? sudo systemctl status mosquitto")

    logger.info("=" * 60)
    logger.info("Starting bridge loop...")
    logger.info("=" * 60)

    bridge = Bridge()
    try:
        bridge.run()
    except KeyboardInterrupt:
        logger.info("Stopped by user.")
    finally:
        bridge.stop()
