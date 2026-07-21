#!/bin/bash
# Prefer outbound traffic via eth0 (ISP NAT). Fall back to eth1 (direct public IP).
set -euo pipefail

ETH0_IF=eth0
ETH0_GW=10.190.12.254
ETH1_IF=eth1
ETH1_GW=197.248.173.241
CHECK_HOST=8.8.8.8
STATE_FILE=/var/run/uwezo-route-failover.state

log() {
  echo "[$(date -Is)] $*"
}

if ping -I "${ETH0_IF}" -c 2 -W 3 "${CHECK_HOST}" >/dev/null 2>&1; then
  ip route replace default via "${ETH0_GW}" dev "${ETH0_IF}" metric 50
  ip route replace default via "${ETH1_GW}" dev "${ETH1_IF}" metric 100
  new_state=eth0
  log "eth0 NAT path is up — default via ${ETH0_GW} (eth1 backup metric 100)"
else
  ip route del default via "${ETH0_GW}" dev "${ETH0_IF}" 2>/dev/null || true
  ip route replace default via "${ETH1_GW}" dev "${ETH1_IF}" metric 50
  new_state=eth1
  log "eth0 NAT path unavailable — default via ${ETH1_GW} on ${ETH1_IF}"
fi

if [[ -f "${STATE_FILE}" ]] && [[ "$(cat "${STATE_FILE}")" == "${new_state}" ]]; then
  exit 0
fi

echo "${new_state}" > "${STATE_FILE}"
log "Active outbound interface changed to ${new_state}"
