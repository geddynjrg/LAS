#!/bin/bash
# Prevent dhclient from overriding eth1 static IP (197.248.173.243/29).
# Netplan sets dhcp4: no; this stops stray dhclient processes and restores the address if missing.
set -euo pipefail

ETH1_IF=eth1
ETH1_IP=197.248.173.243
ETH1_PREFIX=29
ETH1_GW=197.248.173.241

log() {
  echo "[$(date -Is)] uwezo-eth1-static: $*"
}

if killall dhclient 2>/dev/null; then
  log "stopped dhclient"
fi
killall -9 dhclient 2>/dev/null || true

rm -f /run/dhclient*.pid /var/lib/dhcp/dhclient.leases

if ! ip -4 addr show dev "${ETH1_IF}" | grep -q "inet ${ETH1_IP}/${ETH1_PREFIX}"; then
  ip addr add "${ETH1_IP}/${ETH1_PREFIX}" dev "${ETH1_IF}"
  log "restored ${ETH1_IP}/${ETH1_PREFIX} on ${ETH1_IF}"
fi

ip link set "${ETH1_IF}" up

if ! ip route show default dev "${ETH1_IF}" | grep -q "${ETH1_GW}"; then
  ip route replace default via "${ETH1_GW}" dev "${ETH1_IF}" metric 100
  log "restored default route via ${ETH1_GW} on ${ETH1_IF} (metric 100)"
fi

log "eth1 static IP OK: $(ip -4 -br addr show dev "${ETH1_IF}")"
