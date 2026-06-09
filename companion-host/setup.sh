#!/bin/bash
# Run on Raspberry Pi 4 as root after fresh Raspberry Pi OS install

set -euo pipefail

apt-get update && apt-get install -y cups cups-client printer-driver-gutenprint python3

cupsctl --remote-any
systemctl restart cups

lpadmin -p DNP_DS620A \
  -E \
  -v usb://DNP/DS620A \
  -m everywhere \
  -o media=w288h432 || echo "Configure printer URI manually if USB path differs"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE_FILE="/etc/systemd/system/photobooth-printer.service"

cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Photobooth Companion Print Server
After=network.target cups.service

[Service]
ExecStart=/usr/bin/python3 ${SCRIPT_DIR}/server.py
Restart=always
RestartSec=5
Environment=PRINT_TOKEN=changeme
Environment=PRINT_PORT=8181

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable photobooth-printer
systemctl restart photobooth-printer

echo "Companion host setup complete. Service: photobooth-printer (port 8181)."
