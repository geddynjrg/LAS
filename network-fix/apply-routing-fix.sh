#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

run_root() {
  docker run --rm --privileged --net=host -v /:/host alpine chroot /host "$@"
}

install_file() {
  local src="$1"
  local dest="$2"
  local mode="${3:-644}"
  run_root sh -c "cp '${src}' '${dest}' && chmod '${mode}' '${dest}'"
}

echo "Installing netplan (eth0 preferred metric 50, eth1 backup metric 100)"
install_file "${SCRIPT_DIR}/00-installer-config.yaml" /etc/netplan/00-installer-config.yaml 600

echo "Installing eth1 static IP guard (prevents dhclient override)"
install_file "${SCRIPT_DIR}/uwezo-eth1-static.sh" /usr/local/sbin/uwezo-eth1-static.sh 755
install_file "${SCRIPT_DIR}/uwezo-eth1-static.service" /etc/systemd/system/uwezo-eth1-static.service 644

echo "Installing route failover script and systemd units"
install_file "${SCRIPT_DIR}/uwezo-route-failover.sh" /usr/local/sbin/uwezo-route-failover.sh 755
install_file "${SCRIPT_DIR}/uwezo-route-failover.service" /etc/systemd/system/uwezo-route-failover.service 644
install_file "${SCRIPT_DIR}/uwezo-route-failover.timer" /etc/systemd/system/uwezo-route-failover.timer 644

echo "Disabling legacy eth1-only service"
run_root sh -c "rm -f /etc/systemd/system/multi-user.target.wants/uwezo-eth1-route.service"

echo "Enabling eth1 static guard and failover service/timer"
run_root sh -c "ln -sf /etc/systemd/system/uwezo-eth1-static.service /etc/systemd/system/multi-user.target.wants/uwezo-eth1-static.service"
run_root sh -c "ln -sf /etc/systemd/system/uwezo-route-failover.service /etc/systemd/system/multi-user.target.wants/uwezo-route-failover.service"
run_root sh -c "ln -sf /etc/systemd/system/uwezo-route-failover.timer /etc/systemd/system/timers.target.wants/uwezo-route-failover.timer"

echo "Applying eth1 static IP now"
run_root /usr/local/sbin/uwezo-eth1-static.sh

echo "Applying route selection now"
run_root /usr/local/sbin/uwezo-route-failover.sh

echo "Current default routes:"
ip route show default

curl -sk --connect-timeout 8 -o /dev/null -w "outbound test: %{http_code} %{time_total}s\n" https://github.com

echo "Done. eth0 is preferred when NAT path is up; eth1 is used automatically otherwise."
