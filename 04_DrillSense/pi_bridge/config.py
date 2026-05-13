"""
Configuration for the Pi MPU-6050 Bridge.
All values can be overridden via environment variables or a .env file.
"""
from __future__ import annotations
from pydantic_settings import BaseSettings


class BridgeSettings(BaseSettings):
    # ── MQTT ─────────────────────────────────────────────────────────────────
    # On the Pi the MQTT broker runs locally alongside the FastAPI backend
    MQTT_BROKER: str = "localhost"
    MQTT_PORT: int = 1883

    # ── DrillSense identity ───────────────────────────────────────────────────
    RIG_ID: str = "247"
    DEVICE_ID: str = "pi-mpu6050"        # shows up as ESP32 device in the UI
    ASSIGNED_TO: str = "drawworks"       # drawworks | mudpump_1 | …

    # ── MPU-6050 hardware ─────────────────────────────────────────────────────
    I2C_BUS: int = 1                     # /dev/i2c-1  (default on Pi 2/3/4/5)
    MPU6050_ADDR: int = 0x68             # 0x68 (AD0=GND) or 0x69 (AD0=3.3V)
    FULL_SCALE: str = "4g"               # "2g" | "4g" | "8g" | "16g"

    # Set MOCK_SENSOR=true in .env if no physical MPU-6050 is connected.
    # The bridge will then publish realistic synthetic vibration data.
    MOCK_SENSOR: bool = False

    # ── Sampling ──────────────────────────────────────────────────────────────
    SAMPLE_RATE_HZ: int = 100            # read frequency (Hz)
    # samples per FFT window (= 1 s at 100 Hz)
    WINDOW_SAMPLES: int = 100
    PUBLISH_INTERVAL_S: float = 1.0      # how often to push MQTT (seconds)

    # ── Sensitivity / Filtering ───────────────────────────────────────────────
    # Signals below this RMS level are clamped to 0 (sensor self-noise / desk bumps).
    # Raise this value if you still see false readings when the machine is idle.
    # 0.025 = 25 mg ≈ good starting point; try 0.05 for very noisy environments.
    NOISE_FLOOR_G: float = 0.025

    # Exponential moving average for the published mm/s value (0 < alpha ≤ 1).
    # Lower alpha = more smoothing / slower reaction to real changes.
    # 0.2 = heavy smoothing (good for slow-changing machinery)
    # 0.5 = medium  |  1.0 = no smoothing
    SMOOTHING_ALPHA: float = 0.2

    class Config:
        env_file = ".env"


settings = BridgeSettings()
