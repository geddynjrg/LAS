#!/bin/bash
# Monitor inbound reachability for loans.uwezo.go.ke dual-IP failover.
# Checks local nginx, interface binding, and both public IPs.
set -euo pipefail

PRIMARY_IP="${PRIMARY_IP:-41.76.170.249}"
SECONDARY_IP="${SECONDARY_IP:-197.248.173.243}"
SITE_HOST="${SITE_HOST:-loans.uwezo.go.ke}"
LOG_FILE="${LOG_FILE:-/var/log/uwezo-ip-failover-health.log}"
STATE_FILE="${STATE_FILE:-/var/run/uwezo-ip-failover-health.state}"
ALERT_FILE="${ALERT_FILE:-/var/run/uwezo-ip-failover-health.alert}"
TIMEOUT="${TIMEOUT:-10}"

log() {
  echo "[$(date -Is)] $*" | tee -a "${LOG_FILE}"
}

has_ip() {
  ip -4 addr show | grep -qw "inet ${1}/"
}

check_https() {
  local url="$1"
  local code
  code="$(curl -sk --max-time "${TIMEOUT}" -H "Host: ${SITE_HOST}" -o /dev/null -w '%{http_code}' "${url}" 2>/dev/null || echo "000")"
  [[ "${code}" =~ ^[23] ]]
}

check_http_health() {
  local url="$1"
  local code
  code="$(curl -s --max-time "${TIMEOUT}" -H "Host: ${SITE_HOST}" -o /dev/null -w '%{http_code}' "${url}" 2>/dev/null || echo "000")"
  [[ "${code}" == "200" ]]
}

check_tcp() {
  local ip="$1"
  local port="${2:-443}"
  timeout 3 bash -c "echo >/dev/tcp/${ip}/${port}" 2>/dev/null
}

local_ok=0
primary_ok=0
secondary_ok=0
primary_bound=0
secondary_bound=0

if check_http_health "http://127.0.0.1/failover-health"; then
  local_ok=1
fi

if has_ip "${PRIMARY_IP}"; then
  primary_bound=1
fi

if has_ip "${SECONDARY_IP}"; then
  secondary_bound=1
fi

if check_https "https://${PRIMARY_IP}/failover-health"; then
  primary_ok=1
elif check_http_health "http://${PRIMARY_IP}/failover-health"; then
  primary_ok=1
elif check_tcp "${PRIMARY_IP}" 443; then
  primary_ok=1
fi

if check_https "https://${SECONDARY_IP}/failover-health"; then
  secondary_ok=1
elif check_http_health "http://${SECONDARY_IP}/failover-health"; then
  secondary_ok=1
elif check_tcp "${SECONDARY_IP}" 443; then
  secondary_ok=1
fi

# eth1 private path proves nginx serves Safaricom-side traffic when port-forwarded
if [[ "${secondary_ok}" -eq 0 ]] && check_http_health "http://192.168.1.172/failover-health"; then
  log "secondary public IP unreachable externally; nginx OK on eth1 (192.168.1.172) — Safaricom port-forward likely missing"
fi

summary="local=${local_ok} primary=${PRIMARY_IP}:${primary_ok} secondary=${SECONDARY_IP}:${secondary_ok} bound_primary=${primary_bound} bound_secondary=${secondary_bound}"
log "${summary}"

{
  echo "checked_at=$(date -Is)"
  echo "local_ok=${local_ok}"
  echo "primary_ip=${PRIMARY_IP}"
  echo "primary_ok=${primary_ok}"
  echo "primary_bound=${primary_bound}"
  echo "secondary_ip=${SECONDARY_IP}"
  echo "secondary_ok=${secondary_ok}"
  echo "secondary_bound=${secondary_bound}"
} > "${STATE_FILE}"

if [[ "${local_ok}" -eq 0 ]]; then
  log "ALERT: local nginx/app health check failed"
  echo "local nginx unhealthy at $(date -Is)" > "${ALERT_FILE}"
  exit 2
fi

if [[ "${primary_ok}" -eq 0 && "${secondary_ok}" -eq 0 ]]; then
  log "ALERT: neither public IP is reachable on 443 (hairpin NAT may cause false negatives from this host)"
  echo "both public IPs unreachable at $(date -Is)" > "${ALERT_FILE}"
  exit 1
fi

if [[ "${primary_ok}" -eq 0 || "${secondary_ok}" -eq 0 ]]; then
  active_ip="${PRIMARY_IP}"
  [[ "${primary_ok}" -eq 0 ]] && active_ip="${SECONDARY_IP}"
  log "PARTIAL: only one public IP reachable; DNS should prefer ${active_ip}"
  echo "prefer_dns=${active_ip} at $(date -Is)" > "${ALERT_FILE}"
  exit 0
fi

rm -f "${ALERT_FILE}"
log "OK: both public IPs reachable (or local + at least one public path up)"
exit 0
