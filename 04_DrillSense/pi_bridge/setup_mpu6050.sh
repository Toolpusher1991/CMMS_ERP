#!/usr/bin/env bash
# ============================================================
# DrillSense MPU-6050 Pi Setup
# Führe dieses Script auf dem Raspberry Pi aus:
#   chmod +x setup_mpu6050.sh && sudo ./setup_mpu6050.sh
# ============================================================
set -e

REPO_DIR="/home/drillsense/CMMS_ERP"
BRIDGE_DIR="${REPO_DIR}/04_DrillSense/pi_bridge"
VENV_DIR="${BRIDGE_DIR}/venv"
SERVICE_USER="drillsense"

echo "=== 1. I2C aktivieren (falls nötig) ==="
if ! grep -q "^dtparam=i2c_arm=on" /boot/config.txt; then
  echo "dtparam=i2c_arm=on" >> /boot/config.txt
  echo "  → I2C in /boot/config.txt aktiviert. Reboot nötig nach Setup."
fi
raspi-config nonint do_i2c 0 2>/dev/null || true
modprobe i2c-dev 2>/dev/null || true

echo "=== 2. System-Pakete ==="
apt-get install -y python3-pip python3-venv i2c-tools

echo "=== 3. I2C Test (MPU-6050 sollte bei 0x68 auftauchen) ==="
i2cdetect -y 1 || echo "  WARNUNG: i2cdetect fehlgeschlagen — Verkabelung prüfen"

echo "=== 4. Python venv + Dependencies ==="
python3 -m venv "${VENV_DIR}"
"${VENV_DIR}/bin/pip" install --upgrade pip
"${VENV_DIR}/bin/pip" install -r "${BRIDGE_DIR}/requirements.txt"

echo "=== 5. .env Datei ==="
ENV_FILE="${BRIDGE_DIR}/.env"
if [ ! -f "${ENV_FILE}" ]; then
cat > "${ENV_FILE}" << 'ENVEOF'
MQTT_BROKER=localhost
MQTT_PORT=1883
RIG_ID=247
DEVICE_ID=pi-mpu6050
ASSIGNED_TO=drawworks
I2C_BUS=1
MPU6050_ADDR=0x68
FULL_SCALE=4g
MOCK_SENSOR=false
SAMPLE_RATE_HZ=100
PUBLISH_INTERVAL_S=1.0
NOISE_FLOOR_G=0.025
SMOOTHING_ALPHA=0.2
ENVEOF
  echo "  → .env angelegt. Bitte ASSIGNED_TO anpassen (drawworks | mudpump_1 | …)"
else
  echo "  → .env existiert bereits, wird nicht überschrieben"
fi
chown ${SERVICE_USER}:${SERVICE_USER} "${ENV_FILE}"
chmod 640 "${ENV_FILE}"

echo "=== 6. Systemd Service: drillsense-bridge ==="
cat > /etc/systemd/system/drillsense-bridge.service << SVCEOF
[Unit]
Description=DrillSense MPU-6050 MQTT Bridge
After=network.target mosquitto.service drillsense-backend.service
Requires=drillsense-backend.service

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${BRIDGE_DIR}
EnvironmentFile=${ENV_FILE}
ExecStart=${VENV_DIR}/bin/python ${BRIDGE_DIR}/mpu6050_bridge.py
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
systemctl enable drillsense-bridge
systemctl restart drillsense-bridge

echo ""
echo "=== Fertig! ==="
echo "Status:  sudo systemctl status drillsense-bridge"
echo "Logs:    sudo journalctl -u drillsense-bridge -f"
echo ""
echo "MQTT Topics (RIG 247, Device pi-mpu6050):"
echo "  hp/rig/247/esp32/pi-mpu6050/vibration"
echo "  hp/rig/247/esp32/pi-mpu6050/status"
echo ""
echo "API Endpoint:"
echo "  http://localhost:8001/api/v1/esp32/"
echo ""
echo "Wiring MPU-6050 → Raspberry Pi 4:"
echo "  VCC  → Pin 1  (3.3V)"
echo "  GND  → Pin 6  (GND)"
echo "  SDA  → Pin 3  (GPIO2 / I2C1 SDA)"
echo "  SCL  → Pin 5  (GPIO3 / I2C1 SCL)"
echo "  AD0  → GND    (Adresse 0x68)"
echo "  INT  → nicht verwendet"
